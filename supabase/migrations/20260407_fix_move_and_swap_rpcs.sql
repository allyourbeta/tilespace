/*
  # Fix move and swap RPCs for scoped position uniqueness

  Bug 1: move_tile_to_position_safe checks position globally instead of
  scoping to (user_id, page_id). Any tile on any page with that position
  number blocks the move.

  Bug 2: swap_tile_positions_safe does two direct UPDATEs which transiently
  violate the non-deferred unique constraint on (user_id, page_id, position).

  Fixes:
  - move: scope the occupancy check to same user_id and page_id
  - swap: use temp position -999 to avoid transient duplicates
*/

-- Fix 1: move_tile_to_position_safe — scope check to user+page
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
  tile_page_id uuid;
  tile_user_id uuid;
BEGIN
  -- Get the tile's page and user
  SELECT page_id, user_id INTO tile_page_id, tile_user_id
  FROM tiles WHERE id = p_tile_id;

  IF tile_page_id IS NULL THEN
    RAISE EXCEPTION 'Tile not found';
  END IF;

  -- Check if target position is occupied ON THE SAME PAGE for the same user
  SELECT id INTO existing_tile_id
  FROM tiles
  WHERE position = p_target_position
    AND page_id = tile_page_id
    AND user_id = tile_user_id;

  IF existing_tile_id IS NOT NULL THEN
    RAISE EXCEPTION 'Position % is already occupied', p_target_position;
  END IF;

  -- Move the tile
  UPDATE tiles SET position = p_target_position, updated_at = now()
  WHERE id = p_tile_id;
END;
$$;

-- Fix 2: swap_tile_positions_safe — use temp position to avoid constraint violation
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

  -- Use temp position to avoid transient unique constraint violation
  UPDATE tiles SET position = -999, updated_at = now() WHERE id = p_tile_a_id;
  UPDATE tiles SET position = pos_a, updated_at = now() WHERE id = p_tile_b_id;
  UPDATE tiles SET position = pos_b, updated_at = now() WHERE id = p_tile_a_id;
END;
$$;
