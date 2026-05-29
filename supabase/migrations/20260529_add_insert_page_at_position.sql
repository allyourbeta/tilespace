/*
  # Add insert_page_at_position function

  Moves a page to a target position and shifts the user's other pages to make
  room, instead of swapping two pages. This gives the overview an "insert"
  behavior that matches how tiles already reorder within a page
  (see insert_tile_at_position).

  Example: pages at positions [0,1,2,3,4], move the page at 4 to position 1:
    - Page at 4 goes to position 1
    - Pages at 1,2,3 shift up to 2,3,4

  Pages have a non-deferrable unique constraint on position (scoped per user),
  so we first park the dragged page at a temporary position (-999) and shift
  the remaining pages one at a time. That way no two pages ever share a
  position mid-operation. Scope is user_id only (pages have no page_id).

  To verify the assumed constraint, run:
    SELECT conname, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'pages'::regclass AND contype IN ('u','p');
*/

CREATE OR REPLACE FUNCTION insert_page_at_position(
  p_page_id uuid,
  p_target_position integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_position integer;
  page_user_id uuid;
  r RECORD;
BEGIN
  -- Get the page's current position and owner
  SELECT position, user_id
  INTO old_position, page_user_id
  FROM pages WHERE id = p_page_id;

  IF old_position IS NULL THEN
    RAISE EXCEPTION 'Page not found';
  END IF;

  IF old_position = p_target_position THEN
    RETURN;
  END IF;

  -- Step 1: park the dragged page out of the way
  UPDATE pages SET position = -999, updated_at = now()
  WHERE id = p_page_id;

  -- Step 2: shift the gap one row at a time so a slot is always free
  IF old_position < p_target_position THEN
    -- Moving forward: shift pages in (old, target] back by 1, lowest first
    FOR r IN
      SELECT id FROM pages
      WHERE user_id = page_user_id
        AND position > old_position
        AND position <= p_target_position
      ORDER BY position ASC
    LOOP
      UPDATE pages SET position = position - 1, updated_at = now()
      WHERE id = r.id;
    END LOOP;
  ELSE
    -- Moving backward: shift pages in [target, old) forward by 1, highest first
    FOR r IN
      SELECT id FROM pages
      WHERE user_id = page_user_id
        AND position >= p_target_position
        AND position < old_position
      ORDER BY position DESC
    LOOP
      UPDATE pages SET position = position + 1, updated_at = now()
      WHERE id = r.id;
    END LOOP;
  END IF;

  -- Step 3: drop the dragged page into its target slot
  UPDATE pages SET position = p_target_position, updated_at = now()
  WHERE id = p_page_id;
END;
$$;
