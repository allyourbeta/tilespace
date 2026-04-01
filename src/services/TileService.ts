import type { Tile } from '@/types';
import { getGridCapacity, findFirstEmptyPosition, type GridCapacity } from '@/utils';
import { EMOJI_CATEGORIES, DEFAULT_EMOJIS } from '@/types/emoji';

export { EMOJI_CATEGORIES, DEFAULT_EMOJIS };

export const CATEGORY_LABELS: Record<string, string> = {
  nature: 'Nature',
  animals: 'Animals',
  objects: 'Objects',
  food: 'Food',
  symbols: 'Symbols',
};

export function getNextTilePosition(tiles: Tile[]): number {
  const capacity = getGridCapacity(tiles.length) as GridCapacity;
  const occupiedPositions = new Set(tiles.map((t) => t.position));
  return findFirstEmptyPosition(occupiedPositions, capacity);
}

export function getDefaultEmoji(position: number): string {
  return DEFAULT_EMOJIS[position % DEFAULT_EMOJIS.length];
}

export function buildTilePositionMap(tiles: Tile[]): Map<number, Tile> {
  return new Map(tiles.map((t) => [t.position, t]));
}

export function tileHasLinks(tile: Tile): boolean {
  return (tile.links?.length ?? 0) > 0;
}

export function getTileLinkCount(tile: Tile): number {
  return tile.links?.length ?? 0;
}

export const INBOX_TILE = {
  TITLE: 'Inbox',
  EMOJI: '📥',
  COLOR: '#64748B',
} as const;

export function findInboxTile(tiles: Tile[]): Tile | undefined {
  return tiles.find((t) => t.title === INBOX_TILE.TITLE);
}
