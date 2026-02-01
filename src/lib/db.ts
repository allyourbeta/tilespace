import { supabase } from './supabase';
import { Tile, Link, DEFAULT_EMOJIS, getColorFromPalette, getPalette, getGridCapacity } from '../types';
import { Page } from '../types/page';
import { GRID_CONFIG } from './constants';
import { isValidUrl, normalizeUrl } from '../utils/url';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}


// ============ PAGE FUNCTIONS ============

export async function fetchPages(): Promise<Page[]> {
  const { data, error } = await supabase
    .from('pages')
    .select('*')
    .order('position');

  if (error) throw error;
  return data || [];
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
  // Get both pages
  const { data: pages, error: fetchError } = await supabase
    .from('pages')
    .select('id, position')
    .in('id', [pageAId, pageBId]);

  if (fetchError) throw fetchError;
  if (!pages || pages.length !== 2) throw new Error('Pages not found');

  const pageA = pages.find(p => p.id === pageAId);
  const pageB = pages.find(p => p.id === pageBId);

  if (!pageA || !pageB) throw new Error('Pages not found');

  // Swap positions using a temporary position to avoid unique constraint
  const tempPosition = GRID_CONFIG.TEMP_POSITION;
  
  await supabase.from('pages').update({ position: tempPosition }).eq('id', pageAId);
  await supabase.from('pages').update({ position: pageA.position }).eq('id', pageBId);
  await supabase.from('pages').update({ position: pageB.position }).eq('id', pageAId);
}

export async function resetPage(pageId: string): Promise<void> {
  // Delete all links for tiles on this page first
  const { data: tiles } = await supabase
    .from('tiles')
    .select('id')
    .eq('page_id', pageId);

  if (tiles && tiles.length > 0) {
    const tileIds = tiles.map(t => t.id);
    await supabase.from('links').delete().in('tile_id', tileIds);
  }

  // Delete all tiles on this page
  const { error } = await supabase
    .from('tiles')
    .delete()
    .eq('page_id', pageId);

  if (error) throw error;
}

// ============ TILE FUNCTIONS (updated for pages) ============

export async function fetchTiles(pageId: string): Promise<Tile[]> {
  const { data: tiles, error } = await supabase
    .from('tiles')
    .select('*')
    .eq('page_id', pageId)
    .order('position');

  if (error) throw error;
  if (!tiles || tiles.length === 0) return [];

  // Get all links for these tiles
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
  
  // Get current tiles for this page to find first empty slot
  const { data: tiles, error: fetchError } = await supabase
    .from('tiles')
    .select('position')
    .eq('page_id', pageId)
    .order('position');
  
  if (fetchError) throw fetchError;
  
  // Find capacity based on tile count
  const count = tiles?.length || 0;
  if (count >= GRID_CONFIG.MAX_TILES) throw new Error(`Maximum tile limit (${GRID_CONFIG.MAX_TILES}) reached`);
  
  const capacity = count < GRID_CONFIG.BREAKPOINTS[0] ? GRID_CONFIG.BREAKPOINTS[0] : count < GRID_CONFIG.BREAKPOINTS[1] ? GRID_CONFIG.BREAKPOINTS[1] : GRID_CONFIG.BREAKPOINTS[2];
  
  // Find first empty position
  const occupied = new Set(tiles?.map(t => t.position) || []);
  let position = 0;
  while (position < capacity && occupied.has(position)) {
    position++;
  }
  
  // Create tile at that position
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

  // Return updated tiles for this page
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

export async function moveTileToPosition(tileId: string, targetPosition: number): Promise<void> {
  const { error } = await supabase
    .rpc('move_tile_to_position_safe', {
      p_tile_id: tileId,
      p_target_position: targetPosition
    });

  if (error) throw error;
}

export async function swapTilePositions(tileAId: string, tileBId: string): Promise<void> {
  const { error } = await supabase
    .rpc('swap_tile_positions_safe', {
      p_tile_a_id: tileAId,
      p_tile_b_id: tileBId
    });

  if (error) throw error;
}

// ============ LINK FUNCTIONS (unchanged) ============

export async function createLink(tileId: string, position: number, title: string, url: string, summary: string): Promise<Link> {
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

export async function createDocument(tileId: string, position: number, title: string, content: string, summary: string): Promise<Link> {
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
