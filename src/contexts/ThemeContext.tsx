import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { ACCENT_COLORS, type AccentColorName } from '@/lib/constants';
import { fetchUserSettings, upsertUserSettings } from '@/lib/api';

interface ThemeContextValue {
  theme: 'dark' | 'light';
  accent: AccentColorName;
  vibrationEnabled: boolean;
  pollingInterval: number;
  setTheme: (t: 'dark' | 'light') => void;
  setAccent: (a: AccentColorName) => void;
  setVibrationEnabled: (v: boolean) => void;
  setPollingInterval: (p: number) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyAccent(accent: AccentColorName) {
  const c = ACCENT_COLORS.find(a => a.name === accent) ?? ACCENT_COLORS[0];
  document.documentElement.style.setProperty('--accent', c.hex);
  document.documentElement.style.setProperty('--accent-rgb', c.rgb);
  document.documentElement.style.setProperty('--accent-dim', `rgba(${c.rgb}, 0.15)`);
  document.documentElement.style.setProperty('--accent-glow', `rgba(${c.rgb}, 0.4)`);
}

function applyTheme(theme: 'dark' | 'light') {
  if (theme === 'light') {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('light');
  } else {
    document.documentElement.classList.add('dark');
    document.body.classList.remove('light');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [accent, setAccentState] = useState<AccentColorName>('green');
  const [vibrationEnabled, setVibrationState] = useState(true);
  const [pollingInterval, setPollingState] = useState(60);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    applyAccent(accent);
    applyTheme(theme);
  }, [accent, theme]);

  // Load settings from DB once auth is ready
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoaded(true); return; }
      try {
        const s = await fetchUserSettings();
        if (cancelled || !s) { setLoaded(true); return; }
        setThemeState(s.theme);
        setAccentState(s.accent_color as AccentColorName);
        setVibrationState(s.vibration_enabled);
        setPollingState(s.polling_interval);
      } catch {
        // No settings row yet — defaults are fine
      } finally {
        if (!cancelled) setLoaded(true);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback(
    async (patch: Partial<{ theme: 'dark' | 'light'; accent_color: string; vibration_enabled: boolean; polling_interval: number }>) => {
      try { await upsertUserSettings(patch); } catch { /* ignore — settings are cosmetic */ }
    },
    [],
  );

  const setTheme = useCallback((t: 'dark' | 'light') => {
    setThemeState(t);
    persist({ theme: t });
  }, [persist]);

  const setAccent = useCallback((a: AccentColorName) => {
    setAccentState(a);
    persist({ accent_color: a });
  }, [persist]);

  const setVibrationEnabled = useCallback((v: boolean) => {
    setVibrationState(v);
    persist({ vibration_enabled: v });
  }, [persist]);

  const setPollingInterval = useCallback((p: number) => {
    setPollingState(p);
    persist({ polling_interval: p });
  }, [persist]);

  return (
    <ThemeContext.Provider value={{ theme, accent, vibrationEnabled, pollingInterval, setTheme, setAccent, setVibrationEnabled, setPollingInterval }}>
      {loaded ? children : null}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
