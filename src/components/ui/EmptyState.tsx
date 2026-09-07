import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 animate-fade-in">
      <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-5 text-white/30">
        {icon}
      </div>
      <h3 className="text-lg font-bold font-display tracking-wider text-white mb-2 uppercase">{title}</h3>
      <p className="text-white/50 text-sm max-w-sm mb-6">{subtitle}</p>
      {action}
    </div>
  );
}
