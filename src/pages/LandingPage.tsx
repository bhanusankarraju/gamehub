import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gamepad, Zap, MousePointerClick, Layers, BarChart3,
  ArrowRight, Cpu, Radio, Gauge, Usb, Bluetooth, CheckCircle2,
} from 'lucide-react';
import { useGamepad } from '@/hooks/useGamepad';
import { useAuth } from '@/contexts/AuthContext';
import { ControllerVisual } from '@/components/ControllerVisual';

export function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set());
  const [stickPositions, setStickPositions] = useState({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } });
  const [triggerValues, setTriggerValues] = useState({ lt: 0, rt: 0 });
  const lastEventRef = useRef<{ button: string; time: number } | null>(null);

  useGamepad({
    pollingInterval: 60,
    onButtonPress: (name) => {
      setPressedButtons(prev => {
        const next = new Set(prev);
        next.add(name);
        // Remove after 200ms
        setTimeout(() => {
          setPressedButtons(p => {
            const n = new Set(p);
            n.delete(name);
            return n;
          });
        }, 200);
        return next;
      });
      lastEventRef.current = { button: name, time: Date.now() };
    },
    onAxisMove: (axisName, x, y) => {
      setStickPositions(prev => {
        if (axisName === 'LeftX' || axisName === 'LeftY') {
          return { ...prev, left: axisName === 'LeftX' ? { ...prev.left, x } : { ...prev.left, y } };
        }
        if (axisName === 'RightX' || axisName === 'RightY') {
          return { ...prev, right: axisName === 'RightX' ? { ...prev.right, x } : { ...prev.right, y } };
        }
        return prev;
      });
    },
  });

  // Update trigger values from button state
  useEffect(() => {
    const interval = setInterval(() => {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (gp) {
          setTriggerValues({
            lt: gp.buttons[6]?.value ?? 0,
            rt: gp.buttons[7]?.value ?? 0,
          });
          break;
        }
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-surface-900 text-white overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl neon-border flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <Gamepad className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <span className="font-display font-bold text-lg tracking-wider">GAMEHUB</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/60">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#controllers" className="hover:text-white transition-colors">Controllers</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <button className="btn-primary text-sm" onClick={() => navigate('/dashboard')}>Dashboard</button>
          ) : (
            <>
              <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 md:px-8 grid-bg noise-bg pt-20">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--accent)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl bg-neon-cyan" />
        </div>

        <div className="relative max-w-6xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6 text-sm text-white/60 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-glow-pulse" />
            Real-time Gamepad API Integration
          </div>

          <h1 className="font-display font-bold text-5xl md:text-7xl lg:text-8xl tracking-tight mb-6 animate-slide-up text-balance">
            YOUR CONTROLLER.<br />
            <span className="neon-text">YOUR RULES.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Test, customize, map and analyze your gaming controller from one powerful dashboard.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to={user ? '/dashboard' : '/register'} className="btn-primary text-base px-8 py-3">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to={user ? '/controller' : '/register'} className="btn-secondary text-base px-8 py-3">
              <Gamepad className="w-4 h-4" /> Test Controller
            </Link>
          </div>

          {/* Interactive controller visual */}
          <div className="mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <ControllerVisual
              pressedButtons={pressedButtons}
              stickPositions={stickPositions}
              triggerValues={triggerValues}
              size="lg"
            />
            <p className="text-sm text-white/30 mt-4">
              {pressedButtons.size > 0
                ? <>Last pressed: <span className="neon-text font-mono">{[...pressedButtons].pop()}</span></>
                : 'Connect a controller and press any button to see it light up'}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-4">Everything You Need</h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto">A complete toolkit for controller testing, customization, and analytics.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: MousePointerClick, title: 'Controller Testing', desc: 'Real-time button detection, analog stick visualization, and trigger value monitoring using the native Gamepad API.' },
            { icon: Zap, title: 'Custom Button Mapping', desc: 'Remap every button to any action. Create custom mappings for different games and play styles.' },
            { icon: Layers, title: 'Gaming Profiles', desc: 'Save and switch between multiple controller profiles. FPS, racing, sports — each with its own configuration.' },
            { icon: BarChart3, title: 'Gaming Analytics', desc: 'Track button usage, session durations, and gaming patterns with detailed charts and statistics.' },
            { icon: Cpu, title: 'Vibration Testing', desc: 'Test haptic feedback with adjustable strength and duration. Detect support across different controllers.' },
            { icon: Radio, title: 'Real-time Updates', desc: 'WebSocket-powered live updates for controller events, button presses, and analytics across devices.' },
          ].map((f, i) => (
            <div key={f.title} className="card p-6 group animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: 'var(--accent-dim)' }}>
                <f.icon className="w-6 h-6" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-4">How It Works</h2>
          <p className="text-white/50 text-lg">Three steps from plug-in to full control.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Connect', desc: 'Plug in any USB or Bluetooth controller. The browser detects it automatically via the Gamepad API.' },
            { step: '02', title: 'Customize', desc: 'Test every button and stick. Create custom button mappings and save profiles for your games.' },
            { step: '03', title: 'Analyze', desc: 'Track your gaming sessions and button usage patterns with real-time analytics dashboards.' },
          ].map((s, i) => (
            <div key={s.step} className="text-center animate-slide-up" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="font-display font-bold text-6xl neon-text mb-4 opacity-30">{s.step}</div>
              <h3 className="font-display font-bold text-2xl mb-3">{s.title}</h3>
              <p className="text-white/50 text-sm max-w-xs mx-auto">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Supported controllers */}
      <section id="controllers" className="py-24 px-4 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-4xl md:text-5xl tracking-tight mb-4">Supported Controllers</h2>
          <p className="text-white/50 text-lg">Works with any controller the browser recognizes.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { name: 'Xbox Series', icon: Usb, desc: 'Xbox One / Series X|S controllers via USB or Xbox Wireless' },
            { name: 'DualSense', icon: Bluetooth, desc: 'PS5 DualSense and PS4 DualShock 4 via USB or Bluetooth' },
            { name: 'Switch Pro', icon: Radio, desc: 'Nintendo Switch Pro Controller via USB or Bluetooth' },
            { name: 'Generic', icon: Cpu, desc: 'Any generic gamepad that exposes the standard Gamepad API mapping' },
          ].map((c) => (
            <div key={c.name} className="card p-6 text-center">
              <div className="w-14 h-14 rounded-2xl glass flex items-center justify-center mx-auto mb-4">
                <c.icon className="w-7 h-7" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{c.name}</h3>
              <p className="text-white/40 text-xs">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center card p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'var(--accent)' }} />
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--accent)' }} />
          <h2 className="font-display font-bold text-3xl md:text-5xl tracking-tight mb-4 relative">Ready to Take Control?</h2>
          <p className="text-white/50 text-lg mb-8 relative max-w-xl mx-auto">
            Create your free account and start testing, mapping, and analyzing your controller today.
          </p>
          <Link to={user ? '/dashboard' : '/register'} className="btn-primary text-base px-8 py-3 relative inline-flex">
            {user ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg neon-border flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <Gamepad className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <span className="font-display font-bold tracking-wider">GAMEHUB CONTROLLER</span>
          </div>
          <p className="text-white/30 text-sm">
            Built with the native Gamepad API, Supabase, and React.
          </p>
        </div>
      </footer>
    </div>
  );
}
