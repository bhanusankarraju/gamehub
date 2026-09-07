import { useState, useEffect, useCallback, useMemo } from 'react';
import { Library, Plus, Pencil, Trash2, Search, Gamepad2, X, Filter, Layers, Calendar } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/Loading';
import { useToast } from '@/contexts/ToastContext';
import {
  fetchGames, createGame, updateGame, deleteGame, fetchProfiles,
} from '@/lib/api';
import type { Game, ControllerProfile } from '@/types';
import { GAME_GENRES, PLATFORMS } from '@/lib/constants';
import { formatDate, classNames } from '@/lib/utils';

export function GamesPage() {
  const { toast } = useToast();
  const [games, setGames] = useState<Game[]>([]);
  const [profiles, setProfiles] = useState<ControllerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genreFilter, setGenreFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [form, setForm] = useState({ name: '', genre: 'Action', platform: 'PC', description: '' });
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [saving, setSaving] = useState(false);

  // Detail modal
  const [detailGame, setDetailGame] = useState<Game | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Game | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [g, p] = await Promise.all([fetchGames(), fetchProfiles()]);
      setGames(g);
      setProfiles(p);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load games', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const matchesSearch = !debouncedSearch ||
        g.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        g.description.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesGenre = genreFilter === 'all' || g.genre === genreFilter;
      return matchesSearch && matchesGenre;
    });
  }, [games, debouncedSearch, genreFilter]);

  const profilesForGame = (gameId: string) => profiles.filter(p => p.game_id === gameId);

  const openCreateModal = () => {
    setEditMode(false);
    setEditingGame(null);
    setForm({ name: '', genre: 'Action', platform: 'PC', description: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEditModal = (game: Game) => {
    setEditMode(true);
    setEditingGame(game);
    setForm({ name: game.name, genre: game.genre, platform: game.platform, description: game.description });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setErrors({ name: 'Game name is required' });
      return;
    }
    setSaving(true);
    try {
      if (editMode && editingGame) {
        await updateGame(editingGame.id, {
          name: form.name.trim(),
          genre: form.genre,
          platform: form.platform,
          description: form.description.trim(),
        });
        toast('Game updated', 'success');
      } else {
        await createGame({
          name: form.name.trim(),
          genre: form.genre,
          platform: form.platform,
          description: form.description.trim(),
        });
        toast('Game added to library', 'success');
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to save game', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (game: Game) => {
    try {
      await deleteGame(game.id);
      toast('Game deleted', 'success');
      loadData();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to delete game', 'error');
    }
  };

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center py-20"><LoadingSpinner size="lg" /></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-wide text-white mb-1">Game Library</h1>
          <p className="text-white/50 text-sm">Manage your games and associate controller profiles.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4" /> Add Game
        </button>
      </div>

      {/* Search and filter */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search games..."
            className="input-field pl-10"
            aria-label="Search games"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <select
            value={genreFilter}
            onChange={e => setGenreFilter(e.target.value)}
            className="input-field pl-10 pr-8"
            aria-label="Filter by genre"
          >
            <option value="all">All Genres</option>
            {GAME_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<Library className="w-10 h-10" />}
            title="ADD YOUR FIRST GAME"
            subtitle="Build your game library to track sessions, create profiles, and analyze your gaming patterns."
            action={<button className="btn-primary" onClick={openCreateModal}><Plus className="w-4 h-4" /> Add Game</button>}
          />
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon={<Search className="w-10 h-10" />}
            title="NO GAMES FOUND"
            subtitle="No games match your search. Try a different keyword or filter."
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {filteredGames.map(g => {
            const linkedProfiles = profilesForGame(g.id);
            return (
              <div key={g.id} className="card p-5 group cursor-pointer" onClick={() => setDetailGame(g)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl glass flex items-center justify-center font-display font-bold text-lg" style={{ color: 'var(--accent)' }}>
                    {g.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" onClick={() => openEditModal(g)} aria-label="Edit game">
                      <Pencil className="w-3.5 h-3.5 text-white/60" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-neon-red/10 transition-colors" onClick={() => setDeleteTarget(g)} aria-label="Delete game">
                      <Trash2 className="w-3.5 h-3.5 text-neon-red/60" />
                    </button>
                  </div>
                </div>
                <h3 className="font-display font-bold text-base text-white mb-1">{g.name}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-neutral">{g.genre}</span>
                  <span className="text-xs text-white/30">{g.platform}</span>
                </div>
                <p className="text-xs text-white/40 line-clamp-2 mb-3">{g.description || 'No description'}</p>
                <div className="flex items-center justify-between text-xs text-white/30">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(g.created_at)}</span>
                  {linkedProfiles.length > 0 && (
                    <span className="flex items-center gap-1 neon-text"><Layers className="w-3 h-3" /> {linkedProfiles.length} {linkedProfiles.length === 1 ? 'profile' : 'profiles'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? 'Edit Game' : 'Add Game'}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Add Game'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Game Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
              className={`input-field ${errors.name ? 'border-neon-red' : ''}`}
              placeholder="e.g. GTA V, Forza Horizon, Apex Legends"
            />
            {errors.name && <p className="text-xs text-neon-red mt-1.5">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Genre</label>
              <select value={form.genre} onChange={e => setForm(f => ({ ...f, genre: e.target.value }))} className="input-field">
                {GAME_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Platform</label>
              <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} className="input-field">
                {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-field resize-none"
              rows={3}
              placeholder="Brief description of the game..."
            />
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={!!detailGame}
        onClose={() => setDetailGame(null)}
        title={detailGame?.name ?? ''}
        size="lg"
        footer={<button className="btn-secondary" onClick={() => setDetailGame(null)}>Close</button>}
      >
        {detailGame && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="badge badge-success">{detailGame.genre}</span>
              <span className="badge badge-neutral">{detailGame.platform}</span>
              <span className="text-xs text-white/30">Added {formatDate(detailGame.created_at)}</span>
            </div>
            <div>
              <h4 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Description</h4>
              <p className="text-sm text-white/70 leading-relaxed">{detailGame.description || 'No description provided.'}</p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Linked Controller Profiles</h4>
              {profilesForGame(detailGame.id).length > 0 ? (
                <div className="space-y-2">
                  {profilesForGame(detailGame.id).map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg glass">
                      <Layers className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{p.name}</div>
                        <div className="text-xs text-white/40">{p.description || 'No description'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/40">No profiles linked to this game yet.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Delete Game"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Linked profiles will remain but will no longer be associated with this game.`}
        confirmLabel="Delete"
      />
    </AppLayout>
  );
}


