/**
 * Grid capacity thresholds
 * - 1-16 tiles: 4x4 grid (16 slots)
 * - 17-20 tiles: 5x4 grid (20 slots)
 * - 21-25 tiles: 5x5 grid (25 slots)
 */
export const GRID_CAPACITIES = [16, 20, 25] as const;
export type GridCapacity = (typeof GRID_CAPACITIES)[number];

export const MAX_TILES = 25;

/**
 * Determines the grid capacity based on the current tile count
 */
export function getGridCapacity(tileCount: number): GridCapacity {
  if (tileCount <= 16) return 16;
  if (tileCount <= 20) return 20;
  return 25;
}

/**
 * Returns the grid configuration (columns and rows) for a given capacity
 */
export function getGridConfig(capacity: GridCapacity): { cols: number; rows: number } {
  switch (capacity) {
    case 16:
      return { cols: 4, rows: 4 };
    case 20:
      return { cols: 5, rows: 4 };
    case 25:
      return { cols: 5, rows: 5 };
  }
}

/**
 * Finds the first empty position in the grid
 * 
 * @param occupiedPositions - Set of positions that are currently occupied
 * @param capacity - Current grid capacity
 * @returns The first empty position, or -1 if grid is full
 */
export function findFirstEmptyPosition(
  occupiedPositions: Set<number>,
  capacity: GridCapacity
): number {
  for (let pos = 0; pos < capacity; pos++) {
    if (!occupiedPositions.has(pos)) {
      return pos;
    }
  }
  return -1;
}

/**
 * Checks if a new tile can be added
 */
export function canAddTile(currentTileCount: number): boolean {
  return currentTileCount < MAX_TILES;
}
