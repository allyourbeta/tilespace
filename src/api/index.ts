export { supabase, getCurrentUserId } from './client';

export {
  fetchTiles,
  createTile,
  updateTile,
  deleteTile,
  swapTilePositions,
  moveTileToPosition,
  recolorAllTiles,
} from './tiles';

export {
  createLink,
  updateLink,
  deleteLink,
  moveLink,
  getLinkCount,
} from './links';

export {
  fetchPreferences,
  updatePalette,
} from './preferences';
