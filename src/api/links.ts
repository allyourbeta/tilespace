import { supabase } from './client';
import type { Link, LinkInsert, LinkUpdate } from '@/types';

/**
 * Create a new link
 */
export async function createLink(linkData: LinkInsert): Promise<Link> {
  const { data, error } = await supabase
    .from('links')
    .insert(linkData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update an existing link
 */
export async function updateLink(id: string, updates: LinkUpdate): Promise<void> {
  const { error } = await supabase
    .from('links')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete a link
 */
export async function deleteLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('links')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Move a link to a different tile
 */
export async function moveLink(
  linkId: string,
  targetTileId: string,
  newPosition: number
): Promise<Link> {
  const { data, error } = await supabase
    .from('links')
    .update({
      tile_id: targetTileId,
      position: newPosition,
    })
    .eq('id', linkId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get the count of links in a tile (for calculating new link position)
 */
export async function getLinkCount(tileId: string): Promise<number> {
  const { count, error } = await supabase
    .from('links')
    .select('id', { count: 'exact', head: true })
    .eq('tile_id', tileId);

  if (error) throw error;
  return count ?? 0;
}
