import { LAYOUT } from '@/lib/constants';

/**
 * Grid capacity thresholds
 * - 1-16 tiles: 4x4 grid (16 slots)
 * - 17-20 tiles: 5x4 grid (20 slots)
 * - 21-30 tiles: 6x5 grid (30 slots)
 */
export const GRID_CAPACITIES = [16, 20, 30] as const;
export type GridCapacity = (typeof GRID_CAPACITIES)[number];

export const MAX_TILES = 30;

/**
 * Determines the grid capacity based on the current tile count
 */
export function getGridCapacity(tileCount: number): GridCapacity {
  if (tileCount <= 16) return 16;
  if (tileCount <= 20) return 20;
  return 30;
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
    case 30:
      return { cols: 6, rows: 5 };
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

// Matches TileCard's own `[@media(max-height:600px)]:hidden` rule, below
// which the chip and item count are hidden.
const COMPACT_BREAKPOINT_PX = 600;
// Tile padding: vertical padding 15px x 2.
const TITLE_ROW_PADDING_PX = 30;
// Chip 34px + its margin 10px + the count line's reserved 17px.
const CHIP_AND_COUNT_PX = 34 + 10 + 17;
const TITLE_LINE_HEIGHT_PX = 20;

function tileRowHeight(rows: number, viewportHeight: number): number {
  const boardHeight = viewportHeight - LAYOUT.HEADER_HEIGHT_PX - LAYOUT.FOOTER_HEIGHT_PX - 6;
  return (boardHeight - (rows - 1) * LAYOUT.GRID_GAP_PX) / rows;
}

/**
 * How many lines a tile title may occupy before it would overflow its row.
 *
 * The grid gives every row an equal share of the leftover viewport height, so
 * the answer depends on both the viewport and the current capacity tier
 * (4 rows at 16 tiles, 4 at 20, 5 at 30). Two is the floor, three the ceiling:
 * beyond three a title stops being a label and starts being a paragraph.
 *
 * Above COMPACT_BREAKPOINT_PX the chip and count reappear (they're hidden
 * below it, same breakpoint as TileCard's own media query) and eat space a
 * taller viewport just gained, which — computed naively — would make a
 * slightly taller window return *fewer* lines than a shorter one. Available
 * space is floored at what the compact branch already gives at the
 * breakpoint itself so the result stays monotonic in viewport height.
 */
export function maxTitleLines(rows: number, viewportHeight: number): 2 | 3 {
  const available = viewportHeight <= COMPACT_BREAKPOINT_PX
    ? tileRowHeight(rows, viewportHeight) - TITLE_ROW_PADDING_PX
    : Math.max(
        tileRowHeight(rows, viewportHeight) - TITLE_ROW_PADDING_PX - CHIP_AND_COUNT_PX,
        tileRowHeight(rows, COMPACT_BREAKPOINT_PX) - TITLE_ROW_PADDING_PX,
      );

  const lines = Math.floor(available / TITLE_LINE_HEIGHT_PX);
  return Math.min(3, Math.max(2, lines)) as 2 | 3;
}
