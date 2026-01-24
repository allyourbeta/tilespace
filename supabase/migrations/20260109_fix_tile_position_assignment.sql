/*
  # Fix tile position assignment
  
  Changes get_next_tile_position() to find the first empty slot within the
  current grid capacity, rather than always using MAX(position) + 1.
  
  Grid capacity tiers:
  - 0-15 tiles: capacity 16 (positions 0-15)
  - 16-19 tiles: capacity 20 (positions 0-19)  
  - 20-24 tiles: capacity 25 (positions 0-24)
  - 25 tiles: max, cannot add more
*/

CREATE OR REPLACE FUNCTION get_next_tile_position()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tile_count integer;
  capacity integer;
  occupied_positions integer[];
  pos integer;
BEGIN
  -- Count current tiles
  SELECT COUNT(*) INTO tile_count FROM tiles;
  
  -- Check if at max capacity
  IF tile_count >= 25 THEN
    RAISE EXCEPTION 'Maximum tile limit (25) reached';
  END IF;
  
  -- Determine grid capacity based on tile count (after adding new tile)
  IF tile_count < 16 THEN
    capacity := 16;
  ELSIF tile_count < 20 THEN
    capacity := 20;
  ELSE
    capacity := 25;
  END IF;
  
  -- Get all occupied positions
  SELECT ARRAY_AGG(position) INTO occupied_positions FROM tiles;
  
  -- Handle empty array case
  IF occupied_positions IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Find first empty position from 0 to capacity-1
  FOR pos IN 0..(capacity - 1) LOOP
    IF NOT (pos = ANY(occupied_positions)) THEN
      RETURN pos;
    END IF;
  END LOOP;
  
  -- Should never reach here if capacity logic is correct
  RAISE EXCEPTION 'No empty position found (this should not happen)';
END;
$$;

-- Also update create_tile_safe to use the new logic
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
  
  -- Get next available position (uses the updated logic)
  next_pos := get_next_tile_position();
  
  -- Insert the new tile
  INSERT INTO tiles (title, emoji, accent_color, color_index, position)
  VALUES (p_title, p_emoji, p_accent_color, p_color_index, next_pos)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$$;
