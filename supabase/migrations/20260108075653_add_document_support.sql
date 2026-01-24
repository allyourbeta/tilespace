/*
  # Add Document Support to Links Table

  1. Changes
    - Add `type` column: 'link' or 'document' (default: 'link')
    - Add `content` column: stores document body text/markdown (nullable)
    - Make `url` column nullable (documents don't need URLs)
    - Add index on `type` column for filtering

  2. Notes
    - Existing links remain unchanged (default type is 'link')
    - Documents store their content in the `content` column
    - Summary field can still be used for documents (manual description)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'links' AND column_name = 'type'
  ) THEN
    ALTER TABLE links ADD COLUMN type text NOT NULL DEFAULT 'link';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'links' AND column_name = 'content'
  ) THEN
    ALTER TABLE links ADD COLUMN content text DEFAULT '';
  END IF;
END $$;

ALTER TABLE links ALTER COLUMN url DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_links_type ON links(type);