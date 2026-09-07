export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizes[size]} border-2 border-white/10 rounded-full animate-spin`}
        style={{ borderTopColor: 'var(--accent)' }}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export function LoadingCard() {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton h-10 w-10 rounded-lg" />
      <div className="skeleton h-8 w-24" />
      <div className="skeleton h-4 w-32" />
    </div>
  );
}
