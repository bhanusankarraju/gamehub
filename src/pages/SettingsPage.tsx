import { useState, type CSSProperties } from 'react';
import {
  Settings as SettingsIcon, User, Palette, Gamepad2, Lock, LogOut,
  Sun, Moon, Vibrate, Gauge, Save, Check,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { ACCENT_COLORS, type AccentColorName } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export function SettingsPage() {
  const { theme, accent, vibrationEnabled, pollingInterval, setTheme, setAccent, setVibrationEnabled, setPollingInterval } = useTheme();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState(user?.user_metadata?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      toast('Username cannot be empty', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: email !== user?.email ? email : undefined,
        data: { username: username.trim() },
      });
      if (error) throw new Error(error.message);
      toast('Profile updated successfully', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast('Fill in all password fields', 'error');
      return;
    }
    if (newPassword.length < 6) {
      toast('New password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword,
      });
      if (signInError) {
        toast('Current password is incorrect', 'error');
        setChangingPassword(false);
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw new Error(updateError.message);
      toast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    toast('Signed out successfully', 'success');
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-white mb-1">Settings</h1>
        <p className="text-white/50 text-sm">Manage your account, appearance, and controller preferences.</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Profile Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
              <User className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="font-display font-bold text-lg text-white">Profile Settings</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
            </div>
            <button className="btn-primary" onClick={handleSaveProfile} disabled={savingProfile}>
              <Save className="w-4 h-4" /> {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
              <Palette className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="font-display font-bold text-lg text-white">Appearance</h2>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-3">Theme</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${theme === 'dark' ? 'neon-border' : 'border-white/10 hover:border-white/20'}`}
                  style={theme === 'dark' ? { background: 'var(--accent-dim)' } : {}}
                >
                  <Moon className="w-4 h-4" style={{ color: theme === 'dark' ? 'var(--accent)' : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-sm text-white">Dark</span>
                  {theme === 'dark' && <Check className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
                </button>
                <button
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition-all ${theme === 'light' ? 'neon-border' : 'border-white/10 hover:border-white/20'}`}
                  style={theme === 'light' ? { background: 'var(--accent-dim)' } : {}}
                >
                  <Sun className="w-4 h-4" style={{ color: theme === 'light' ? 'var(--accent)' : 'rgba(255,255,255,0.4)' }} />
                  <span className="text-sm text-white">Light</span>
                  {theme === 'light' && <Check className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-3">Accent Color</label>
              <div className="flex gap-3 flex-wrap">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => setAccent(c.name as AccentColorName)}
                    className={`w-10 h-10 rounded-full transition-all ${accent === c.name ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface-900' : 'hover:scale-105'}`}
                    style={{ background: c.hex, boxShadow: accent === c.name ? `0 0 20px ${c.hex}` : 'none', '--tw-ring-color': c.hex } as CSSProperties}
                    aria-label={`${c.name} accent color`}
                  >
                    {accent === c.name && <Check className="w-5 h-5 text-black mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Controller Settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
              <Gamepad2 className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="font-display font-bold text-lg text-white">Controller Settings</h2>
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Vibrate className="w-5 h-5 text-white/40" />
                <div>
                  <div className="text-sm text-white">Vibration</div>
                  <div className="text-xs text-white/40">Enable haptic feedback testing</div>
                </div>
              </div>
              <button
                onClick={() => setVibrationEnabled(!vibrationEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${vibrationEnabled ? 'bg-neon-green/30' : 'bg-white/10'}`}
                aria-label="Toggle vibration"
                role="switch"
                aria-checked={vibrationEnabled}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform ${vibrationEnabled ? 'translate-x-6 bg-neon-green' : 'bg-white/40'}`}
                  style={vibrationEnabled ? { boxShadow: '0 0 10px var(--accent-glow)' } : {}}
                />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2">
                <Gauge className="w-5 h-5 text-white/40" />
                <div className="flex-1">
                  <div className="text-sm text-white">Polling Interval</div>
                  <div className="text-xs text-white/40">How fast the controller is checked (ms)</div>
                </div>
                <span className="text-sm font-mono neon-text">{pollingInterval}ms</span>
              </div>
              <input
                type="range"
                min="16"
                max="200"
                step="4"
                value={pollingInterval}
                onChange={e => setPollingInterval(parseInt(e.target.value))}
                className="w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>16ms (fast)</span>
                <span>200ms (slow)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
              <Lock className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <h2 className="font-display font-bold text-lg text-white">Security</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Current Password</label>
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input-field" placeholder="Enter current password" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="At least 6 characters" />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" placeholder="Re-enter new password" />
              </div>
            </div>
            <button className="btn-primary" onClick={handleChangePassword} disabled={changingPassword}>
              <Lock className="w-4 h-4" /> {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg glass flex items-center justify-center">
              <LogOut className="w-5 h-5 text-neon-red" />
            </div>
            <h2 className="font-display font-bold text-lg text-white">Session</h2>
          </div>
          <button className="btn-danger" onClick={() => setLogoutConfirm(true)}>
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={logoutConfirm}
        onClose={() => setLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to log out of your account?"
        confirmLabel="Logout"
        danger={false}
      />
    </AppLayout>
  );
}
