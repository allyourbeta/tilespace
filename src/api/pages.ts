import { supabase, getCurrentUserId } from './client';
import type { Page } from '@/types/page';
import { GRID_CONFIG } from '@/lib/constants';

export async function fetchPages(): Promise<Page[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('position');

  if (error) throw error;
  return data || [];
}

export async function createPage(title: string, position: number, paletteId: string): Promise<Page> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('pages')
    .insert({
      user_id: userId,
      title,
      position,
      palette_id: paletteId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePage(id: string, updates: Partial<Page>): Promise<void> {
  const { error } = await supabase
    .from('pages')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function updatePagePalette(pageId: string, paletteId: string): Promise<void> {
  const { error } = await supabase
    .from('pages')
    .update({ palette_id: paletteId, updated_at: new Date().toISOString() })
    .eq('id', pageId);

  if (error) throw error;
}

export async function swapPagePositions(pageAId: string, pageBId: string): Promise<void> {
  const { data: pages, error: fetchError } = await supabase
    .from('pages')
    .select('id, position')
    .in('id', [pageAId, pageBId]);

  if (fetchError) throw fetchError;
  if (!pages || pages.length !== 2) throw new Error('Pages not found');

  const pageA = pages.find(p => p.id === pageAId);
  const pageB = pages.find(p => p.id === pageBId);

  if (!pageA || !pageB) throw new Error('Pages not found');

  const tempPosition = GRID_CONFIG.TEMP_POSITION;

  await supabase.from('pages').update({ position: tempPosition }).eq('id', pageAId);
  await supabase.from('pages').update({ position: pageA.position }).eq('id', pageBId);
  await supabase.from('pages').update({ position: pageB.position }).eq('id', pageAId);
}

export async function resetPage(pageId: string): Promise<void> {
  const { data: tiles } = await supabase
    .from('tiles')
    .select('id')
    .eq('page_id', pageId);

  if (tiles && tiles.length > 0) {
    const tileIds = tiles.map(t => t.id);
    await supabase.from('links').delete().in('tile_id', tileIds);
  }

  const { error } = await supabase
    .from('tiles')
    .delete()
    .eq('page_id', pageId);

  if (error) throw error;
}
