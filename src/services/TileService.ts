import type { Tile } from '@/types';
import { getGridCapacity, findFirstEmptyPosition, type GridCapacity } from '@/utils';

// Emoji categories for tile defaults
export const EMOJI_CATEGORIES = {
  nature: ['🌿', '🌸', '🍂', '🌊', '🌙', '☀️', '🌈', '🍀', '🌻', '🌺', '🍃', '🌴', '🌵', '🌾', '🪻', '🌷'],
  animals: ['🦊', '🐙', '🦋', '🐝', '🦉', '🐳', '🦩', '🐢', '🐧', '🦄', '🐸', '🦁', '🐼', '🐨', '🦜', '🦚'],
  objects: ['📚', '💼', '🎯', '🗂️', '📌', '🏷️', '📋', '📁', '🔖', '🗃️', '📎', '✏️', '🖊️', '📝', '🗒️', '📐'],
  food: ['🍋', '🍒', '🥑', '🍄', '🧁', '🍵', '🍯', '🥐', '🍕', '🍔', '🍎', '🍇', '🥗', '🍰', '☕', '🧀'],
  symbols: ['✨', '💫', '🌟', '💎', '🔥', '❄️', '💡', '⭐', '❤️', '💜', '💙', '💚', '🎵', '🎨', '🏠', '🚀'],
};

export const DEFAULT_EMOJIS = Object.values(EMOJI_CATEGORIES).flat();

export const CATEGORY_LABELS: Record<string, string> = {
  nature: 'Nature',
  animals: 'Animals',
  objects: 'Objects',
  food: 'Food',
  symbols: 'Symbols',
};

/**
 * Find the first available position for a new tile
 */
export function getNextTilePosition(tiles: Tile[]): number {
  const capacity = getGridCapacity(tiles.length) as GridCapacity;
  const occupiedPositions = new Set(tiles.map((t) => t.position));
  return findFirstEmptyPosition(occupiedPositions, capacity);
}

/**
 * Get a default emoji based on position (for variety)
 */
export function getDefaultEmoji(position: number): string {
  return DEFAULT_EMOJIS[position % DEFAULT_EMOJIS.length];
}

/**
 * Build a map of tiles by position for efficient lookup
 */
export function buildTilePositionMap(tiles: Tile[]): Map<number, Tile> {
  return new Map(tiles.map((t) => [t.position, t]));
}

/**
 * Check if a tile has any links
 */
export function tileHasLinks(tile: Tile): boolean {
  return (tile.links?.length ?? 0) > 0;
}

/**
 * Get the link count for a tile
 */
export function getTileLinkCount(tile: Tile): number {
  return tile.links?.length ?? 0;
}

// Inbox tile configuration
export const INBOX_TILE = {
  TITLE: 'Inbox',
  EMOJI: '📥',
  COLOR: '#64748B',
} as const;

/**
 * Find the Inbox tile if it exists
 */
export function findInboxTile(tiles: Tile[]): Tile | undefined {
  return tiles.find((t) => t.title === INBOX_TILE.TITLE);
}
