/*
  # Add insert_tile_at_position function

  Moves a tile to a target position and shifts other tiles to make room,
  rather than swapping. This gives an "insert" behavior:

  Example: tiles at positions [0,1,2,3,4], move tile at 4 to position 1:
    - Tile at 4 goes to position 1
    - Tiles at 1,2,3 shift to 2,3,4

  Uses a temporary position (-999) to avoid unique constraint violations.
  The constraint on (user_id, page_id, position) may not be deferred,
  so we must avoid any moment where two tiles share a position.
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
  tile_user_id uuid;
  r RECORD;
BEGIN
  -- Get the tile's current position, page, and user
  SELECT position, page_id, user_id
  INTO old_position, tile_page_id, tile_user_id
  FROM tiles WHERE id = p_tile_id;

  IF old_position IS NULL THEN
    RAISE EXCEPTION 'Tile not found';
  END IF;

  IF old_position = p_target_position THEN
    RETURN;
  END IF;

  -- Step 1: Move dragged tile out of the way
  UPDATE tiles SET position = -999, updated_at = now()
  WHERE id = p_tile_id;

  -- Step 2: Shift tiles one at a time in the right order to avoid collisions
  IF old_position < p_target_position THEN
    -- Moving forward: shift tiles in (old, target] back by 1
    -- Process from lowest position up so each -1 shift moves into the
    -- now-vacant slot
    FOR r IN
      SELECT id FROM tiles
      WHERE page_id = tile_page_id
        AND user_id = tile_user_id
        AND position > old_position
        AND position <= p_target_position
      ORDER BY position ASC
    LOOP
      UPDATE tiles SET position = position - 1, updated_at = now()
      WHERE id = r.id;
    END LOOP;
  ELSE
    -- Moving backward: shift tiles in [target, old) forward by 1
    -- Process from highest position down so each +1 shift moves into the
    -- now-vacant slot
    FOR r IN
      SELECT id FROM tiles
      WHERE page_id = tile_page_id
        AND user_id = tile_user_id
        AND position >= p_target_position
        AND position < old_position
      ORDER BY position DESC
    LOOP
      UPDATE tiles SET position = position + 1, updated_at = now()
      WHERE id = r.id;
    END LOOP;
  END IF;

  -- Step 3: Place the tile at its target position
  UPDATE tiles SET position = p_target_position, updated_at = now()
  WHERE id = p_tile_id;
END;
$$;
