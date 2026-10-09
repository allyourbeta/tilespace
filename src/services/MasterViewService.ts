import type { DocTheme, MasterViewDoc } from '@/types/masterView';
import { UNSORTED_SWATCH } from '@/lib/swatches';

export type TileSize = 'xl' | 'wide' | 'sm';

export interface ThemeGroup {
  theme: DocTheme;
  docs: MasterViewDoc[]; // newest first, includes hidden
}

/**
 * Synthetic theme for documents whose `theme_id` is null or points at a
 * theme that no longer exists (SPEC_new_docs_get_a_theme_2026-10-09.md,
 * Decision 2) — a model error, or a document the model judged didn't fit
 * any existing theme. Never written to `doc_theme`; `groupDocsByTheme`
 * fabricates it fresh on every call so it never needs a migration.
 */
export const UNSORTED_THEME_ID = '__unsorted__';

const UNSORTED_THEME: DocTheme = {
  id: UNSORTED_THEME_ID,
  name: 'Not sorted yet',
  swatch: UNSORTED_SWATCH,
  sort: Number.MAX_SAFE_INTEGER,
  created_at: '',
};

export function sortDocsNewestFirst(docs: MasterViewDoc[]): MasterViewDoc[] {
  return [...docs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function visibleDocs(docs: MasterViewDoc[]): MasterViewDoc[] {
  return docs.filter((d) => !d.hidden);
}

export function hiddenDocs(docs: MasterViewDoc[]): MasterViewDoc[] {
  return docs.filter((d) => d.hidden);
}

/**
 * Groups documents under their theme, largest group first (ties broken by
 * the server-persisted sort order), with themes that have no documents
 * dropped. Matches TARGET_master_view.html section C's ordering, which
 * drives tile size: the largest theme is tile rank 0.
 */
export function groupDocsByTheme(docs: MasterViewDoc[], themes: DocTheme[]): ThemeGroup[] {
  const themeById = new Map(themes.map((t) => [t.id, t]));
  const byTheme = new Map<string, MasterViewDoc[]>();
  const unsorted: MasterViewDoc[] = [];

  for (const doc of docs) {
    if (!doc.themeId || !themeById.has(doc.themeId)) {
      unsorted.push(doc);
      continue;
    }
    const bucket = byTheme.get(doc.themeId);
    if (bucket) bucket.push(doc);
    else byTheme.set(doc.themeId, [doc]);
  }

  const groups = [...byTheme.entries()]
    .map(([themeId, themeDocs]) => ({
      theme: themeById.get(themeId)!,
      docs: sortDocsNewestFirst(themeDocs),
    }))
    .sort((a, b) => b.docs.length - a.docs.length || a.theme.sort - b.theme.sort);

  // Always last, regardless of size — it is a parking spot, not a theme.
  if (unsorted.length > 0) {
    groups.push({ theme: UNSORTED_THEME, docs: sortDocsNewestFirst(unsorted) });
  }

  return groups;
}

/** Rank 0 (the largest theme) is the one big 2x2 tile; everything else is uniform. */
export function tileSizeForRank(rank: number): TileSize {
  if (rank === 0) return 'xl';
  if (rank === 1 || rank === 2) return 'wide';
  return 'sm';
}

/** Big tile shows 5 newest titles; every other size shows 3. */
export function maxTitlesForRank(rank: number): number {
  return rank === 0 ? 5 : 3;
}

export interface TileTitles {
  titles: MasterViewDoc[];
  moreCount: number;
}

/**
 * All titles fit within `max`, shown in full. Past that, the newest titles
 * that still fit alongside a trailing "N more" row (which opens the theme's
 * category instead of a document) — so the row count never exceeds `max`.
 */
export function titlesForTile(docs: MasterViewDoc[], max: number): TileTitles {
  if (docs.length <= max) return { titles: docs, moreCount: 0 };
  return { titles: docs.slice(0, max - 1), moreCount: docs.length - (max - 1) };
}
