import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Gamepad2, Usb, Cpu, Vibrate, Activity, Zap, Info, Gamepad,
  ArrowLeft, ArrowRight, RotateCw,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ControllerVisual } from '@/components/ControllerVisual';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGamepad } from '@/hooks/useGamepad';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { incrementButtonStat, logControllerEvent, upsertControllerDevice } from '@/lib/api';
import { GAMEPAD_BUTTON_NAMES, DEFAULT_MAPPINGS } from '@/lib/constants';
import { classNames } from '@/lib/utils';

interface ButtonEventLog {
  id: string;
  button: string;
  value: number;
  timestamp: number;
}

export function ControllerTesterPage() {
  const { vibrationEnabled, pollingInterval } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();

  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set());
  const [stickPositions, setStickPositions] = useState({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
  const [triggerValues, setTriggerValues] = useState({ lt: 0, rt: 0 });
  const [eventLog, setEventLog] = useState<ButtonEventLog[]>([]);
  const [pressCounts, setPressCounts] = useState<Record<string, number>>({});
  const [vibrationStrength, setVibrationStrength] = useState(0.5);
  const [vibrationDuration, setVibrationDuration] = useState(500);
  const [deviceSaved, setDeviceSaved] = useState(false);

  const statsBufferRef = useRef<Map<string, number>>(new Map());
  const statsFlushTimerRef = useRef<number>(0);
  const lastLogTimeRef = useRef<Record<string, number>>({});

  // Batch button stat increments — flush every 2 seconds
  useEffect(() => {
    const flush = async () => {
      const buffer = statsBufferRef.current;
      if (buffer.size === 0) return;
      const entries = [...buffer.entries()];
      buffer.clear();
      for (const [button, count] of entries) {
        try {
          // Direct upsert approach
          for (let i = 0; i < count; i++) {
            await incrementButtonStat(button);
          }
        } catch {
          // Silently ignore — stats are non-critical
        }
      }
    };
    statsFlushTimerRef.current = window.setInterval(flush, 2000);
    return () => clearInterval(statsFlushTimerRef.current);
  }, []);

  const onButtonPress = useCallback((name: string, value: number) => {
    // Log event
    const now = Date.now();
    const lastTime = lastLogTimeRef.current[name] ?? 0;
    if (now - lastTime > 50) {
      setEventLog(prev => [{ id: crypto.randomUUID(), button: name, value, timestamp: now }, ...prev].slice(0, 30));
      lastLogTimeRef.current[name] = now;
    }

    // Count presses
    setPressCounts(prev => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }));

    // Buffer for batch DB write
    statsBufferRef.current.set(name, (statsBufferRef.current.get(name) ?? 0) + 1);

    // Log to controller_events table
    logControllerEvent('button_press', name, value).catch(() => {});
  }, []);

  const onAxisMove = useCallback((axisName: string, x: number, y: number) => {
    setStickPositions(prev => {
      if (axisName === 'LeftX') return { ...prev, left: { ...prev.left, x } };
      if (axisName === 'LeftY') return { ...prev, left: { ...prev.left, y } };
      if (axisName === 'RightX') return { ...prev, right: { ...prev.right, x } };
      if (axisName === 'RightY') return { ...prev, right: { ...prev.right, y } };
      return prev;
    });
  }, []);

  const { gamepadState, triggerVibration } = useGamepad({ pollingInterval, onButtonPress, onAxisMove });

  // Update pressed buttons and trigger values from gamepad state
  useEffect(() => {
    if (!gamepadState.connected) {
      setPressedButtons(new Set());
      setTriggerValues({ lt: 0, rt: 0 });
      return;
    }
    const pressed = new Set<string>();
    gamepadState.buttons.forEach(b => {
      if (b.pressed) pressed.add(b.name);
    });
    setPressedButtons(pressed);

    // Triggers
    const ltBtn = gamepadState.buttons.find(b => b.name === 'LT');
    const rtBtn = gamepadState.buttons.find(b => b.name === 'RT');
    setTriggerValues({ lt: ltBtn?.value ?? 0, rt: rtBtn?.value ?? 0 });
  }, [gamepadState]);

  // Save controller device info on connect
  useEffect(() => {
    if (gamepadState.connected && !deviceSaved && user) {
      upsertControllerDevice({
        controller_name: gamepadState.id,
        button_count: gamepadState.buttonCount,
        axis_count: gamepadState.axisCount,
        vibration_support: gamepadState.vibrationSupport,
      }).then(() => setDeviceSaved(true)).catch(() => {});
    }
    if (!gamepadState.connected) setDeviceSaved(false);
  }, [gamepadState.connected, gamepadState.id, deviceSaved, user]);

  const handleVibrationTest = async () => {
    if (!gamepadState.vibrationSupport) {
      toast('This controller does not support browser vibration.', 'warning');
      return;
    }
    if (!vibrationEnabled) {
      toast('Vibration is disabled in settings. Enable it to test.', 'warning');
      return;
    }
    const ok = await triggerVibration(vibrationStrength, vibrationDuration);
    if (ok) {
      toast(`Vibration test: ${Math.round(vibrationStrength * 100)}% for ${vibrationDuration}ms`, 'success');
    } else {
      toast('Vibration test failed.', 'error');
    }
  };

  const leftStick = gamepadState.axes.find(a => a.name === 'LeftX' || a.name === 'LeftY');
  const rightStick = gamepadState.axes.find(a => a.name === 'RightX' || a.name === 'RightY');
  const leftStickData = gamepadState.axes.filter(a => a.name.startsWith('Left'));
  const rightStickData = gamepadState.axes.filter(a => a.name.startsWith('Right'));

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-white mb-1">Controller Tester</h1>
        <p className="text-white/50 text-sm">Real-time testing with the native Gamepad API. Connect a controller and press any button.</p>
      </div>

      {!gamepadState.connected ? (
        <div className="card p-8">
          <EmptyState
            icon={<Gamepad2 className="w-10 h-10" />}
            title="NO CONTROLLER DETECTED"
            subtitle="Connect your controller via USB or Bluetooth to begin testing. Press any button on the controller to wake it up."
            action={
              <div className="text-sm text-white/40 space-y-2 text-center">
                <p>1. Plug in your controller via USB</p>
                <p>2. Or pair it via Bluetooth</p>
                <p>3. Press any button to activate it</p>
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controller info bar */}
          <div className="card p-5 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Name</div>
              <div className="text-sm font-medium text-white truncate">{gamepadState.id.split('(')[0].trim()}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Status</div>
              <span className="badge badge-success"><span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-glow-pulse" />CONNECTED</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Buttons</div>
              <div className="text-sm font-mono font-bold text-white">{gamepadState.buttonCount}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Axes</div>
              <div className="text-sm font-mono font-bold text-white">{gamepadState.axisCount}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-white/40 mb-1">Index</div>
              <div className="text-sm font-mono font-bold text-white">Port {gamepadState.index}</div>
            </div>
          </div>

          {/* Visual controller + sticks */}
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6 flex items-center justify-center">
              <ControllerVisual
                pressedButtons={pressedButtons}
                stickPositions={stickPositions}
                triggerValues={triggerValues}
                size="lg"
              />
            </div>

            {/* Analog sticks + triggers */}
            <div className="space-y-4">
              {/* Analog sticks */}
              <div className="card p-5">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white/60 mb-4">Analog Sticks</h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* Left stick */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 rounded-full bg-surface-800 border border-white/10 mb-2">
                      <div className="absolute inset-2 rounded-full border border-white/5" />
                      <div
                        className="absolute top-1/2 left-1/2 w-6 h-6 rounded-full transition-all duration-75"
                        style={{
                          transform: `translate(calc(-50% + ${stickPositions.left.x * 32}px), calc(-50% + ${stickPositions.left.y * 32}px))`,
                          background: pressedButtons.has('L3') ? 'var(--accent)' : '#33334a',
                          boxShadow: pressedButtons.has('L3') ? '0 0 15px var(--accent-glow)' : 'none',
                        }}
                      />
                    </div>
                    <div className="text-xs text-white/40 font-mono">L STICK</div>
                    <div className="text-xs font-mono text-white/60 mt-1">X: {stickPositions.left.x.toFixed(2)} Y: {stickPositions.left.y.toFixed(2)}</div>
                  </div>
                  {/* Right stick */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-24 h-24 rounded-full bg-surface-800 border border-white/10 mb-2">
                      <div className="absolute inset-2 rounded-full border border-white/5" />
                      <div
                        className="absolute top-1/2 left-1/2 w-6 h-6 rounded-full transition-all duration-75"
                        style={{
                          transform: `translate(calc(-50% + ${stickPositions.right.x * 32}px), calc(-50% + ${stickPositions.right.y * 32}px))`,
                          background: pressedButtons.has('R3') ? 'var(--accent)' : '#33334a',
                          boxShadow: pressedButtons.has('R3') ? '0 0 15px var(--accent-glow)' : 'none',
                        }}
                      />
                    </div>
                    <div className="text-xs text-white/40 font-mono">R STICK</div>
                    <div className="text-xs font-mono text-white/60 mt-1">X: {stickPositions.right.x.toFixed(2)} Y: {stickPositions.right.y.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Triggers */}
              <div className="card p-5">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white/60 mb-4">Triggers</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-mono text-white/60">LT</span>
                      <span className="text-sm font-mono font-bold neon-text">{Math.round(triggerValues.lt * 100)}%</span>
                    </div>
                    <div className="h-3 bg-surface-800 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-75"
                        style={{ width: `${triggerValues.lt * 100}%`, background: 'var(--accent)', boxShadow: triggerValues.lt > 0.1 ? '0 0 10px var(--accent-glow)' : 'none' }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-mono text-white/60">RT</span>
                      <span className="text-sm font-mono font-bold neon-text">{Math.round(triggerValues.rt * 100)}%</span>
                    </div>
                    <div className="h-3 bg-surface-800 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-75"
                        style={{ width: `${triggerValues.rt * 100}%`, background: 'var(--accent)', boxShadow: triggerValues.rt > 0.1 ? '0 0 10px var(--accent-glow)' : 'none' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vibration test */}
              <div className="card p-5">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white/60 mb-4">Vibration Test</h3>
                {gamepadState.vibrationSupport ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-white/40 block mb-1">Strength: {Math.round(vibrationStrength * 100)}%</label>
                      <input type="range" min="0" max="1" step="0.1" value={vibrationStrength} onChange={e => setVibrationStrength(parseFloat(e.target.value))} className="w-full accent-[var(--accent)]" />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 block mb-1">Duration: {vibrationDuration}ms</label>
                      <input type="range" min="100" max="2000" step="100" value={vibrationDuration} onChange={e => setVibrationDuration(parseInt(e.target.value))} className="w-full accent-[var(--accent)]" />
                    </div>
                    <button className="btn-primary w-full justify-center text-sm" onClick={handleVibrationTest}>
                      <Vibrate className="w-4 h-4" /> Test Vibration
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Info className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-sm text-white/40">This controller does not support browser vibration.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Button grid + event log */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Button grid */}
            <div className="lg:col-span-2 card p-6">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white/60 mb-4">Button States</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {GAMEPAD_BUTTON_NAMES.map(name => {
                  const isPressed = pressedButtons.has(name);
                  const count = pressCounts[name] ?? 0;
                  return (
                    <div
                      key={name}
                      className={classNames(
                        'relative rounded-lg p-3 text-center border transition-all duration-100',
                        isPressed ? 'neon-border scale-105' : 'border-white/8 bg-surface-800',
                      )}
                      style={isPressed ? { background: 'var(--accent-dim)' } : {}}
                    >
                      <div className={classNames('text-sm font-mono font-bold', isPressed ? 'neon-text' : 'text-white/60')}>
                        {name}
                      </div>
                      <div className="text-[10px] text-white/30 mt-1">{count > 0 ? `${count} presses` : '—'}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event log */}
            <div className="card p-6">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white/60 mb-4">Real-time Events</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto" aria-live="polite">
                {eventLog.length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-8">Press a button to see events...</p>
                ) : (
                  eventLog.map(e => (
                    <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg bg-surface-800/50 animate-slide-in-right text-xs font-mono">
                      <div className="w-2 h-2 rounded-full bg-neon-green flex-shrink-0" />
                      <span className="neon-text font-bold">{e.button}</span>
                      <span className="text-white/40">=</span>
                      <span className="text-white/60">{e.value.toFixed(2)}</span>
                      <span className="text-white/20 ml-auto">{new Date(e.timestamp).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Current mappings preview */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white/60">Default Button Mappings</h3>
              <Link to="/profiles" className="text-xs neon-text hover:underline">Create custom profile →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {Object.entries(DEFAULT_MAPPINGS).slice(0, 16).map(([btn, action]) => (
                <div key={btn} className="glass rounded-lg p-3 text-center">
                  <div className="text-xs font-mono font-bold neon-text mb-1">{btn}</div>
                  <div className="text-[10px] text-white/50">{action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
