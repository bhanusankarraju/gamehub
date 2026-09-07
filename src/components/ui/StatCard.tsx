import type { ReactNode } from 'react';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';

interface StatCardProps {
  label: string;
  value: number;
  format?: (v: number) => string;
  icon: ReactNode;
  color?: string;
  trend?: string;
}

export function StatCard({ label, value, format, icon, color = 'var(--accent)', trend }: StatCardProps) {
  const animatedValue = useAnimatedCounter({ value });
  const display = format ? format(animatedValue) : animatedValue.toLocaleString();

  return (
    <div className="card p-5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 blur-3xl transition-opacity group-hover:opacity-10" style={{ background: color }} />
      <div className="flex items-start justify-between mb-3 relative">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, color }}>
          {icon}
        </div>
        {trend && (
          <span className="text-xs text-white/40 font-mono">{trend}</span>
        )}
      </div>
      <div className="text-3xl font-bold font-display tracking-wide text-white mb-1" style={{ textShadow: `0 0 20px ${color}30` }}>
        {display}
      </div>
      <div className="text-sm text-white/50 uppercase tracking-wider font-medium">{label}</div>
    </div>
  );
}
