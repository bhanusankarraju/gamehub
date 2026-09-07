import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, Clock, Activity, TrendingUp, Gamepad2, Zap, Award, Timer,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/Loading';
import {
  fetchAnalyticsOverview, fetchButtonStats, fetchSessions,
  type AnalyticsOverview,
} from '@/lib/api';
import type { ButtonStatistic, GamingSession } from '@/types';
import { formatDuration, formatRelative } from '@/lib/utils';
import { useToast } from '@/contexts/ToastContext';

const PIE_COLORS = ['#00ff88', '#00e5ff', '#ff9c00', '#ff3d8b', '#ff4757', '#3b82f6', '#a78bfa', '#fbbf24'];

export function AnalyticsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [buttonStats, setButtonStats] = useState<ButtonStatistic[]>([]);
  const [sessions, setSessions] = useState<GamingSession[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, stats, sess] = await Promise.all([
        fetchAnalyticsOverview(),
        fetchButtonStats(),
        fetchSessions(),
      ]);
      setOverview(ov);
      setButtonStats(stats);
      setSessions(sess);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load analytics', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const buttonChartData = buttonStats.slice(0, 12).map(b => ({
    name: b.button_name,
    presses: b.press_count,
  }));

  const completedSessions = sessions.filter(s => s.duration_seconds != null);
  const sessionChartData = completedSessions.slice(0, 15).reverse().map(s => ({
    name: new Date(s.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    duration: Math.round((s.duration_seconds ?? 0) / 60),
  }));

  const gameSessionMap = new Map<string, number>();
  completedSessions.forEach(s => {
    const name = s.games?.name ?? 'No game';
    gameSessionMap.set(name, (gameSessionMap.get(name) ?? 0) + 1);
  });
  const gameDistributionData = [...gameSessionMap.entries()].map(([name, value]) => ({ name, value }));

  const buttonUsageData = buttonStats.slice(0, 6).map(b => ({
    name: b.button_name,
    presses: b.press_count,
  }));

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div></AppLayout>;
  }

  const hasData = overview && (overview.totalSessions > 0 || overview.totalButtonPresses > 0);

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-white mb-1">Analytics</h1>
        <p className="text-white/50 text-sm">Track your gaming sessions, button usage, and play patterns.</p>
      </div>

      {!hasData ? (
        <div className="card p-8">
          <EmptyState
            icon={<BarChart3 className="w-10 h-10" />}
            title="NO ANALYTICS DATA YET"
            subtitle="Start gaming sessions and test your controller to build analytics data. Press buttons in the Controller Tester to track usage."
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <StatCard label="Total Sessions" value={overview!.totalSessions} icon={<Activity className="w-5 h-5" />} />
            <StatCard label="Total Play Time" value={overview!.totalPlayTime} format={formatDuration} icon={<Clock className="w-5 h-5" />} color="#00e5ff" />
            <StatCard label="Avg Session" value={overview!.averageSession} format={formatDuration} icon={<Timer className="w-5 h-5" />} color="#ff9c00" />
            <StatCard label="Longest Session" value={overview!.longestSession} format={formatDuration} icon={<Award className="w-5 h-5" />} color="#ff3d8b" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
            <StatCard label="Total Presses" value={overview!.totalButtonPresses} icon={<Zap className="w-5 h-5" />} />
            <StatCard label="Games" value={overview!.totalGames} icon={<Gamepad2 className="w-5 h-5" />} color="#00e5ff" />
            <StatCard label="Profiles" value={overview!.savedProfiles} icon={<TrendingUp className="w-5 h-5" />} color="#ff9c00" />
            <StatCard label="Active Buttons" value={buttonStats.length} icon={<Activity className="w-5 h-5" />} color="#ff3d8b" />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-6">
            <div className="card p-6">
              <h2 className="font-display font-bold text-lg text-white mb-4">Most Used Buttons</h2>
              {buttonChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={buttonChartData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} width={50} />
                    <Tooltip contentStyle={{ background: 'rgba(18,18,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`${Number(v).toLocaleString()} presses`, 'Count']} />
                    <Bar dataKey="presses" fill="var(--accent)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<Zap className="w-8 h-8" />} title="NO BUTTON DATA" subtitle="Press buttons in the tester to track usage." />
              )}
            </div>

            <div className="card p-6">
              <h2 className="font-display font-bold text-lg text-white mb-4">Gaming Session Duration</h2>
              {sessionChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={sessionChartData}>
                    <defs>
                      <linearGradient id="colorDur" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Tooltip contentStyle={{ background: 'rgba(18,18,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`${v} min`, 'Duration']} />
                    <Area type="monotone" dataKey="duration" stroke="#00e5ff" strokeWidth={2} fill="url(#colorDur)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<Clock className="w-8 h-8" />} title="NO SESSIONS YET" subtitle="Start and stop gaming sessions to track duration." />
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
            <div className="card p-6">
              <h2 className="font-display font-bold text-lg text-white mb-4">Games Played</h2>
              {gameDistributionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={gameDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => String(e.name ?? '')}>
                      {gameDistributionData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'rgba(18,18,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<Gamepad2 className="w-8 h-8" />} title="NO GAMES PLAYED" subtitle="Associate sessions with games to see distribution." />
              )}
            </div>

            <div className="card p-6 lg:col-span-2">
              <h2 className="font-display font-bold text-lg text-white mb-4">Button Usage Comparison</h2>
              {buttonUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={buttonUsageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} />
                    <Tooltip contentStyle={{ background: 'rgba(18,18,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} formatter={(v) => [`${Number(v).toLocaleString()} presses`, 'Total']} />
                    <Bar dataKey="presses" radius={[4, 4, 0, 0]}>
                      {buttonUsageData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<TrendingUp className="w-8 h-8" />} title="NO USAGE DATA" subtitle="Press controller buttons to build usage data." />
              )}
            </div>
          </div>

          <div className="card p-6 mt-6">
            <h2 className="font-display font-bold text-lg text-white mb-4">Recent Sessions</h2>
            {completedSessions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-xs uppercase tracking-wider text-white/40 font-semibold py-3 px-2">Game</th>
                      <th className="text-left text-xs uppercase tracking-wider text-white/40 font-semibold py-3 px-2">Start</th>
                      <th className="text-left text-xs uppercase tracking-wider text-white/40 font-semibold py-3 px-2">Duration</th>
                      <th className="text-left text-xs uppercase tracking-wider text-white/40 font-semibold py-3 px-2">When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedSessions.slice(0, 10).map(s => (
                      <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-3 px-2 text-sm text-white">{s.games?.name ?? 'No game'}</td>
                        <td className="py-3 px-2 text-sm text-white/60">{new Date(s.start_time).toLocaleString()}</td>
                        <td className="py-3 px-2 text-sm font-mono neon-text">{formatDuration(s.duration_seconds ?? 0)}</td>
                        <td className="py-3 px-2 text-sm text-white/40">{formatRelative(s.start_time)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={<Clock className="w-8 h-8" />} title="NO GAMING SESSIONS YET" subtitle="Use the dashboard to start and stop gaming sessions." />
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
}
