/*
  # Add insert_tile_at_position function

  Moves a tile to a target position and shifts other tiles to make room,
  rather than swapping. This gives an "insert" behavior:

  Example: tiles at positions [0,1,2,3,4], move tile at 4 to position 1:
    - Tile at 4 goes to position 1
    - Tiles at 1,2,3 shift to 2,3,4

  Example: tiles at positions [0,1,2,3,4], move tile at 1 to position 3:
    - Tile at 1 goes to position 3
    - Tiles at 2,3 shift to 1,2
*/

CREATE OR REPLACE FUNCTION insert_tile_at_position(
  p_tile_id uuid,
  p_target_position integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_position integer;
  tile_page_id uuid;
BEGIN
  -- Get the tile's current position and page
  SELECT position, page_id INTO old_position, tile_page_id
  FROM tiles WHERE id = p_tile_id;

  IF old_position IS NULL THEN
    RAISE EXCEPTION 'Tile not found';
  END IF;

  IF old_position = p_target_position THEN
    RETURN; -- nothing to do
  END IF;

  -- Temporarily move dragged tile out of the way
  UPDATE tiles SET position = -999 WHERE id = p_tile_id;

  IF old_position < p_target_position THEN
    -- Moving forward: shift tiles in (old, target] back by 1
    UPDATE tiles
    SET position = position - 1, updated_at = now()
    WHERE page_id = tile_page_id
      AND position > old_position
      AND position <= p_target_position;
  ELSE
    -- Moving backward: shift tiles in [target, old) forward by 1
    UPDATE tiles
    SET position = position + 1, updated_at = now()
    WHERE page_id = tile_page_id
      AND position >= p_target_position
      AND position < old_position;
  END IF;

  -- Place the tile at its target position
  UPDATE tiles
  SET position = p_target_position, updated_at = now()
  WHERE id = p_tile_id;
END;
$$;
