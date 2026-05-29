import { supabase, getCurrentUserId } from './client';
import type { Page } from '@/types/page';

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

export async function insertPageAtPosition(pageId: string, targetPosition: number): Promise<Page[]> {
  const { error } = await supabase
    .rpc('insert_page_at_position', {
      p_page_id: pageId,
      p_target_position: targetPosition,
    });

  if (error) throw error;

  // Re-fetch to get consistent state after the shift
  return fetchPages();
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
