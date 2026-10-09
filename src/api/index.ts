export { supabase, getCurrentUserId } from './client';

export {
  fetchPages,
  createPage,
  updatePage,
  updatePagePalette,
  insertPageAtPosition,
  resetPage,
  fetchTileCounts,
} from './pages';

export {
  fetchTiles,
  createTile,
  updateTile,
  updateTileColor,
  deleteTile,
  swapTilePositions,
  moveTileToPosition,
  insertTileAtPosition,
  recolorAllTiles,
} from './tiles';

export {
  fetchLink,
  createLink,
  createDocument,
  updateLink,
  deleteLink,
  moveLink,
} from './links';

export {
  fetchPreferences,
  updatePalette,
} from './preferences';

export {
  refreshMasterView,
  askMasterView,
  fetchThemes,
  fetchMasterViewDocs,
  setDocHidden,
} from './masterView';
