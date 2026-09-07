import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Gamepad, Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export function RegisterPage() {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; confirm?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!username) e.username = 'Username is required';
    else if (username.length < 3) e.username = 'Username must be at least 3 characters';
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    if (!confirmPassword) e.confirm = 'Please confirm your password';
    else if (password !== confirmPassword) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await signUp(email, password, username);
    setLoading(false);
    if (error) {
      toast(error, 'error');
    } else {
      toast('Account created! Welcome to GameHub.', 'success');
      navigate('/dashboard');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-900 grid-bg noise-bg px-4 py-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ background: 'var(--accent)' }} />
      </div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="flex items-center gap-3 justify-center mb-8">
          <div className="w-12 h-12 rounded-xl neon-border flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <Gamepad className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <span className="font-display font-bold text-xl tracking-wider text-white">GAMEHUB</span>
        </Link>

        <div className="glass-strong rounded-2xl p-8 border border-white/10 animate-slide-up">
          <h1 className="font-display font-bold text-2xl text-white mb-2">Create Account</h1>
          <p className="text-white/50 text-sm mb-6">Join GameHub and take control of your gaming.</p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setErrors(p => ({ ...p, username: undefined })); }}
                  className={`input-field pl-10 ${errors.username ? 'border-neon-red' : ''}`}
                  placeholder="ProGamer123"
                  aria-invalid={!!errors.username}
                />
              </div>
              {errors.username && <p className="text-xs text-neon-red mt-1.5">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                  className={`input-field pl-10 ${errors.email ? 'border-neon-red' : ''}`}
                  placeholder="player@example.com"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && <p className="text-xs text-neon-red mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  className={`input-field pl-10 ${errors.password ? 'border-neon-red' : ''}`}
                  placeholder="At least 6 characters"
                  aria-invalid={!!errors.password}
                />
              </div>
              {errors.password && <p className="text-xs text-neon-red mt-1.5">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirm" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  id="confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(p => ({ ...p, confirm: undefined })); }}
                  className={`input-field pl-10 ${errors.confirm ? 'border-neon-red' : ''}`}
                  placeholder="Re-enter your password"
                  aria-invalid={!!errors.confirm}
                />
              </div>
              {errors.confirm && <p className="text-xs text-neon-red mt-1.5">{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-50">
              {loading ? 'Creating account...' : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-white/50">
            Already have an account?{' '}
            <Link to="/login" className="neon-text font-semibold hover:underline">Sign in</Link>
          </div>
        </div>

        <Link to="/" className="flex items-center justify-center gap-2 mt-6 text-sm text-white/40 hover:text-white/60 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
      </div>
    </div>
  );
}
