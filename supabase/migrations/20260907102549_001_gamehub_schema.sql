/*
# GameHub Controller - Full Database Schema

## Overview
Creates the complete schema for a gaming controller testing, customization,
mapping, and analytics platform. Users authenticate via Supabase Auth and
each table is owner-scoped (user_id defaults to auth.uid()) with RLS policies.

## New Tables
1. user_settings — per-user appearance and controller preferences
2. games — user's game library (name, genre, platform, description)
3. controller_profiles — named controller config profiles, optionally linked to a game
4. button_mappings — individual button→action assignments within a profile
5. gaming_sessions — start/stop session tracking with duration
6. button_statistics — aggregate press counts per button per user
7. controller_devices — record of controllers the user has connected
8. controller_events — realtime event log for button presses and axis movement

## Security
- RLS enabled on every table
- 4 policies per table (SELECT/INSERT/UPDATE/DELETE), scoped to authenticated users
- Ownership checked via auth.uid() = user_id (direct) or via parent table (EXISTS subquery)
- user_id columns default to auth.uid() so frontend inserts that omit user_id succeed

## Relationships
- users (auth.users) → games, controller_profiles, gaming_sessions, button_statistics,
  controller_devices, controller_events, user_settings
- games → controller_profiles
- controller_profiles → button_mappings (CASCADE delete)
*/

-- ============================================================
-- 1. user_settings
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light')),
  accent_color text NOT NULL DEFAULT 'green' CHECK (accent_color IN ('green','cyan','orange','pink','red','blue')),
  vibration_enabled boolean NOT NULL DEFAULT true,
  polling_interval integer NOT NULL DEFAULT 60 CHECK (polling_interval BETWEEN 16 AND 500),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON user_settings;
CREATE POLICY "select_own_settings" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_settings" ON user_settings;
CREATE POLICY "insert_own_settings" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_settings" ON user_settings;
CREATE POLICY "update_own_settings" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_settings" ON user_settings;
CREATE POLICY "delete_own_settings" ON user_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 2. games
-- ============================================================
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  genre text NOT NULL DEFAULT 'Action',
  platform text NOT NULL DEFAULT 'PC',
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_games_user_id ON games(user_id);
CREATE INDEX IF NOT EXISTS idx_games_genre ON games(genre);

DROP POLICY IF EXISTS "select_own_games" ON games;
CREATE POLICY "select_own_games" ON games FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_games" ON games;
CREATE POLICY "insert_own_games" ON games FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_games" ON games;
CREATE POLICY "update_own_games" ON games FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_games" ON games;
CREATE POLICY "delete_own_games" ON games FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 3. controller_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS controller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  game_id uuid REFERENCES games(id) ON DELETE SET NULL,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE controller_profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON controller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_game_id ON controller_profiles(game_id);

-- Profiles are owner-scoped via direct user_id for SELECT/INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "select_own_profiles" ON controller_profiles;
CREATE POLICY "select_own_profiles" ON controller_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_profiles" ON controller_profiles;
CREATE POLICY "insert_own_profiles" ON controller_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_profiles" ON controller_profiles;
CREATE POLICY "update_own_profiles" ON controller_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_profiles" ON controller_profiles;
CREATE POLICY "delete_own_profiles" ON controller_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 4. button_mappings (child of controller_profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS button_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES controller_profiles(id) ON DELETE CASCADE,
  button_name text NOT NULL,
  action text NOT NULL DEFAULT 'Unassigned',
  custom_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, button_name)
);
ALTER TABLE button_mappings ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_mappings_profile_id ON button_mappings(profile_id);

-- Mappings are scoped through their parent profile's owner
DROP POLICY IF EXISTS "select_own_mappings" ON button_mappings;
CREATE POLICY "select_own_mappings" ON button_mappings FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM controller_profiles
            WHERE controller_profiles.id = button_mappings.profile_id
            AND controller_profiles.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "insert_own_mappings" ON button_mappings;
CREATE POLICY "insert_own_mappings" ON button_mappings FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM controller_profiles
            WHERE controller_profiles.id = button_mappings.profile_id
            AND controller_profiles.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "update_own_mappings" ON button_mappings;
