import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Gamepad2, Layers, Library, BarChart3,
  Settings, LogOut, Menu, X, Bell, Search, Gamepad,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/controller', label: 'Controller Tester', icon: Gamepad2 },
  { to: '/profiles', label: 'Profiles', icon: Layers },
  { to: '/games', label: 'Games', icon: Library },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    toast('Signed out successfully', 'success');
    navigate('/login');
  };

  const username = user?.user_metadata?.username ?? user?.email?.split('@')[0] ?? 'Player';

  return (
    <div className="min-h-screen flex bg-surface-900 grid-bg">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 z-50 h-screen w-64 glass-strong border-r border-white/8
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/8">
          <div className="w-10 h-10 rounded-xl neon-border flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <Gamepad className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <div className="font-display font-bold text-lg tracking-wider text-white leading-none">GAMEHUB</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 mt-1">Controller</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'text-white neon-border'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
                }
              `}
              style={({ isActive }) => isActive ? { background: 'var(--accent-dim)' } : {}}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/8">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neon-red/80 hover:text-neon-red hover:bg-neon-red/10 transition-all w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b border-white/8 px-4 md:px-6 py-3 flex items-center gap-3">
          <button
            className="md:hidden text-white/60 hover:text-white p-1"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="search"
              placeholder="Search..."
              className="input-field pl-10 py-2 text-sm"
              aria-label="Search"
            />
          </div>

          <div className="flex-1" />

          <div className="relative">
            <button
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              onClick={() => setNotifOpen(v => !v)}
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neon-green animate-glow-pulse" />
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-12 z-50 w-72 glass-strong rounded-xl border border-white/10 p-4 animate-slide-up">
                  <p className="text-sm font-semibold text-white mb-3">Notifications</p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-sm text-white/60">
                      <div className="w-2 h-2 rounded-full bg-neon-green mt-1.5 flex-shrink-0" />
                      <span>Welcome to GameHub Controller!</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-white/60">
                      <div className="w-2 h-2 rounded-full bg-neon-cyan mt-1.5 flex-shrink-0" />
                      <span>Connect a controller to start testing</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-semibold text-white">{username}</div>
              <div className="text-xs text-white/40">{user?.email}</div>
            </div>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center font-display font-bold text-sm"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
            >
              {username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden sticky bottom-0 z-30 glass-strong border-t border-white/8 flex justify-around px-2 py-2">
          {NAV_ITEMS.slice(0, 5).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `
                flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors
                ${isActive ? 'text-white' : 'text-white/40'}
              `}
              style={({ isActive }) => isActive ? { color: 'var(--accent)' } : {}}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label.split(' ')[0]}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
