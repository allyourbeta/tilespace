import { supabase, getCurrentUserId } from './client';
import type { Tile } from '@/types';
import { getColorFromPalette, getPalette } from '@/types';
import { GRID_CONFIG } from '@/lib/constants';

const DEFAULT_EMOJIS = [
  '🌿', '🌸', '🍂', '🌊', '🌙', '☀️', '🌈', '🍀', '🌻', '🌺', '🍃', '🌴', '🌵', '🌾', '🪻', '🌷',
  '🦊', '🐙', '🦋', '🐝', '🦉', '🐳', '🦩', '🐢', '🐧', '🦄', '🐸', '🦁', '🐼', '🐨', '🦜', '🦚',
  '📚', '💼', '🎯', '🗂️', '📌', '🏷️', '📋', '📁', '🔖', '🗃️', '📎', '✏️', '🖊️', '📝', '🗒️', '📐',
  '🍋', '🍒', '🥑', '🍄', '🧁', '🍵', '🍯', '🥐', '🍕', '🍔', '🍎', '🍇', '🥗', '🍰', '☕', '🧀',
  '✨', '💫', '🌟', '💎', '🔥', '❄️', '💡', '⭐', '❤️', '💜', '💙', '💚', '🎵', '🎨', '🏠', '🚀',
];

export async function fetchTiles(pageId: string): Promise<Tile[]> {
  const { data: tiles, error } = await supabase
    .from('tiles')
    .select('*')
    .eq('page_id', pageId)
    .order('position');

  if (error) throw error;
  if (!tiles || tiles.length === 0) return [];

  const tileIds = tiles.map(t => t.id);
  const { data: links, error: linksError } = await supabase
    .from('links')
    .select('*')
    .in('tile_id', tileIds)
    .order('position');

  if (linksError) throw linksError;

  return tiles.map(tile => ({
    ...tile,
    links: (links || []).filter(link => link.tile_id === tile.id)
  }));
}

export async function createTile(pageId: string, paletteId: string): Promise<Tile> {
  const userId = await getCurrentUserId();

  const { data: tiles, error: fetchError } = await supabase
    .from('tiles')
    .select('position')
    .eq('page_id', pageId)
    .order('position');

  if (fetchError) throw fetchError;

  const count = tiles?.length || 0;
  if (count >= GRID_CONFIG.MAX_TILES) throw new Error(`Maximum tile limit (${GRID_CONFIG.MAX_TILES}) reached`);

  const capacity = count < GRID_CONFIG.BREAKPOINTS[0] ? GRID_CONFIG.BREAKPOINTS[0] : count < GRID_CONFIG.BREAKPOINTS[1] ? GRID_CONFIG.BREAKPOINTS[1] : GRID_CONFIG.BREAKPOINTS[2];

  const occupied = new Set(tiles?.map(t => t.position) || []);
  let position = 0;
  while (position < capacity && occupied.has(position)) {
    position++;
  }

  const colorIndex = position % GRID_CONFIG.COLORS_PER_PALETTE;
  const color = getColorFromPalette(paletteId, colorIndex);
  const emojiIndex = position % DEFAULT_EMOJIS.length;

  const { data, error } = await supabase
    .from('tiles')
    .insert({
      user_id: userId,
      page_id: pageId,
      title: 'New Tile',
      emoji: DEFAULT_EMOJIS[emojiIndex],
      accent_color: color,
      color_index: colorIndex,
      position
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, links: [] };
}

export async function updateTile(id: string, updates: Partial<Tile>): Promise<void> {
  const { error } = await supabase
    .from('tiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

export async function updateTileColor(id: string, colorIndex: number, paletteId: string): Promise<void> {
  const color = getColorFromPalette(paletteId, colorIndex);
  const { error } = await supabase
    .from('tiles')
    .update({
      color_index: colorIndex,
      accent_color: color,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteTile(id: string, pageId: string): Promise<Tile[]> {
  const { error: linksError } = await supabase
    .from('links')
    .delete()
    .eq('tile_id', id);

  if (linksError) throw linksError;

  const { error } = await supabase
    .from('tiles')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return fetchTiles(pageId);
}

export async function recolorAllTiles(pageId: string, paletteId: string): Promise<Tile[]> {
  const { data: tiles, error: fetchError } = await supabase
    .from('tiles')
    .select('*')
    .eq('page_id', pageId)
    .order('position');

  if (fetchError) throw fetchError;
  if (!tiles || tiles.length === 0) return [];

  const palette = getPalette(paletteId);

  for (const tile of tiles) {
    const newColor = palette.colors[tile.color_index % palette.colors.length];
    const { error } = await supabase
      .from('tiles')
      .update({ accent_color: newColor })
      .eq('id', tile.id);
    if (error) throw error;
  }

  return fetchTiles(pageId);
}

export async function swapTilePositions(tileAId: string, tileBId: string): Promise<void> {
  const { error } = await supabase
    .rpc('swap_tile_positions_safe', {
      p_tile_a_id: tileAId,
      p_tile_b_id: tileBId
    });

  if (error) throw error;
}

export async function moveTileToPosition(tileId: string, targetPosition: number): Promise<void> {
  const { error } = await supabase
    .rpc('move_tile_to_position_safe', {
      p_tile_id: tileId,
      p_target_position: targetPosition
    });

  if (error) throw error;
}

export async function insertTileAtPosition(tileId: string, targetPosition: number, pageId: string): Promise<Tile[]> {
  const { error } = await supabase
    .rpc('insert_tile_at_position', {
      p_tile_id: tileId,
      p_target_position: targetPosition
    });

  if (error) throw error;

  // Re-fetch to get consistent state after the shift
  return fetchTiles(pageId);
}
