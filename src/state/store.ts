import { create } from 'zustand';
import type { Tile, Link } from '@/types';
import { DEFAULT_PALETTE_ID, getPalette, getColorFromPalette } from '@/types';
import * as api from '@/api';
import { normalizeUrl } from '@/utils';
import { getGridCapacity, findFirstEmptyPosition, canAddTile } from '@/utils';

// ============================================================================
// State Types
// ============================================================================

interface AppState {
  // Data
  tiles: Tile[];
  currentPaletteId: string;

  // UI State
  selectedTileId: string | null;
  editingDocumentId: string | null;

  // Async State
  loading: boolean;
  error: string | null;

  // Modal State
  modals: {
    pasteLink: boolean;
  };
}

interface AppActions {
  // Data Loading
  loadData: () => Promise<void>;

  // Tile Actions
  createTile: () => Promise<void>;
  updateTile: (id: string, updates: Partial<Tile>) => Promise<void>;
  updateTileColor: (id: string, colorIndex: number) => Promise<void>;
  deleteTile: (id: string) => Promise<void>;
  swapTiles: (tileAId: string, tileBId: string) => Promise<void>;
  moveTile: (tileId: string, targetPosition: number) => Promise<void>;

  // Link Actions
  createLink: (
    tileId: string,
    data: { title: string; url: string; summary: string }
  ) => Promise<Link>;
  createDocument: (
    tileId: string,
    data: { title: string; content: string; summary: string }
  ) => Promise<Link>;
  updateLink: (id: string, updates: Partial<Link>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  moveLink: (linkId: string, targetTileId: string) => Promise<void>;

  // Palette Actions
  changePalette: (paletteId: string) => Promise<void>;

  // UI Actions
  selectTile: (id: string | null) => void;
  editDocument: (id: string | null) => void;
  showModal: (modal: keyof AppState['modals']) => void;
  hideModal: (modal: keyof AppState['modals']) => void;
  clearError: () => void;
}

type AppStore = AppState & AppActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: AppState = {
  tiles: [],
  currentPaletteId: DEFAULT_PALETTE_ID,
  selectedTileId: null,
  editingDocumentId: null,
  loading: true,
  error: null,
  modals: {
    pasteLink: false,
  },
};

// ============================================================================
// Store
// ============================================================================

export const useAppStore = create<AppStore>((set, get) => ({
  ...initialState,

  // --------------------------------------------------------------------------
  // Data Loading
  // --------------------------------------------------------------------------

  loadData: async () => {
    set({ loading: true, error: null });
    try {
      const [tiles, preferences] = await Promise.all([
        api.fetchTiles(),
        api.fetchPreferences(),
      ]);
      set({
        tiles,
        currentPaletteId: preferences.current_palette,
        loading: false,
      });
    } catch (err) {
      set({
        error: 'Failed to load data',
        loading: false,
      });
      console.error('Load error:', err);
    }
  },

  // --------------------------------------------------------------------------
  // Tile Actions
  // --------------------------------------------------------------------------

  createTile: async () => {
    const { tiles, currentPaletteId } = get();

    if (!canAddTile(tiles.length)) {
      set({ error: 'Maximum tile limit (25) reached' });
      return;
    }

    try {
      const userId = await api.getCurrentUserId();
      const capacity = getGridCapacity(tiles.length);
      const occupiedPositions = new Set(tiles.map((t) => t.position));
      const position = findFirstEmptyPosition(occupiedPositions, capacity);

      if (position === -1) {
        set({ error: 'No empty position available' });
        return;
      }

      const colorIndex = position % 12;
      const color = getColorFromPalette(currentPaletteId, colorIndex);

      // Default emojis for variety
      const defaultEmojis = ['🌿', '🦊', '📚', '🍋', '✨', '🌸', '🐙', '💼', '🍒', '💫'];
      const emoji = defaultEmojis[position % defaultEmojis.length];

      const newTile = await api.createTile({
        user_id: userId,
        title: 'New Tile',
        emoji,
        accent_color: color,
        color_index: colorIndex,
        position,
      });

      set((state) => ({
        tiles: [...state.tiles, newTile],
        selectedTileId: newTile.id,
      }));
    } catch (err) {
      set({ error: 'Failed to create tile' });
      console.error('Create tile error:', err);
    }
  },

  updateTile: async (id, updates) => {
    // Optimistic update
    set((state) => ({
      tiles: state.tiles.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));

    try {
      await api.updateTile(id, updates);
    } catch (err) {
      // Rollback on error - reload data
      get().loadData();
      console.error('Update tile error:', err);
    }
  },

  updateTileColor: async (id, colorIndex) => {
    const { currentPaletteId } = get();
    const newColor = getColorFromPalette(currentPaletteId, colorIndex);

    // Optimistic update
    set((state) => ({
      tiles: state.tiles.map((t) =>
        t.id === id
          ? { ...t, color_index: colorIndex, accent_color: newColor }
          : t
      ),
    }));

    try {
      await api.updateTile(id, {
        color_index: colorIndex,
        accent_color: newColor,
      });
    } catch (err) {
      get().loadData();
      console.error('Update tile color error:', err);
    }
  },

  deleteTile: async (id) => {
    // Optimistic update
    set((state) => ({
      tiles: state.tiles.filter((t) => t.id !== id),
      selectedTileId:
        state.selectedTileId === id ? null : state.selectedTileId,
    }));

    try {
      await api.deleteTile(id);
    } catch (err) {
      get().loadData();
      console.error('Delete tile error:', err);
    }
  },

  swapTiles: async (tileAId, tileBId) => {
    const { tiles } = get();
    const tileA = tiles.find((t) => t.id === tileAId);
    const tileB = tiles.find((t) => t.id === tileBId);

    if (!tileA || !tileB) return;

    // Optimistic update
    set((state) => ({
      tiles: state.tiles
        .map((t) => {
          if (t.id === tileAId) return { ...t, position: tileB.position };
          if (t.id === tileBId) return { ...t, position: tileA.position };
          return t;
        })
        .sort((a, b) => a.position - b.position),
    }));

    try {
      await api.swapTilePositions(tileAId, tileBId);
    } catch (err) {
      get().loadData();
      console.error('Swap tiles error:', err);
    }
  },

  moveTile: async (tileId, targetPosition) => {
    // Optimistic update
    set((state) => ({
      tiles: state.tiles
        .map((t) => (t.id === tileId ? { ...t, position: targetPosition } : t))
        .sort((a, b) => a.position - b.position),
    }));

    try {
      await api.moveTileToPosition(tileId, targetPosition);
    } catch (err) {
      get().loadData();
      console.error('Move tile error:', err);
    }
  },

  // --------------------------------------------------------------------------
  // Link Actions
  // --------------------------------------------------------------------------

  createLink: async (tileId, data) => {
    const { tiles } = get();
    const tile = tiles.find((t) => t.id === tileId);

    // Check for duplicate URL
    const normalizedUrl = normalizeUrl(data.url);
    const existingLink = tile?.links?.find(
      (l) => l.url && l.url.toLowerCase() === normalizedUrl.toLowerCase()
    );
    if (existingLink) {
      throw new Error('This URL already exists in this tile');
    }

    const userId = await api.getCurrentUserId();
    const position = tile?.links?.length ?? 0;

    const newLink = await api.createLink({
      user_id: userId,
      tile_id: tileId,
      type: 'link',
      title: data.title || normalizedUrl,
      url: normalizedUrl,
      summary: data.summary,
      content: '',
      position,
    });

    set((state) => ({
      tiles: state.tiles.map((t) =>
        t.id === tileId
          ? { ...t, links: [...(t.links || []), newLink] }
          : t
      ),
    }));

    return newLink;
  },

  createDocument: async (tileId, data) => {
    const { tiles } = get();
    const tile = tiles.find((t) => t.id === tileId);

    const userId = await api.getCurrentUserId();
    const position = tile?.links?.length ?? 0;

    const newDoc = await api.createLink({
      user_id: userId,
      tile_id: tileId,
      type: 'document',
      title: data.title,
      url: null,
      summary: data.summary,
      content: data.content,
      position,
    });

    set((state) => ({
      tiles: state.tiles.map((t) =>
        t.id === tileId
          ? { ...t, links: [...(t.links || []), newDoc] }
          : t
      ),
      editingDocumentId: newDoc.id,
    }));

    return newDoc;
  },

  updateLink: async (id, updates) => {
    // Normalize URL if provided
    const normalizedUpdates = { ...updates };
    if (normalizedUpdates.url !== undefined && normalizedUpdates.url !== null) {
      normalizedUpdates.url = normalizeUrl(normalizedUpdates.url);
    }

    // Optimistic update
    set((state) => ({
      tiles: state.tiles.map((t) => ({
        ...t,
        links: t.links?.map((l) =>
          l.id === id ? { ...l, ...normalizedUpdates } : l
        ),
      })),
    }));

    try {
      await api.updateLink(id, normalizedUpdates);
    } catch (err) {
      get().loadData();
      console.error('Update link error:', err);
    }
  },

  deleteLink: async (id) => {
    const { editingDocumentId } = get();

    // Optimistic update
    set((state) => ({
      tiles: state.tiles.map((t) => ({
        ...t,
        links: t.links?.filter((l) => l.id !== id),
      })),
      editingDocumentId: editingDocumentId === id ? null : editingDocumentId,
    }));

    try {
      await api.deleteLink(id);
    } catch (err) {
      get().loadData();
      console.error('Delete link error:', err);
    }
  },

  moveLink: async (linkId, targetTileId) => {
    const { tiles } = get();

    // Find source tile
    let sourceTileId: string | null = null;
    let movedLink: Link | null = null;
    for (const t of tiles) {
      const link = t.links?.find((l) => l.id === linkId);
      if (link) {
        sourceTileId = t.id;
        movedLink = link;
        break;
      }
    }

    if (!sourceTileId || sourceTileId === targetTileId || !movedLink) return;

    const targetTile = tiles.find((t) => t.id === targetTileId);
    const newPosition = targetTile?.links?.length ?? 0;

    // Optimistic update
    set((state) => ({
      tiles: state.tiles.map((t) => {
        if (t.id === sourceTileId) {
          return { ...t, links: t.links?.filter((l) => l.id !== linkId) };
        }
        if (t.id === targetTileId) {
          const updatedLink = {
            ...movedLink!,
            tile_id: targetTileId,
            position: newPosition,
          };
          return { ...t, links: [...(t.links || []), updatedLink] };
        }
        return t;
      }),
    }));

    try {
      await api.moveLink(linkId, targetTileId, newPosition);
    } catch (err) {
      get().loadData();
      console.error('Move link error:', err);
    }
  },

  // --------------------------------------------------------------------------
  // Palette Actions
  // --------------------------------------------------------------------------

  changePalette: async (paletteId) => {
    const palette = getPalette(paletteId);

    // Optimistic UI update
    set({ currentPaletteId: paletteId });

    try {
      await api.updatePalette(paletteId);
      const recoloredTiles = await api.recolorAllTiles(palette.colors);
      set({ tiles: recoloredTiles });
    } catch (err) {
      get().loadData();
      console.error('Change palette error:', err);
    }
  },

  // --------------------------------------------------------------------------
  // UI Actions
  // --------------------------------------------------------------------------

  selectTile: (id) => set({ selectedTileId: id }),

  editDocument: (id) => set({ editingDocumentId: id }),

  showModal: (modal) =>
    set((state) => ({
      modals: { ...state.modals, [modal]: true },
    })),

  hideModal: (modal) =>
    set((state) => ({
      modals: { ...state.modals, [modal]: false },
    })),

  clearError: () => set({ error: null }),
}));

// ============================================================================
// Selectors (for derived state)
// ============================================================================

export const selectSelectedTile = (state: AppState): Tile | null => {
  if (!state.selectedTileId) return null;
  return state.tiles.find((t) => t.id === state.selectedTileId) ?? null;
};

export const selectEditingDocument = (state: AppState): Link | null => {
  if (!state.editingDocumentId) return null;
  for (const tile of state.tiles) {
    const link = tile.links?.find((l) => l.id === state.editingDocumentId);
    if (link) return link;
  }
  return null;
};

export const selectGridCapacity = (state: AppState): number => {
  return getGridCapacity(state.tiles.length);
};

export const selectCanAddTile = (state: AppState): boolean => {
  return canAddTile(state.tiles.length);
};
