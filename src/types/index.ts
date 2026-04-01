export type { Tile, TileInsert, TileUpdate, TileRow } from './tile';
export type { Link, LinkInsert, LinkUpdate, LinkRow, LinkType } from './link';
export type { Palette } from './palette';
export type { Page } from './page';
export type { User, UserPreferences, UserPreferencesInsert } from './user';

export { PALETTES, DEFAULT_PALETTE_ID, getPalette, getColorFromPalette } from './palette';
export { EMOJI_CATEGORIES, DEFAULT_EMOJIS } from './emoji';
export {
  GRID_CAPACITIES,
  MAX_TILES,
  getGridCapacity,
  getGridConfig,
  findFirstEmptyPosition,
  canAddTile,
  type GridCapacity,
} from '../utils/grid';
