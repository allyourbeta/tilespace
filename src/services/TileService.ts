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

/**
 * Compute new positions after inserting a tile at a target position.
 * Tiles between old and new positions shift to make room.
 * Returns a map of tileId → newPosition for all affected tiles.
 */
export function computeInsertPositions(
  tiles: Tile[],
  tileId: string,
  targetPosition: number
): Map<string, number> {
  const result = new Map<string, number>();
  const draggedTile = tiles.find(t => t.id === tileId);
  if (!draggedTile) return result;

  const oldPosition = draggedTile.position;
  if (oldPosition === targetPosition) return result;

  for (const t of tiles) {
    if (t.id === tileId) {
      result.set(t.id, targetPosition);
    } else if (oldPosition < targetPosition) {
      // Moving forward: shift tiles in (old, target] back by 1
      if (t.position > oldPosition && t.position <= targetPosition) {
        result.set(t.id, t.position - 1);
      }
    } else {
      // Moving backward: shift tiles in [target, old) forward by 1
      if (t.position >= targetPosition && t.position < oldPosition) {
        result.set(t.id, t.position + 1);
      }
    }
  }
  return result;
}
