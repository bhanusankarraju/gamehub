import { useState, useEffect, useCallback } from 'react';
import {
  Layers, Plus, Pencil, Copy, Trash2, Gamepad2, Save, X, Check,
  ChevronRight, Calendar, Settings2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useToast } from '@/contexts/ToastContext';
import {
  fetchProfiles, createProfile, updateProfile, deleteProfile,
  duplicateProfile, fetchMappings, saveMappingsBatch,
  fetchGames,
} from '@/lib/api';
import type { ControllerProfile, Game } from '@/types';
import { GAMEPAD_BUTTON_NAMES, ACTION_OPTIONS, PROFILE_TEMPLATES, DEFAULT_MAPPINGS } from '@/lib/constants';
import { formatDate, classNames } from '@/lib/utils';

type View = 'list' | 'editor';

interface MappingRow {
  button_name: string;
  action: string;
  custom_action: string | null;
}

export function ProfilesPage() {
  const { toast } = useToast();
  const [view, setView] = useState<View>('list');
  const [profiles, setProfiles] = useState<ControllerProfile[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState<ControllerProfile | null>(null);
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', game_id: '' as string, description: '' });
  const [errors, setErrors] = useState<{ name?: string }>({});

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<ControllerProfile | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const [p, g] = await Promise.all([fetchProfiles(), fetchGames()]);
      setProfiles(p);
      setGames(g);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load profiles', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const openCreateModal = () => {
    setEditMode(false);
    setForm({ name: '', game_id: '', description: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (p: ControllerProfile) => {
    setEditMode(true);
    setForm({ name: p.name, game_id: p.game_id ?? '', description: p.description });
    setErrors({});
    setModalOpen(true);
    setEditingProfile(p);
  };

  const handleSaveProfile = async () => {
    if (!form.name.trim()) {
      setErrors({ name: 'Profile name is required' });
      return;
    }
    try {
      if (editMode && editingProfile) {
        await updateProfile(editingProfile.id, {
          name: form.name.trim(),
          game_id: form.game_id || null,
          description: form.description.trim(),
        });
        toast('Profile updated', 'success');
      } else {
        await createProfile({
          name: form.name.trim(),
          game_id: form.game_id || null,
          description: form.description.trim(),
        });
        toast('Profile created', 'success');
      }
      setModalOpen(false);
      loadProfiles();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save profile', 'error');
    }
  };

  const handleDelete = async (profile: ControllerProfile) => {
    try {
      await deleteProfile(profile.id);
      toast('Profile deleted', 'success');
      loadProfiles();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete profile', 'error');
    }
  };

  const handleDuplicate = async (profile: ControllerProfile) => {
    try {
      await duplicateProfile(profile.id);
      toast('Profile duplicated', 'success');
      loadProfiles();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to duplicate profile', 'error');
    }
  };

  const openEditor = async (profile: ControllerProfile) => {
    setEditingProfile(profile);
    setView('editor');
    setMappingsLoading(true);
    try {
      const existing = await fetchMappings(profile.id);
      const map = new Map(existing.map(m => [m.button_name, m]));
      // Build full mapping rows for all standard buttons
      const rows: MappingRow[] = GAMEPAD_BUTTON_NAMES.map(btn => {
        const existingMapping = map.get(btn);
        return {
          button_name: btn,
          action: existingMapping?.action ?? DEFAULT_MAPPINGS[btn] ?? 'Unassigned',
          custom_action: existingMapping?.custom_action ?? null,
        };
      });
      setMappings(rows);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load mappings', 'error');
    } finally {
      setMappingsLoading(false);
    }
  };

  const updateMappingAction = (buttonName: string, action: string) => {
    setMappings(prev => prev.map(m =>
      m.button_name === buttonName
        ? { ...m, action, custom_action: action === 'Custom' ? (m.custom_action ?? '') : null }
        : m
    ));
  };

  const updateCustomAction = (buttonName: string, custom: string) => {
    setMappings(prev => prev.map(m =>
      m.button_name === buttonName ? { ...m, custom_action: custom } : m
    ));
  };

  const handleSaveMappings = async () => {
    if (!editingProfile) return;
    setSaving(true);
    try {
      await saveMappingsBatch(editingProfile.id, mappings);
      toast('Mappings saved successfully', 'success');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save mappings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleResetMappings = () => {
    setMappings(prev => prev.map(m => ({
      ...m,
      action: DEFAULT_MAPPINGS[m.button_name] ?? 'Unassigned',
      custom_action: null,
    })));
    toast('Mappings reset to defaults', 'info');
  };

  const handleApplyTemplate = (templateName: string) => {
    // Apply template-specific defaults
    if (templateName === 'Custom') {
      setMappings(prev => prev.map(m => ({ ...m, action: 'Unassigned', custom_action: null })));
    } else {
      setMappings(prev => prev.map(m => ({
        ...m,
        action: DEFAULT_MAPPINGS[m.button_name] ?? 'Unassigned',
        custom_action: null,
      })));
    }
    toast(`${templateName} template applied`, 'info');
  };

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div></AppLayout>;
  }

  // Editor view
  if (view === 'editor' && editingProfile) {
    return (
      <AppLayout>
        <div className="mb-6">
          <button
            onClick={() => { setView('list'); setEditingProfile(null); }}
            className="text-sm text-white/40 hover:text-white transition-colors mb-2 flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Back to profiles
          </button>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-white mb-1">{editingProfile.name}</h1>
          <p className="text-white/50 text-sm">{editingProfile.description || 'No description'}</p>
        </div>

        {mappingsLoading ? (
          <div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {/* Template quick-apply */}
            <div className="card p-4 mb-6 flex items-center gap-3 flex-wrap">
              <span className="text-xs text-white/40 uppercase tracking-wider">Templates:</span>
              {PROFILE_TEMPLATES.map(t => (
                <button
                  key={t.name}
                  onClick={() => handleApplyTemplate(t.name)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-800 hover:bg-surface-700 text-white/60 hover:text-white transition-all border border-white/5"
                >
                  {t.name}
                </button>
              ))}
            </div>

            {/* Mapping table */}
            <div className="card p-6 mb-6 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-xs uppercase tracking-wider text-white/40 font-semibold py-3 px-2">Physical Button</th>
                    <th className="text-left text-xs uppercase tracking-wider text-white/40 font-semibold py-3 px-2">Assigned Action</th>
                    <th className="text-left text-xs uppercase tracking-wider text-white/40 font-semibold py-3 px-2">Custom Action</th>
                  </tr>
                </thead>
                <tbody>
                  {mappings.map((m, i) => (
                    <tr key={m.button_name} className={classNames('border-b border-white/5', i % 2 === 1 && 'bg-white/[0.02]')}>
                      <td className="py-3 px-2">
                        <span className="font-mono font-bold text-sm neon-text">{m.button_name}</span>
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={m.action}
                          onChange={e => updateMappingAction(m.button_name, e.target.value)}
                          className="input-field py-2 text-sm w-full max-w-[200px]"
                        >
                          {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      </td>
                      <td className="py-3 px-2">
                        <input
                          type="text"
                          value={m.custom_action ?? ''}
                          onChange={e => updateCustomAction(m.button_name, e.target.value)}
                          disabled={m.action !== 'Custom'}
                          placeholder={m.action === 'Custom' ? 'Enter custom action...' : '—'}
                          className="input-field py-2 text-sm w-full max-w-[200px] disabled:opacity-30"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <button className="btn-primary" onClick={handleSaveMappings} disabled={saving}>
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Mapping'}
              </button>
              <button className="btn-secondary" onClick={handleResetMappings}>
                <Settings2 className="w-4 h-4" /> Reset Mapping
              </button>
            </div>
          </>
        )}
      </AppLayout>
    );
  }

  // List view
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-white mb-1">Controller Profiles</h1>
          <p className="text-white/50 text-sm">Create and manage custom button mappings for your games.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4" /> New Profile
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<Layers className="w-10 h-10" />}
            title="CREATE YOUR FIRST PROFILE"
            subtitle="Save custom controller mappings for your favorite games. Switch between profiles instantly."
            action={<button className="btn-primary" onClick={openCreateModal}><Plus className="w-4 h-4" /> Create Profile</button>}
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {profiles.map(p => (
            <div key={p.id} className="card p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl glass flex items-center justify-center">
                  <Layers className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                </div>
                <span className="badge badge-neutral">{p.games?.name ?? 'No game'}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-white mb-1">{p.name}</h3>
              <p className="text-sm text-white/40 mb-3 line-clamp-2">{p.description || 'No description'}</p>
              <div className="text-xs text-white/30 mb-4 flex items-center gap-2">
                <Calendar className="w-3 h-3" /> Created {formatDate(p.created_at)}
              </div>

              <div className="flex items-center gap-2">
                <button className="btn-primary text-xs flex-1 justify-center" onClick={() => openEditor(p)}>
                  <Gamepad2 className="w-3 h-3" /> Open
                </button>
                <button className="p-2 rounded-lg glass hover:bg-white/10 transition-colors" onClick={() => openEditModal(p)} aria-label="Edit profile">
                  <Pencil className="w-4 h-4 text-white/60" />
                </button>
                <button className="p-2 rounded-lg glass hover:bg-white/10 transition-colors" onClick={() => handleDuplicate(p)} aria-label="Duplicate profile">
                  <Copy className="w-4 h-4 text-white/60" />
                </button>
                <button className="p-2 rounded-lg glass hover:bg-neon-red/10 transition-colors" onClick={() => setDeleteTarget(p)} aria-label="Delete profile">
                  <Trash2 className="w-4 h-4 text-neon-red/60" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? 'Edit Profile' : 'Create Profile'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSaveProfile}>
              {editMode ? 'Save Changes' : 'Create Profile'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Profile Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
              className={`input-field ${errors.name ? 'border-neon-red' : ''}`}
              placeholder="e.g. FPS Pro, Racing Setup"
            />
            {errors.name && <p className="text-xs text-neon-red mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Game (optional)</label>
            <select
              value={form.game_id}
              onChange={e => setForm(f => ({ ...f, game_id: e.target.value }))}
              className="input-field"
            >
              <option value="">No game associated</option>
              {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-field resize-none"
              rows={3}
              placeholder="Describe this profile..."
            />
          </div>

          {/* Template suggestions */}
          {!editMode && (
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Quick Templates</label>
              <div className="grid grid-cols-2 gap-2">
                {PROFILE_TEMPLATES.map(t => (
                  <button
                    key={t.name}
                    onClick={() => setForm(f => ({ ...f, name: f.name || t.name, description: t.description }))}
                    className="text-left p-3 rounded-lg glass hover:bg-white/10 transition-colors"
                  >
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/40 mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete Profile"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will also delete all button mappings in this profile. This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </AppLayout>
  );
}
