/*
  # Add Palette Preferences Table
  
  1. New Tables
    - `user_preferences`
      - `id` (integer, primary key, always 1 for single-user)
      - `current_palette` (text) - the ID of the currently selected palette
      - `updated_at` (timestamptz)
  
  2. Changes
    - Clears existing tiles and links data to start fresh with new palette system
  
  3. Security
    - RLS enabled with public access (no auth per original design)
*/

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_palette text NOT NULL DEFAULT 'ocean',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read preferences"
  ON user_preferences FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert preferences"
  ON user_preferences FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update preferences"
  ON user_preferences FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Insert default preference row
INSERT INTO user_preferences (id, current_palette) 
VALUES (1, 'ocean')
ON CONFLICT (id) DO NOTHING;

-- Clear existing data for fresh start with palette system
DELETE FROM links;
DELETE FROM tiles;

-- Add color_index column to tiles for palette-relative coloring
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tiles' AND column_name = 'color_index'
  ) THEN
    ALTER TABLE tiles ADD COLUMN color_index integer NOT NULL DEFAULT 0;
  END IF;
END $$;