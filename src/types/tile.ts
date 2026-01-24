export interface Tile {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  accent_color: string;
  color_index: number;
  position: number;
  created_at: string;
  updated_at: string;
  links?: Link[];
}

export interface TileInsert {
  user_id: string;
  title: string;
  emoji: string;
  accent_color: string;
  color_index: number;
  position: number;
}

export interface TileUpdate {
  title?: string;
  emoji?: string;
  accent_color?: string;
  color_index?: number;
  position?: number;
}

// Database row type (snake_case from Supabase)
export interface TileRow {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  accent_color: string;
  color_index: number;
  position: number;
  created_at: string;
  updated_at: string;
}

import type { Link } from './link';
