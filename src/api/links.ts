import { supabase, getCurrentUserId } from './client';
import type { Link } from '@/types';
import { normalizeUrl } from '@/utils/url';

export async function createLink(
  tileId: string,
  position: number,
  title: string,
  url: string,
  summary: string
): Promise<Link> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('links')
    .insert({
      user_id: userId,
      tile_id: tileId,
      title,
      url: normalizeUrl(url),
      summary,
      position,
      type: 'link',
      content: ''
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createDocument(
  tileId: string,
  position: number,
  title: string,
  content: string,
  summary: string
): Promise<Link> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from('links')
    .insert({
      user_id: userId,
      tile_id: tileId,
      title,
      url: null,
      summary,
      content,
      position,
      type: 'document'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateLink(id: string, updates: Partial<Link>): Promise<void> {
  const normalizedUpdates = { ...updates };
  if (normalizedUpdates.url !== undefined && normalizedUpdates.url !== null) {
    normalizedUpdates.url = normalizeUrl(normalizedUpdates.url);
  }

  const { error } = await supabase
    .from('links')
    .update(normalizedUpdates)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function moveLink(linkId: string, targetTileId: string): Promise<Link> {
  const { data: targetLinks, error: countError } = await supabase
    .from('links')
    .select('id')
    .eq('tile_id', targetTileId);

  if (countError) throw countError;

  const newPosition = targetLinks?.length || 0;

  const { data, error } = await supabase
    .from('links')
    .update({
      tile_id: targetTileId,
      position: newPosition
    })
    .eq('id', linkId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
