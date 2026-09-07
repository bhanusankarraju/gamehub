export interface Game {
  id: string;
  user_id: string;
  name: string;
  genre: string;
  platform: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface ControllerProfile {
  id: string;
  user_id: string;
  name: string;
  game_id: string | null;
  description: string;
  created_at: string;
  updated_at: string;
  games?: Pick<Game, 'name'> | null;
}

export interface ButtonMapping {
  id: string;
  profile_id: string;
  button_name: string;
  action: string;
  custom_action: string | null;
  created_at: string;
}

export interface GamingSession {
  id: string;
  user_id: string;
  game_id: string | null;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  games?: Pick<Game, 'name'> | null;
}

export interface ButtonStatistic {
  id: string;
  user_id: string;
  button_name: string;
  press_count: number;
  last_pressed_at: string;
}

export interface ControllerDevice {
  id: string;
  user_id: string;
  controller_name: string;
  button_count: number;
  axis_count: number;
  vibration_support: boolean;
  last_connected_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: 'dark' | 'light';
  accent_color: string;
  vibration_enabled: boolean;
  polling_interval: number;
  created_at: string;
  updated_at: string;
}

export interface ControllerEvent {
  id: string;
  user_id: string;
  event_type: string;
  button_name: string | null;
  value: number | null;
  created_at: string;
}

export interface AppUser {
  id: string;
  email: string;
}
