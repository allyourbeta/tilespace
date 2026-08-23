import { create } from 'zustand';
import type { Tile, Link } from '@/types';
import { getColorFromPalette } from '@/types';
import * as api from '@/api';
import * as TileService from '@/services/TileService';
import { TIMING } from '@/lib/constants';
import { usePageStore } from './pageStore';
import { useUIStore } from './uiStore';
import { createLinkActions } from './tileLinkActions';

export interface TileState {
  tiles: Tile[];
  loading: boolean;

  loadTiles: () => Promise<void>;
  createTile: (targetPosition?: number) => Promise<void>;
  updateTile: (id: string, updates: Partial<Tile>) => Promise<void>;
  updateTileColor: (id: string, colorIndex: number) => Promise<void>;
  deleteTile: (id: string) => Promise<void>;
  swapTilePositions: (draggedId: string, targetId: string) => Promise<void>;
  moveTileToPosition: (tileId: string, position: number) => Promise<void>;
  insertTileAtPosition: (tileId: string, targetPosition: number) => Promise<void>;
  createLink: (tileId: string, data: { title: string; url: string; summary: string }) => Promise<Link>;
  createDocument: (tileId: string, position: number, title: string, content: string, summary: string) => Promise<Link>;
  updateLink: (id: string, updates: Partial<Link>) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  moveLink: (linkId: string, targetTileId: string) => Promise<void>;
  changePalette: (paletteId: string) => Promise<void>;
  setTiles: (tiles: Tile[]) => void;
}

let paletteDebounceTimer: number | null = null;

function getPageContext() {
  const { currentPageId, pages } = usePageStore.getState();
  const currentPage = currentPageId ? pages.find(p => p.id === currentPageId) : null;
  return { currentPageId, paletteId: currentPage?.palette_id ?? 'ocean' };
}

export const useTileStore = create<TileState>((set, get) => ({
  tiles: [],
  loading: true,

  loadTiles: async () => {
    const { currentPageId } = getPageContext();
    if (!currentPageId) return;
    try {
      const tilesData = await api.fetchTiles(currentPageId);
      set({ tiles: tilesData, loading: false });
    } catch (err) {
      console.error('Failed to load tiles:', err);
      set({ loading: false });
    }
  },

  createTile: async (targetPosition?: number) => {
    const { currentPageId, paletteId } = getPageContext();
    if (!currentPageId) return;
    try {
      const newTile = await api.createTile(currentPageId, paletteId, targetPosition);
      set(state => ({ tiles: [...state.tiles, newTile] }));
      usePageStore.getState().bumpTileCount(currentPageId, 1);
      useUIStore.getState().selectTile(newTile.id, true);
    } catch (err) {
      console.error('Failed to create tile:', err);
    }
  },

  updateTile: async (id, updates) => {
    try {
      await api.updateTile(id, updates);
      set(state => ({
        tiles: state.tiles.map(t => t.id === id ? { ...t, ...updates } : t),
      }));
    } catch (err) {
      console.error('Failed to update tile:', err);
    }
  },

  updateTileColor: async (id, colorIndex) => {
    const { paletteId } = getPageContext();
    try {
      await api.updateTileColor(id, colorIndex, paletteId);
      const newColor = getColorFromPalette(paletteId, colorIndex);
      set(state => ({
        tiles: state.tiles.map(t =>
          t.id === id ? { ...t, color_index: colorIndex, accent_color: newColor } : t
        ),
      }));
    } catch (err) {
      console.error('Failed to update tile color:', err);
    }
  },

  deleteTile: async (id) => {
    const { currentPageId } = getPageContext();
    if (!currentPageId) return;
    try {
      const updatedTiles = await api.deleteTile(id, currentPageId);
      set({ tiles: updatedTiles });
      usePageStore.getState().bumpTileCount(currentPageId, -1);
      useUIStore.getState().setSelectedTileId(null);
    } catch (err) {
      console.error('Failed to delete tile:', err);
    }
  },

  swapTilePositions: async (draggedId, targetId) => {
    const { tiles } = get();
    const draggedTile = tiles.find(t => t.id === draggedId);
    const targetTile = tiles.find(t => t.id === targetId);
    if (!draggedTile || !targetTile) return;

    set(state => ({
      tiles: state.tiles.map(t => {
        if (t.id === draggedId) return { ...t, position: targetTile.position };
        if (t.id === targetId) return { ...t, position: draggedTile.position };
        return t;
      }).sort((a, b) => a.position - b.position),
    }));

    try {
      await api.swapTilePositions(draggedId, targetId);
    } catch (err) {
      console.error('Failed to swap tiles:', err);
      await get().loadTiles();
    }
  },

  moveTileToPosition: async (tileId, position) => {
    set(state => ({
      tiles: state.tiles.map(t =>
        t.id === tileId ? { ...t, position } : t
      ).sort((a, b) => a.position - b.position),
    }));

    try {
      await api.moveTileToPosition(tileId, position);
    } catch (err) {
      console.error('Failed to move tile:', err);
      await get().loadTiles();
    }
  },

  insertTileAtPosition: async (tileId, targetPosition) => {
    const { currentPageId } = getPageContext();
    if (!currentPageId) return;

    const { tiles } = get();
    const positionUpdates = TileService.computeInsertPositions(tiles, tileId, targetPosition);
    if (positionUpdates.size === 0) return;

    // Optimistic update
    set(state => ({
      tiles: state.tiles.map(t => {
        const newPos = positionUpdates.get(t.id);
        return newPos !== undefined ? { ...t, position: newPos } : t;
      }).sort((a, b) => a.position - b.position),
    }));

    try {
      const freshTiles = await api.insertTileAtPosition(tileId, targetPosition, currentPageId);
      set({ tiles: freshTiles });
    } catch (err) {
      console.error('Failed to insert tile:', err);
      await get().loadTiles();
    }
  },

  ...createLinkActions(set, get),

  changePalette: async (paletteId) => {
    const { currentPageId } = getPageContext();
    if (!currentPageId) return;

    usePageStore.getState().updatePagePalette(currentPageId, paletteId);

    if (paletteDebounceTimer) clearTimeout(paletteDebounceTimer);

    paletteDebounceTimer = window.setTimeout(async () => {
      try {
        await api.updatePagePalette(currentPageId, paletteId);
        const recoloredTiles = await api.recolorAllTiles(currentPageId, paletteId);
        set({ tiles: recoloredTiles });
      } catch (err) {
        console.error('Failed to change palette:', err);
      }
    }, TIMING.DEBOUNCE_DELAY_MS);
  },

  setTiles: (tiles) => set({ tiles }),
}));
