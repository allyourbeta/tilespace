export type LinkType = 'link' | 'document';

export interface Link {
  id: string;
  user_id: string;
  tile_id: string;
  type: LinkType;
  title: string;
  url: string | null;
  summary: string;
  content: string;
  position: number;
  created_at: string;
}

export interface LinkInsert {
  user_id: string;
  tile_id: string;
  type: LinkType;
  title: string;
  url: string | null;
  summary: string;
  content: string;
  position: number;
}

export interface LinkUpdate {
  title?: string;
  url?: string | null;
  summary?: string;
  content?: string;
  position?: number;
  tile_id?: string;
}

// Database row type (snake_case from Supabase)
export interface LinkRow {
  id: string;
  user_id: string;
  tile_id: string;
  type: string;
  title: string;
  url: string | null;
  summary: string;
  content: string;
  position: number;
  created_at: string;
}
