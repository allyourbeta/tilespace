/*
  # Master View: themes and per-document insights

  1. New tables
    - `doc_theme`: one row per auto-generated theme (name, swatch, display
      sort order), scoped to its owner so each user gets their own set.
    - `doc_insight`: one row per document (`links` row with
      type = 'document'), keyed by `link_id`. Holds the model-generated
      25-word summary, a content hash used to detect when a document needs
      re-summarizing, which theme it currently belongs to, and whether the
      user hid it from Master View.

  2. Notes
    - Both tables are additive only; no existing table is altered.
    - RLS mirrors `links`: owner-only, via a direct `user_id` column on
      `doc_theme` and via a join to `links.user_id` on `doc_insight` (its
      ownership trail already runs through `link_id`).
    - `doc_insight.theme_id` is nullable: a document can have a summary
      before the next theming pass assigns it a theme.
*/

CREATE TABLE IF NOT EXISTS doc_theme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  swatch TEXT NOT NULL,
  sort INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS doc_insight (
  link_id UUID PRIMARY KEY REFERENCES links(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  content_hash TEXT NOT NULL DEFAULT '',
  theme_id UUID REFERENCES doc_theme(id) ON DELETE SET NULL,
  hidden BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_theme_user_id ON doc_theme(user_id);
CREATE INDEX IF NOT EXISTS idx_doc_insight_theme_id ON doc_insight(theme_id);

ALTER TABLE doc_theme ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_insight ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own themes" ON doc_theme
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own themes" ON doc_theme
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own themes" ON doc_theme
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own themes" ON doc_theme
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own doc insights" ON doc_insight
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM links WHERE links.id = doc_insight.link_id AND links.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own doc insights" ON doc_insight
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM links WHERE links.id = doc_insight.link_id AND links.user_id = auth.uid())
  );

CREATE POLICY "Users can update own doc insights" ON doc_insight
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM links WHERE links.id = doc_insight.link_id AND links.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own doc insights" ON doc_insight
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM links WHERE links.id = doc_insight.link_id AND links.user_id = auth.uid())
  );
