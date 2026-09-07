import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock, Gamepad2, Layers, Activity, Play, Square,
  Gamepad, TrendingUp, Calendar, Cpu, Battery, Vibrate,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Area, AreaChart, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingCard, LoadingSpinner } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { useGamepad } from '@/hooks/useGamepad';
import {
  fetchAnalyticsOverview, fetchSessions, fetchProfiles,
  fetchGames, fetchButtonStats, startSession, stopSession,
  fetchActiveSession, type AnalyticsOverview,
} from '@/lib/api';
import type { Game, ControllerProfile, GamingSession, ButtonStatistic } from '@/types';
import { formatDuration, formatRelative } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

export function DashboardPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [recentSessions, setRecentSessions] = useState<GamingSession[]>([]);
  const [recentProfiles, setRecentProfiles] = useState<ControllerProfile[]>([]);
  const [recentGames, setRecentGames] = useState<Game[]>([]);
  const [buttonStats, setButtonStats] = useState<ButtonStatistic[]>([]);
  const [activeSession, setActiveSession] = useState<GamingSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [pressedButtons, setPressedButtons] = useState<Set<string>>(new Set());

  const { gamepadState } = useGamepad({ pollingInterval: 100 });

  // Track active session timer
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      const start = new Date(activeSession.start_time).getTime();
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, sessions, profiles, games, stats, active] = await Promise.all([
        fetchAnalyticsOverview(),
        fetchSessions(),
        fetchProfiles(),
        fetchGames(),
        fetchButtonStats(),
        fetchActiveSession(),
      ]);
      setOverview(ov);
      setRecentSessions(sessions.slice(0, 5));
      setRecentProfiles(profiles.slice(0, 4));
      setRecentGames(games.slice(0, 4));
      setButtonStats(stats.slice(0, 8));
      setActiveSession(active);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Gamepad button press tracking
  useEffect(() => {
    if (!gamepadState.connected) return;
    const pressed = new Set<string>();
    gamepadState.buttons.forEach(b => { if (b.pressed) pressed.add(b.name); });
    setPressedButtons(pressed);
  }, [gamepadState]);

  const handleStartSession = async (gameId: string | null) => {
    try {
      const s = await startSession(gameId);
      setActiveSession(s);
      setElapsed(0);
      toast('Gaming session started', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to start session', 'error');
    }
  };

  const handleStopSession = async () => {
    if (!activeSession) return;
    try {
      await stopSession(activeSession.id, elapsed);
      setActiveSession(null);
      setElapsed(0);
      toast(`Session ended — ${formatDuration(elapsed)}`, 'success');
      loadData();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to stop session', 'error');
    }
  };

  // Chart data
  const sessionChartData = recentSessions
    .filter(s => s.duration_seconds)
    .slice()
    .reverse()
    .map(s => ({
      name: new Date(s.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      duration: Math.round((s.duration_seconds ?? 0) / 60),
    }));

  const buttonChartData = buttonStats.slice(0, 6).map(b => ({
    name: b.button_name,
    presses: b.press_count,
  }));

  const gameDistributionData = recentGames.map((g, i) => ({
    name: g.name,
    value: 1,
    color: ['#00ff88', '#00e5ff', '#ff9c00', '#ff3d8b', '#ff4757', '#3b82f6'][i % 6],
  }));

  if (loading) {
    return (
      <AppLayout>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          <LoadingCard /><LoadingCard /><LoadingCard /><LoadingCard />
        </div>
        <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-white mb-1">Dashboard</h1>
        <p className="text-white/50 text-sm">Your gaming controller command center.</p>
      </div>

      {/* Session timer bar */}
      <div className="card p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${activeSession ? 'bg-neon-green animate-glow-pulse' : 'bg-white/20'}`} />
          <div>
            <div className="text-sm text-white/50">{activeSession ? 'Session in progress' : 'No active session'}</div>
            {activeSession && (
              <div className="font-mono text-xl font-bold neon-text">{formatDuration(elapsed)}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeSession ? (
            <button className="btn-danger" onClick={handleStopSession}>
              <Square className="w-4 h-4" /> Stop Session
            </button>
          ) : (
            <button className="btn-primary" onClick={() => handleStartSession(null)}>
              <Play className="w-4 h-4" /> Start Session
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <StatCard label="Gaming Sessions" value={overview?.totalSessions ?? 0} icon={<Activity className="w-5 h-5" />} />
        <StatCard label="Total Play Time" value={overview?.totalPlayTime ?? 0} format={formatDuration} icon={<Clock className="w-5 h-5" />} color="#00e5ff" />
        <StatCard label="Saved Profiles" value={overview?.savedProfiles ?? 0} icon={<Layers className="w-5 h-5" />} color="#ff9c00" />
        <StatCard label="Total Presses" value={overview?.totalButtonPresses ?? 0} icon={<TrendingUp className="w-5 h-5" />} color="#ff3d8b" />
      </div>

      {/* Controller status + recent games */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Controller status */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-white">Controller</h2>
            <span className={`badge ${gamepadState.connected ? 'badge-success' : 'badge-danger'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${gamepadState.connected ? 'bg-neon-green' : 'bg-neon-red'} animate-glow-pulse`} />
              {gamepadState.connected ? 'CONNECTED' : 'NOT CONNECTED'}
            </span>
          </div>
          {gamepadState.connected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
                  <Gamepad2 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{gamepadState.id.split('(')[0].trim()}</div>
                  <div className="text-xs text-white/40">Index {gamepadState.index}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="glass rounded-lg p-3">
                  <div className="text-white/40 text-xs uppercase mb-1">Buttons</div>
                  <div className="font-mono font-bold text-white">{gamepadState.buttonCount}</div>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="text-white/40 text-xs uppercase mb-1">Axes</div>
                  <div className="font-mono font-bold text-white">{gamepadState.axisCount}</div>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="text-white/40 text-xs uppercase mb-1">Vibration</div>
                  <div className="font-mono font-bold text-white">{gamepadState.vibrationSupport ? 'Yes' : 'No'}</div>
                </div>
                <div className="glass rounded-lg p-3">
                  <div className="text-white/40 text-xs uppercase mb-1">Pressed</div>
                  <div className="font-mono font-bold text-white">{pressedButtons.size}</div>
                </div>
              </div>
              <Link to="/controller" className="btn-secondary w-full justify-center text-sm">Open Tester</Link>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl glass flex items-center justify-center mx-auto mb-3">
                <Gamepad2 className="w-6 h-6 text-white/30" />
              </div>
              <p className="text-sm text-white/40 mb-4">Connect a controller via USB or Bluetooth to begin testing.</p>
              <Link to="/controller" className="btn-secondary text-sm">Go to Tester</Link>
            </div>
          )}
        </div>

        {/* Recent games */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-white">Recent Games</h2>
            <Link to="/games" className="text-xs neon-text hover:underline">View all</Link>
          </div>
          {recentGames.length > 0 ? (
            <div className="space-y-2">
              {recentGames.map(g => (
                <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-lg glass flex items-center justify-center text-xs font-bold" style={{ color: 'var(--accent)' }}>
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{g.name}</div>
                    <div className="text-xs text-white/40">{g.genre} • {g.platform}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Gamepad className="w-8 h-8" />} title="ADD YOUR FIRST GAME" subtitle="Build your game library to track sessions and profiles." action={<Link to="/games" className="btn-secondary text-sm">Add Game</Link>} />
          )}
        </div>

        {/* Recent profiles */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-white">Recent Profiles</h2>
            <Link to="/profiles" className="text-xs neon-text hover:underline">View all</Link>
          </div>
          {recentProfiles.length > 0 ? (
            <div className="space-y-2">
              {recentProfiles.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-lg glass flex items-center justify-center">
                    <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{p.name}</div>
                    <div className="text-xs text-white/40">{p.games?.name ?? 'No game'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={<Layers className="w-8 h-8" />} title="CREATE YOUR FIRST PROFILE" subtitle="Save custom controller mappings for your favorite games." action={<Link to="/profiles" className="btn-secondary text-sm">Create Profile</Link>} />
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Session duration chart */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-lg text-white mb-4">Gaming Activity</h2>
          {sessionChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={sessionChartData}>
                <defs>
                  <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <Tooltip
                  contentStyle={{ background: 'rgba(18,18,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  formatter={(v) => [`${v} min`, 'Duration']}
                />
                <Area type="monotone" dataKey="duration" stroke="var(--accent)" strokeWidth={2} fill="url(#colorDuration)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={<Calendar className="w-8 h-8" />} title="NO SESSIONS YET" subtitle="Start a gaming session to see your activity chart." />
          )}
        </div>

        {/* Most used buttons */}
        <div className="card p-6">
          <h2 className="font-display font-bold text-lg text-white mb-4">Most Used Buttons</h2>
          {buttonChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={buttonChartData} layout="vertical">
                <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} width={50} />
                <Tooltip
                  contentStyle={{ background: 'rgba(18,18,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                  formatter={(v) => [`${Number(v).toLocaleString()} presses`, 'Count']}
                />
                <Bar dataKey="presses" fill="var(--accent)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={<TrendingUp className="w-8 h-8" />} title="NO DATA YET" subtitle="Press controller buttons while testing to track usage." />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
