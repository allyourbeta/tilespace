import { supabase } from './supabase';
import { Tile, Link, DEFAULT_EMOJIS, getColorFromPalette, getPalette, getGridCapacity } from '../types';

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not authenticated');
  return user.id;
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  let normalized = trimmed;
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    normalized = `https://${trimmed}`;
  }

  if (!isValidUrl(normalized)) {
    throw new Error('Invalid URL format');
  }

  return normalized;
}

export async function fetchCurrentPalette(): Promise<string> {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('current_palette')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.current_palette || 'ocean';
}

export async function updateCurrentPalette(paletteId: string): Promise<void> {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ 
      user_id: userId, 
      current_palette: paletteId, 
      updated_at: new Date().toISOString() 
    });

  if (error) throw error;
}

export async function recolorAllTiles(paletteId: string): Promise<Tile[]> {
  const { data: tiles, error: fetchError } = await supabase
    .from('tiles')
    .select('*')
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

  return fetchTiles();
}

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

  return tiles.map(tile => ({
    ...tile,
    links: (links || []).filter(link => link.tile_id === tile.id)
  }));
}

export async function createTile(paletteId: string): Promise<Tile> {
  const userId = await getCurrentUserId();
  
  // Get current tiles to find first empty slot
  const { data: tiles, error: fetchError } = await supabase
    .from('tiles')
    .select('position')
    .order('position');
  
  if (fetchError) throw fetchError;
  
  // Find capacity based on tile count
  const count = tiles?.length || 0;
  if (count >= 25) throw new Error('Maximum tile limit (25) reached');
  
  const capacity = count < 16 ? 16 : count < 20 ? 20 : 25;
  
  // Find first empty position
  const occupied = new Set(tiles?.map(t => t.position) || []);
  let position = 0;
  while (position < capacity && occupied.has(position)) {
    position++;
  }
  
  // Create tile at that position
  const colorIndex = position % 12;
  const color = getColorFromPalette(paletteId, colorIndex);
  const emojiIndex = position % DEFAULT_EMOJIS.length;
  
  const { data, error } = await supabase
    .from('tiles')
    .insert({
      user_id: userId,
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

export async function deleteTile(id: string): Promise<Tile[]> {
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

  // Don't compact - leave the gap, user's layout is intentional
  return fetchTiles();
}

export async function compactTilePositions(): Promise<Tile[]> {
  const { error } = await supabase.rpc('compact_tile_positions');

  if (error) throw error;

  return fetchTiles();
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
