import { supabase, getCurrentUserId } from './client';
import type { Tile, TileInsert, TileUpdate, TileRow } from '@/types';

/**
 * Fetch all tiles for the current user, with their links
 */
export async function fetchTiles(): Promise<Tile[]> {
  const { data: tiles, error } = await supabase
    .from('tiles')
    .select('*')
    .order('position');

  if (error) throw error;
  if (!tiles || tiles.length === 0) return [];

  const { data: links, error: linksError } = await supabase
    .from('links')
    .select('*')
    .order('position');

  if (linksError) throw linksError;

  return tiles.map((tile: TileRow) => ({
    ...tile,
    links: (links || []).filter((link) => link.tile_id === tile.id),
  }));
}

/**
 * Create a new tile
 */
export async function createTile(tileData: TileInsert): Promise<Tile> {
  const { data, error } = await supabase
    .from('tiles')
    .insert(tileData)
    .select()
    .single();

  if (error) throw error;
  return { ...data, links: [] };
}

/**
 * Update an existing tile
 */
export async function updateTile(id: string, updates: TileUpdate): Promise<void> {
  const { error } = await supabase
    .from('tiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete a tile (cascades to links via DB foreign key)
 */
export async function deleteTile(id: string): Promise<void> {
  const { error } = await supabase
    .from('tiles')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Swap positions of two tiles (uses database function for atomicity)
 */
export async function swapTilePositions(
  tileAId: string,
  tileBId: string
): Promise<void> {
  const { error } = await supabase.rpc('swap_tile_positions_safe', {
    p_tile_a_id: tileAId,
    p_tile_b_id: tileBId,
  });

  if (error) throw error;
}

/**
 * Move a tile to an empty position (uses database function)
 */
export async function moveTileToPosition(
  tileId: string,
  targetPosition: number
): Promise<void> {
  const { error } = await supabase.rpc('move_tile_to_position_safe', {
    p_tile_id: tileId,
    p_target_position: targetPosition,
  });

  if (error) throw error;
}

/**
 * Recolor all tiles with a new palette
 */
export async function recolorAllTiles(
  paletteColors: string[]
): Promise<Tile[]> {
  const { data: tiles, error: fetchError } = await supabase
    .from('tiles')
    .select('*')
    .order('position');

  if (fetchError) throw fetchError;
  if (!tiles || tiles.length === 0) return [];

  // Update each tile with its new color based on color_index
  for (const tile of tiles) {
    const newColor = paletteColors[tile.color_index % paletteColors.length];
    const { error } = await supabase
      .from('tiles')
      .update({ accent_color: newColor })
      .eq('id', tile.id);
    if (error) throw error;
  }

  return fetchTiles();
}

export { getCurrentUserId };
