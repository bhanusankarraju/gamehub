import { supabase } from '@/lib/supabase';
import type { Game, ControllerProfile, ButtonMapping, GamingSession, ButtonStatistic, ControllerDevice, UserSettings } from '@/types';

export interface AnalyticsOverview {
  totalSessions: number;
  totalPlayTime: number;
  averageSession: number;
  longestSession: number;
  savedProfiles: number;
  totalGames: number;
  totalButtonPresses: number;
}

/* ── Games ── */
export async function fetchGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createGame(input: Pick<Game, 'name' | 'genre' | 'platform' | 'description'>): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateGame(id: string, input: Partial<Pick<Game, 'name' | 'genre' | 'platform' | 'description'>>): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteGame(id: string): Promise<void> {
  const { error } = await supabase.from('games').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ── Controller Profiles ── */
export async function fetchProfiles(): Promise<ControllerProfile[]> {
  const { data, error } = await supabase
    .from('controller_profiles')
    .select('*, games(id, name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProfile(input: { name: string; game_id?: string | null; description?: string }): Promise<ControllerProfile> {
  const { data, error } = await supabase
    .from('controller_profiles')
    .insert({ name: input.name, game_id: input.game_id ?? null, description: input.description ?? '' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProfile(id: string, input: { name?: string; game_id?: string | null; description?: string }): Promise<ControllerProfile> {
  const { data, error } = await supabase
    .from('controller_profiles')
    .update(input)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('controller_profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function duplicateProfile(id: string): Promise<ControllerProfile> {
  const { data: orig, error: e1 } = await supabase
    .from('controller_profiles')
    .select('*')
    .eq('id', id)
    .single();
  if (e1) throw new Error(e1.message);

  const { data: copy, error: e2 } = await supabase
    .from('controller_profiles')
    .insert({ name: `${orig.name} (Copy)`, game_id: orig.game_id, description: orig.description })
    .select()
    .single();
  if (e2) throw new Error(e2.message);

  const { data: mappings } = await supabase
    .from('button_mappings')
    .select('button_name, action, custom_action')
    .eq('profile_id', id);

  if (mappings && mappings.length > 0) {
    const newMappings = mappings.map((m: { button_name: string; action: string; custom_action: string | null }) => ({
      profile_id: copy.id, button_name: m.button_name, action: m.action, custom_action: m.custom_action,
    }));
    const { error: e3 } = await supabase.from('button_mappings').insert(newMappings);
    if (e3) throw new Error(e3.message);
  }
  return copy;
}

/* ── Button Mappings ── */
export async function fetchMappings(profileId: string): Promise<ButtonMapping[]> {
  const { data, error } = await supabase
    .from('button_mappings')
    .select('*')
    .eq('profile_id', profileId)
    .order('button_name', { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function saveMappingsBatch(profileId: string, mappings: { button_name: string; action: string; custom_action?: string | null }[]): Promise<void> {
  const { error: dErr } = await supabase.from('button_mappings').delete().eq('profile_id', profileId);
  if (dErr) throw new Error(dErr.message);
  if (mappings.length > 0) {
    const rows = mappings.map(m => ({ profile_id: profileId, ...m }));
    const { error: iErr } = await supabase.from('button_mappings').insert(rows);
    if (iErr) throw new Error(iErr.message);
  }
}

/* ── Gaming Sessions ── */
export async function fetchSessions(): Promise<GamingSession[]> {
  const { data, error } = await supabase
    .from('gaming_sessions')
    .select('*, games(id, name)')
    .order('start_time', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function startSession(gameId: string | null): Promise<GamingSession> {
  const { data, error } = await supabase
    .from('gaming_sessions')
    .insert({ game_id: gameId })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function stopSession(sessionId: string, durationSeconds: number): Promise<GamingSession> {
  const { data, error } = await supabase
    .from('gaming_sessions')
    .update({ end_time: new Date().toISOString(), duration_seconds: durationSeconds })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchActiveSession(): Promise<GamingSession | null> {
  const { data, error } = await supabase
    .from('gaming_sessions')
    .select('*')
    .is('end_time', null)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/* ── Button Statistics ── */
export async function fetchButtonStats(): Promise<ButtonStatistic[]> {
  const { data, error } = await supabase
    .from('button_statistics')
    .select('*')
    .order('press_count', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function incrementButtonStat(buttonName: string): Promise<void> {
  const { data: existing } = await supabase
    .from('button_statistics')
    .select('id, press_count')
    .eq('button_name', buttonName)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('button_statistics')
      .update({ press_count: existing.press_count + 1, last_pressed_at: new Date().toISOString() })
      .eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('button_statistics')
      .insert({ button_name: buttonName, press_count: 1 });
    if (error) throw new Error(error.message);
  }
}

/* ── Controller Devices ── */
export async function fetchControllerDevices(): Promise<ControllerDevice[]> {
  const { data, error } = await supabase
    .from('controller_devices')
    .select('*')
    .order('last_connected_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertControllerDevice(input: { controller_name: string; button_count: number; axis_count: number; vibration_support: boolean }): Promise<void> {
  const { error } = await supabase
    .from('controller_devices')
    .upsert({
      controller_name: input.controller_name,
      button_count: input.button_count,
      axis_count: input.axis_count,
      vibration_support: input.vibration_support,
      last_connected_at: new Date().toISOString(),
    }, { onConflict: 'user_id,controller_name' });
  if (error) throw new Error(error.message);
}

/* ── User Settings ── */
export async function fetchUserSettings(): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function upsertUserSettings(input: Partial<Pick<UserSettings, 'theme' | 'accent_color' | 'vibration_enabled' | 'polling_interval'>>): Promise<UserSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert(input, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

/* ── Analytics ── */
export async function fetchAnalyticsOverview(): Promise<AnalyticsOverview> {
  const [sessions, profiles, games, buttonStats] = await Promise.all([
    fetchSessions(),
    fetchProfiles(),
    fetchGames(),
    fetchButtonStats(),
  ]);

  const completedSessions = sessions.filter(s => s.duration_seconds != null);
  const totalPlayTime = completedSessions.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0);
  const longestSession = completedSessions.reduce((max, s) => Math.max(max, s.duration_seconds ?? 0), 0);
  const totalButtonPresses = buttonStats.reduce((sum, b) => sum + b.press_count, 0);

  return {
    totalSessions: sessions.length,
    totalPlayTime,
    averageSession: completedSessions.length > 0 ? Math.round(totalPlayTime / completedSessions.length) : 0,
    longestSession,
    savedProfiles: profiles.length,
    totalGames: games.length,
    totalButtonPresses,
  };
}

/* ── Controller Events (realtime log) ── */
export async function logControllerEvent(eventType: string, buttonName?: string, value?: number): Promise<void> {
  const { error } = await supabase
    .from('controller_events')
    .insert({
      event_type: eventType,
      button_name: buttonName ?? null,
      value: value ?? null,
    });
  if (error) throw new Error(error.message);
}
