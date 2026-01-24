export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  current_palette: string;
  updated_at: string;
}

export interface UserPreferencesInsert {
  user_id: string;
  current_palette: string;
}
