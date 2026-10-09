import type { DocTheme, MasterViewDoc } from '@/types/masterView';

export type TileSize = 'xl' | 'wide' | 'sm';

export interface ThemeGroup {
  theme: DocTheme;
  docs: MasterViewDoc[]; // newest first, includes hidden
}

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

  for (const doc of docs) {
    if (!doc.themeId || !themeById.has(doc.themeId)) continue;
    const bucket = byTheme.get(doc.themeId);
    if (bucket) bucket.push(doc);
    else byTheme.set(doc.themeId, [doc]);
  }

  return [...byTheme.entries()]
    .map(([themeId, themeDocs]) => ({
      theme: themeById.get(themeId)!,
      docs: sortDocsNewestFirst(themeDocs),
    }))
    .sort((a, b) => b.docs.length - a.docs.length || a.theme.sort - b.theme.sort);
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
