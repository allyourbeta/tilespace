-- TileSpace Database Schema
-- Multi-user with Row Level Security (RLS)
-- 
-- Run this migration against a fresh Supabase project

-- ============================================================================
-- TABLES
-- ============================================================================

-- Tiles table
CREATE TABLE IF NOT EXISTS tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Tile',
  emoji TEXT NOT NULL DEFAULT '📁',
  accent_color TEXT NOT NULL DEFAULT '#0891B2',
  color_index INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Position is unique PER USER, not globally
  UNIQUE(user_id, position)
);

-- Links table (includes both URL links and documents/notes)
CREATE TABLE IF NOT EXISTS links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tile_id UUID NOT NULL REFERENCES tiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'link' CHECK (type IN ('link', 'document')),
  title TEXT NOT NULL DEFAULT '',
  url TEXT,
  summary TEXT DEFAULT '',
  content TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_palette TEXT NOT NULL DEFAULT 'ocean-bold',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tiles_user_id ON tiles(user_id);
CREATE INDEX IF NOT EXISTS idx_tiles_user_position ON tiles(user_id, position);
CREATE INDEX IF NOT EXISTS idx_links_user_id ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_links_tile_id ON links(tile_id);
CREATE INDEX IF NOT EXISTS idx_links_tile_position ON links(tile_id, position);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Tiles policies: Users can only see/modify their own tiles
CREATE POLICY "Users can view own tiles" ON tiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tiles" ON tiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tiles" ON tiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tiles" ON tiles
  FOR DELETE USING (auth.uid() = user_id);

-- Links policies: Users can only see/modify their own links
CREATE POLICY "Users can view own links" ON links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own links" ON links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own links" ON links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own links" ON links
  FOR DELETE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to safely swap two tile positions (deferred constraint check)
CREATE OR REPLACE FUNCTION swap_tile_positions_safe(
  p_tile_a_id UUID,
  p_tile_b_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_pos_a INTEGER;
  v_pos_b INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Get current positions (and verify ownership)
  SELECT position INTO v_pos_a 
  FROM tiles 
  WHERE id = p_tile_a_id AND user_id = v_user_id;
  
  SELECT position INTO v_pos_b 
  FROM tiles 
  WHERE id = p_tile_b_id AND user_id = v_user_id;
  
  IF v_pos_a IS NULL OR v_pos_b IS NULL THEN
    RAISE EXCEPTION 'One or both tiles not found or not owned by user';
  END IF;
  
  -- Temporarily set position to -1 to avoid unique constraint violation
  UPDATE tiles SET position = -1, updated_at = NOW() 
  WHERE id = p_tile_a_id AND user_id = v_user_id;
  
  -- Update tile B to tile A's old position
  UPDATE tiles SET position = v_pos_a, updated_at = NOW() 
  WHERE id = p_tile_b_id AND user_id = v_user_id;
  
  -- Update tile A to tile B's old position
  UPDATE tiles SET position = v_pos_b, updated_at = NOW() 
  WHERE id = p_tile_a_id AND user_id = v_user_id;
END;
$$;

-- Function to safely move a tile to an empty position
CREATE OR REPLACE FUNCTION move_tile_to_position_safe(
  p_tile_id UUID,
  p_target_position INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_existing_tile_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if target position is occupied by this user
  SELECT id INTO v_existing_tile_id 
  FROM tiles 
  WHERE position = p_target_position AND user_id = v_user_id;
  
  IF v_existing_tile_id IS NOT NULL THEN
    RAISE EXCEPTION 'Position % is already occupied', p_target_position;
  END IF;
  
  -- Move the tile (verifying ownership)
  UPDATE tiles 
  SET position = p_target_position, updated_at = NOW() 
  WHERE id = p_tile_id AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tile not found or not owned by user';
  END IF;
END;
$$;

-- Function to create a tile safely with the next available position
CREATE OR REPLACE FUNCTION create_tile_safe(
  p_title TEXT,
  p_emoji TEXT,
  p_accent_color TEXT,
  p_color_index INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_new_id UUID;
  v_next_pos INTEGER;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Get next available position for this user
  SELECT COALESCE(MAX(position), -1) + 1 INTO v_next_pos 
  FROM tiles 
  WHERE user_id = v_user_id;
  
  -- Insert the new tile
  INSERT INTO tiles (user_id, title, emoji, accent_color, color_index, position)
  VALUES (v_user_id, p_title, p_emoji, p_accent_color, p_color_index, v_next_pos)
  RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS FOR RPC FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION swap_tile_positions_safe(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION move_tile_to_position_safe(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION create_tile_safe(TEXT, TEXT, TEXT, INTEGER) TO authenticated;
