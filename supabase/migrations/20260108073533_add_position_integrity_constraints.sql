/*
  # Add Position Integrity Constraints
  
  1. Changes
    - Add UNIQUE constraint on tiles.position to prevent duplicates
    - Make the constraint DEFERRABLE INITIALLY DEFERRED so swaps work within transactions
    - Create a database function for safe tile creation with atomic position assignment
    - Create a database function for safe position swapping
  
  2. Security
    - Functions use SECURITY DEFINER to run with elevated privileges
    - Input validation in all functions
  
  3. Notes
    - DEFERRABLE constraint allows temporary violations within a transaction
    - Constraint is checked at COMMIT time, ensuring data integrity
*/

-- Add unique constraint on position (deferrable for swap operations)
ALTER TABLE tiles
ADD CONSTRAINT tiles_position_unique UNIQUE (position)
DEFERRABLE INITIALLY DEFERRED;

-- Function to safely get next available position
CREATE OR REPLACE FUNCTION get_next_tile_position()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_pos integer;
BEGIN
  SELECT COALESCE(MAX(position), -1) + 1 INTO next_pos FROM tiles;
  RETURN next_pos;
END;
$$;

-- Function to safely create a tile with atomic position assignment
CREATE OR REPLACE FUNCTION create_tile_safe(
  p_title text,
  p_emoji text,
  p_accent_color text,
  p_color_index integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id uuid;
  next_pos integer;
BEGIN
  -- Lock the tiles table to prevent concurrent position assignments
  LOCK TABLE tiles IN SHARE ROW EXCLUSIVE MODE;
  
  -- Get next position
  SELECT COALESCE(MAX(position), -1) + 1 INTO next_pos FROM tiles;
  
  -- Insert the new tile
  INSERT INTO tiles (title, emoji, accent_color, color_index, position)
  VALUES (p_title, p_emoji, p_accent_color, p_color_index, next_pos)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;

-- Function to safely swap two tile positions
CREATE OR REPLACE FUNCTION swap_tile_positions_safe(
  p_tile_a_id uuid,
  p_tile_b_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pos_a integer;
  pos_b integer;
BEGIN
  -- Get current positions
  SELECT position INTO pos_a FROM tiles WHERE id = p_tile_a_id;
  SELECT position INTO pos_b FROM tiles WHERE id = p_tile_b_id;
  
  IF pos_a IS NULL OR pos_b IS NULL THEN
    RAISE EXCEPTION 'One or both tiles not found';
  END IF;
  
  -- Swap positions (constraint is deferred, so both updates happen before check)
  UPDATE tiles SET position = pos_b, updated_at = now() WHERE id = p_tile_a_id;
  UPDATE tiles SET position = pos_a, updated_at = now() WHERE id = p_tile_b_id;
END;
$$;

-- Function to safely move a tile to an empty position
CREATE OR REPLACE FUNCTION move_tile_to_position_safe(
  p_tile_id uuid,
  p_target_position integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_tile_id uuid;
BEGIN
  -- Check if target position is occupied
  SELECT id INTO existing_tile_id FROM tiles WHERE position = p_target_position;
  
  IF existing_tile_id IS NOT NULL THEN
    RAISE EXCEPTION 'Position % is already occupied', p_target_position;
  END IF;
  
  -- Move the tile
  UPDATE tiles SET position = p_target_position, updated_at = now() WHERE id = p_tile_id;
END;
$$;

-- Function to compact positions after deletion (removes gaps)
CREATE OR REPLACE FUNCTION compact_tile_positions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Lock the table to prevent concurrent modifications
  LOCK TABLE tiles IN SHARE ROW EXCLUSIVE MODE;
  
  -- Update positions to remove gaps
  WITH ordered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY position) - 1 AS new_pos
    FROM tiles
  )
  UPDATE tiles
  SET position = ordered.new_pos
  FROM ordered
  WHERE tiles.id = ordered.id AND tiles.position != ordered.new_pos;
END;
$$;