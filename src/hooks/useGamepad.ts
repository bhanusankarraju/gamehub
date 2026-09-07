import { useEffect, useRef, useState, useCallback } from 'react';
import { getButtonName, getAxisName } from '@/lib/constants';

export interface GamepadButtonState {
  index: number;
  name: string;
  value: number;
  pressed: boolean;
}

export interface GamepadAxisState {
  index: number;
  name: string;
  x: number;
  y: number;
}

export interface GamepadState {
  connected: boolean;
  index: number;
  id: string;
  buttonCount: number;
  axisCount: number;
  buttons: GamepadButtonState[];
  axes: GamepadAxisState[];
  vibrationSupport: boolean;
}

interface GamepadHookOptions {
  pollingInterval: number;
  onButtonPress?: (buttonName: string, value: number) => void;
  onAxisMove?: (axisName: string, x: number, y: number) => void;
}

const EMPTY_STATE: GamepadState = {
  connected: false,
  index: -1,
  id: '',
  buttonCount: 0,
  axisCount: 0,
  buttons: [],
  axes: [],
  vibrationSupport: false,
};

// Extended Gamepad type to include non-standard hapticActuators
interface ExtendedGamepad extends Gamepad {
  hapticActuators?: Array<{
    pulse?: (magnitude: number, duration: number) => Promise<boolean>;
    playEffect?: (type: string, params: Record<string, unknown>) => Promise<unknown>;
  }>;
}

export function useGamepad(options: GamepadHookOptions) {
  const { pollingInterval, onButtonPress, onAxisMove } = options;
  const [gamepadState, setGamepadState] = useState<GamepadState>(EMPTY_STATE);
  const rafRef = useRef<number>(0);
  const lastButtonStates = useRef<Record<number, boolean>>({});
  const lastAxisStates = useRef<Record<string, number>>({});
  const callbacksRef = useRef({ onButtonPress, onAxisMove });
  const intervalRef = useRef(pollingInterval);

  useEffect(() => {
    callbacksRef.current = { onButtonPress, onAxisMove };
  });

  useEffect(() => {
    intervalRef.current = pollingInterval;
  }, [pollingInterval]);

  const poll = useCallback(() => {
    const gamepads = navigator.getGamepads();
    let active: Gamepad | null = null;
    for (const gp of gamepads) {
      if (gp) { active = gp; break; }
    }

    if (!active) {
      setGamepadState(prev => prev.connected ? EMPTY_STATE : prev);
      rafRef.current = window.setTimeout(poll, intervalRef.current) as unknown as number;
      return;
    }

    const ext = active as ExtendedGamepad;
    const buttons: GamepadButtonState[] = [];
    const axes: GamepadAxisState[] = [];
    let vibrationSupport = false;

    if (ext.vibrationActuator) {
      vibrationSupport = true;
    }
    if (ext.hapticActuators && ext.hapticActuators.length > 0) {
      vibrationSupport = true;
    }

    for (let i = 0; i < active.buttons.length; i++) {
      const btn = active.buttons[i];
      const name = getButtonName(i);
      const value = btn.value;
      const pressed = btn.pressed;
      buttons.push({ index: i, name, value, pressed });

      const wasPressed = lastButtonStates.current[i] ?? false;
      if (pressed && !wasPressed) {
        callbacksRef.current.onButtonPress?.(name, value);
      }
      if (name === 'LT' || name === 'RT') {
        const prevVal = lastAxisStates.current[`btn_${i}`] ?? 0;
        if (value > 0.5 && prevVal <= 0.5) {
          callbacksRef.current.onButtonPress?.(name, value);
        }
        lastAxisStates.current[`btn_${i}`] = value;
      }
      lastButtonStates.current[i] = pressed;
    }

    for (let i = 0; i < active.axes.length; i += 2) {
      const x = active.axes[i] ?? 0;
      const y = active.axes[i + 1] ?? 0;
      const name = getAxisName(i);
      const axisIndex = Math.floor(i / 2);
      axes.push({ index: axisIndex, name, x, y });

      const prevX = lastAxisStates.current[`ax_${i}`] ?? 0;
      const prevY = lastAxisStates.current[`ax_${i + 1}`] ?? 0;
      if (Math.abs(x - prevX) > 0.01 || Math.abs(y - prevY) > 0.01) {
        callbacksRef.current.onAxisMove?.(name, x, y);
      }
      lastAxisStates.current[`ax_${i}`] = x;
      lastAxisStates.current[`ax_${i + 1}`] = y;
    }

    setGamepadState({
      connected: true,
      index: active.index,
      id: active.id,
      buttonCount: active.buttons.length,
      axisCount: active.axes.length,
      buttons,
      axes,
      vibrationSupport,
    });

    rafRef.current = window.setTimeout(poll, intervalRef.current) as unknown as number;
  }, []);

  const triggerVibration = useCallback(async (strength: number, duration: number) => {
    const gamepads = navigator.getGamepads();
    let active: Gamepad | null = null;
    for (const gp of gamepads) { if (gp) { active = gp; break; } }
    if (!active) return false;

    const ext = active as ExtendedGamepad;
    const actuator = ext.vibrationActuator || ext.hapticActuators?.[0];
    if (!actuator) return false;

    try {
      const a = actuator as {
        playEffect?: (type: string, params: Record<string, unknown>) => Promise<unknown>;
        pulse?: (magnitude: number, duration: number) => Promise<boolean>;
      };
      if (a.playEffect) {
        await a.playEffect('dual-rumble', {
          duration,
          strongMagnitude: strength,
          weakMagnitude: strength,
        });
      } else if (a.pulse) {
        await a.pulse(strength, duration);
      }
      return true;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    function onConnect() {
      poll();
    }
    function onDisconnect() {
      setGamepadState(EMPTY_STATE);
      lastButtonStates.current = {};
      lastAxisStates.current = {};
    }

    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);
    poll();

    return () => {
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
      clearTimeout(rafRef.current);
    };
  }, [poll]);

  return { gamepadState, triggerVibration };
}
