import { supabase } from './client';
import { getPalette } from '@/types';
import type { DocTheme, MasterViewDoc, AskResultDoc } from '@/types/masterView';

export interface RefreshResult {
  ok: boolean;
  error?: string;
}

/** Incremental: summarizes changed/new documents and re-themes only when enough has changed. */
export async function refreshMasterView(): Promise<RefreshResult> {
  const { data, error } = await supabase.functions.invoke('master-view', {
    body: { action: 'refresh' },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: data?.ok !== false, error: data?.error };
}

export async function askMasterView(query: string): Promise<AskResultDoc[]> {
  const { data, error } = await supabase.functions.invoke('master-view', {
    body: { action: 'ask', query },
  });
  if (error) throw error;
  return (data?.results ?? []).map((r: { link_id: string; reason: string }) => ({
    linkId: r.link_id,
    reason: r.reason,
  }));
}

export async function fetchThemes(): Promise<DocTheme[]> {
  const { data, error } = await supabase
    .from('doc_theme')
    .select('id, name, swatch, sort, created_at')
    .order('sort');

  if (error) throw error;
  return data ?? [];
}

/**
 * Flattens doc_insight + links + tiles + pages into display-ready rows.
 * Joined client-side (three small queries) rather than a PostgREST nested
 * select, to sidestep foreign-key-path ambiguity on tiles/pages.
 */
export async function fetchMasterViewDocs(): Promise<MasterViewDoc[]> {
  const [{ data: insights, error: insightsErr }, { data: docs, error: docsErr }] = await Promise.all([
    supabase.from('doc_insight').select('link_id, summary, hidden, theme_id'),
    supabase.from('links').select('id, title, created_at, tile_id').eq('type', 'document'),
  ]);
  if (insightsErr) throw insightsErr;
  if (docsErr) throw docsErr;

  const tileIds = [...new Set((docs ?? []).map((d) => d.tile_id))];
  const { data: tiles, error: tilesErr } = tileIds.length
    ? await supabase.from('tiles').select('id, page_id').in('id', tileIds)
    : { data: [], error: null };
  if (tilesErr) throw tilesErr;

  const pageIds = [...new Set((tiles ?? []).map((t) => t.page_id))];
  const { data: pages, error: pagesErr } = pageIds.length
    ? await supabase.from('pages').select('id, title, palette_id').in('id', pageIds)
    : { data: [], error: null };
  if (pagesErr) throw pagesErr;

  const pageByTileId = new Map<string, { title: string; palette_id: string }>();
  for (const tile of tiles ?? []) {
    const page = (pages ?? []).find((p) => p.id === tile.page_id);
    if (page) pageByTileId.set(tile.id, page);
  }

  const docById = new Map((docs ?? []).map((d) => [d.id, d]));

  return (insights ?? [])
    .map((insight) => {
      const doc = docById.get(insight.link_id);
      if (!doc) return null;
      const page = pageByTileId.get(doc.tile_id);
      return {
        linkId: insight.link_id,
        title: doc.title,
        createdAt: doc.created_at,
        summary: insight.summary,
        hidden: insight.hidden,
        themeId: insight.theme_id,
        pageTitle: page?.title ?? '',
        pageSwatch: page ? getPalette(page.palette_id).swatch : '#8C8A83',
      } satisfies MasterViewDoc;
    })
    .filter((doc): doc is MasterViewDoc => doc !== null);
}

export async function setDocHidden(linkId: string, hidden: boolean): Promise<void> {
  const { error } = await supabase.from('doc_insight').update({ hidden }).eq('link_id', linkId);
  if (error) throw error;
}
