/*
  # Create tiles and links tables for visual dashboard

  1. New Tables
    - `tiles`
      - `id` (uuid, primary key)
      - `title` (text) - name of the tile
      - `emoji` (text) - emoji icon for visual recognition
      - `accent_color` (text) - hex color for tile styling
      - `position` (integer) - order position for drag-and-drop sorting
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `links`
      - `id` (uuid, primary key)
      - `tile_id` (uuid, foreign key) - which tile this link belongs to
      - `title` (text) - display name of the link
      - `url` (text) - the URL
      - `summary` (text, optional) - brief description
      - `position` (integer) - order within the tile
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Public read/write access (no auth per user request)
*/

CREATE TABLE IF NOT EXISTS tiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  emoji text DEFAULT '',
  accent_color text NOT NULL DEFAULT '#4ECDC4',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tile_id uuid NOT NULL REFERENCES tiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  url text NOT NULL DEFAULT '',
  summary text DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read tiles"
  ON tiles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert tiles"
  ON tiles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update tiles"
  ON tiles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete tiles"
  ON tiles FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read links"
  ON links FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert links"
  ON links FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update links"
  ON links FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete links"
  ON links FOR DELETE
  TO anon
  USING (true);

CREATE INDEX idx_tiles_position ON tiles(position);
CREATE INDEX idx_links_tile_id ON links(tile_id);
CREATE INDEX idx_links_position ON links(tile_id, position);