CREATE POLICY "update_own_mappings" ON button_mappings FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM controller_profiles
            WHERE controller_profiles.id = button_mappings.profile_id
            AND controller_profiles.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM controller_profiles
            WHERE controller_profiles.id = button_mappings.profile_id
            AND controller_profiles.user_id = auth.uid())
  );
DROP POLICY IF EXISTS "delete_own_mappings" ON button_mappings;
CREATE POLICY "delete_own_mappings" ON button_mappings FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM controller_profiles
            WHERE controller_profiles.id = button_mappings.profile_id
            AND controller_profiles.user_id = auth.uid())
  );

-- ============================================================
-- 5. gaming_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS gaming_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE SET NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  duration_seconds integer
);
ALTER TABLE gaming_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON gaming_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_game_id ON gaming_sessions(game_id);

DROP POLICY IF EXISTS "select_own_sessions" ON gaming_sessions;
CREATE POLICY "select_own_sessions" ON gaming_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_sessions" ON gaming_sessions;
CREATE POLICY "insert_own_sessions" ON gaming_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_sessions" ON gaming_sessions;
CREATE POLICY "update_own_sessions" ON gaming_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_sessions" ON gaming_sessions;
CREATE POLICY "delete_own_sessions" ON gaming_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 6. button_statistics
-- ============================================================
CREATE TABLE IF NOT EXISTS button_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  button_name text NOT NULL,
  press_count integer NOT NULL DEFAULT 0,
  last_pressed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, button_name)
);
ALTER TABLE button_statistics ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_button_stats_user_id ON button_statistics(user_id);

DROP POLICY IF EXISTS "select_own_button_stats" ON button_statistics;
CREATE POLICY "select_own_button_stats" ON button_statistics FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_button_stats" ON button_statistics;
CREATE POLICY "insert_own_button_stats" ON button_statistics FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_button_stats" ON button_statistics;
CREATE POLICY "update_own_button_stats" ON button_statistics FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_button_stats" ON button_statistics;
CREATE POLICY "delete_own_button_stats" ON button_statistics FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 7. controller_devices
-- ============================================================
CREATE TABLE IF NOT EXISTS controller_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  controller_name text NOT NULL,
  button_count integer NOT NULL DEFAULT 0,
  axis_count integer NOT NULL DEFAULT 0,
  vibration_support boolean NOT NULL DEFAULT false,
  last_connected_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, controller_name)
);
ALTER TABLE controller_devices ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON controller_devices(user_id);

DROP POLICY IF EXISTS "select_own_devices" ON controller_devices;
CREATE POLICY "select_own_devices" ON controller_devices FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_devices" ON controller_devices;
CREATE POLICY "insert_own_devices" ON controller_devices FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_devices" ON controller_devices;
CREATE POLICY "update_own_devices" ON controller_devices FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_devices" ON controller_devices;
CREATE POLICY "delete_own_devices" ON controller_devices FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- 8. controller_events (realtime event log)
-- ============================================================
CREATE TABLE IF NOT EXISTS controller_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  button_name text,
  value float,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE controller_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_events_user_id ON controller_events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON controller_events(created_at);

DROP POLICY IF EXISTS "select_own_events" ON controller_events;
CREATE POLICY "select_own_events" ON controller_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_events" ON controller_events;
CREATE POLICY "insert_own_events" ON controller_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_events" ON controller_events;
CREATE POLICY "delete_own_events" ON controller_events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger function (reusable)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_games_updated_at ON games;
CREATE TRIGGER trg_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON controller_profiles;
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON controller_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_settings_updated_at ON user_settings;
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- increment_button_stat function (atomic upsert for press counts)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_button_stat(
  p_user_id uuid,
  p_button_name text,
  p_increment integer DEFAULT 1
)
RETURNS void AS $$
BEGIN
  INSERT INTO button_statistics (user_id, button_name, press_count, last_pressed_at)
  VALUES (p_user_id, p_button_name, p_increment, now())
  ON CONFLICT (user_id, button_name)
  DO UPDATE SET
    press_count = button_statistics.press_count + EXCLUDED.press_count,
    last_pressed_at = now();
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Realtime: enable publication for realtime-relevant tables
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE controller_events;
ALTER PUBLICATION supabase_realtime ADD TABLE gaming_sessions;
