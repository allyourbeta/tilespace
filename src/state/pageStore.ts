import { create } from 'zustand';
import type { Page } from '@/types';
import * as api from '@/api';
import * as PageService from '@/services/PageService';
import { PAGE_PERSISTENCE } from '@/lib/constants';
import { useTileStore } from './tileStore';

/** Remember the last-viewed page across refreshes (per browser). */
function persistLastPage(id: string | null) {
  try {
    if (id) localStorage.setItem(PAGE_PERSISTENCE.LAST_PAGE_KEY, id);
    else localStorage.removeItem(PAGE_PERSISTENCE.LAST_PAGE_KEY);
  } catch {
    // localStorage unavailable (private mode etc.) — persistence is best-effort
  }
}

interface PageState {
  pages: Page[];
  currentPageId: string | null;
  loading: boolean;
  error: string | null;
  tileCounts: Record<string, number>;

  loadPages: () => Promise<void>;
  createPage: (paletteId: string) => Promise<void>;
  updatePageTitle: (pageId: string, title: string) => Promise<void>;
  insertPage: (pageId: string, targetPosition: number) => Promise<void>;
  resetPage: (pageId: string) => Promise<void>;
  updatePagePalette: (pageId: string, paletteId: string) => void;
  bumpTileCount: (pageId: string, delta: number) => void;
  setCurrentPageId: (id: string | null) => void;
  setPages: (pages: Page[]) => void;
}

export const usePageStore = create<PageState>((set, get) => ({
  pages: [],
  currentPageId: null,
  loading: true,
  error: null,
  tileCounts: {},

  loadPages: async () => {
    try {
      set({ error: null });
      const [pagesData, tileCounts] = await Promise.all([api.fetchPages(), api.fetchTileCounts()]);
      const { currentPageId } = get();
      const updates: Partial<PageState> = { pages: pagesData, tileCounts };

      if (pagesData.length > 0 && !currentPageId) {
        // Restore last-viewed page if it still exists; else first by position
        const savedId = localStorage.getItem(PAGE_PERSISTENCE.LAST_PAGE_KEY);
        const saved = savedId ? pagesData.find(p => p.id === savedId) : undefined;
        if (saved) {
          updates.currentPageId = saved.id;
        } else {
          const sorted = [...pagesData].sort((a, b) => a.position - b.position);
          updates.currentPageId = sorted[0].id;
        }
        persistLastPage(updates.currentPageId ?? null);
      }

      set(updates);
    } catch (err) {
      set({ error: 'Failed to load pages' });
      console.error(err);
    }
  },

  createPage: async (paletteId: string) => {
    try {
      const { pages } = get();
      const nextPosition = pages.length > 0
        ? Math.max(...pages.map(p => p.position)) + 1
        : 0;
      const title = `Page ${nextPosition + 1}`;
      const newPage = await api.createPage(title, nextPosition, paletteId);
      persistLastPage(newPage.id);
      set(state => ({
        pages: [...state.pages, newPage],
        currentPageId: newPage.id,
      }));
    } catch (err) {
      console.error('Failed to create page:', err);
    }
  },

  updatePageTitle: async (pageId: string, title: string) => {
    try {
      await api.updatePage(pageId, { title });
      set(state => ({
        pages: state.pages.map(p => p.id === pageId ? { ...p, title } : p),
      }));
    } catch (err) {
      console.error('Failed to update page title:', err);
    }
  },

  insertPage: async (pageId: string, targetPosition: number) => {
    const { pages } = get();
    const positionUpdates = PageService.computeInsertPositions(pages, pageId, targetPosition);
    if (positionUpdates.size === 0) return;

    // Optimistic update: apply the shifted positions immediately
    set(state => ({
      pages: state.pages.map(p => {
        const newPos = positionUpdates.get(p.id);
        return newPos !== undefined ? { ...p, position: newPos } : p;
      }).sort((a, b) => a.position - b.position),
    }));

    try {
      const freshPages = await api.insertPageAtPosition(pageId, targetPosition);
      set({ pages: freshPages });
    } catch (err) {
      console.error('Failed to insert page:', err);
      await get().loadPages(); // rollback to server truth
    }
  },

  resetPage: async (pageId: string) => {
    try {
      await api.resetPage(pageId);
      set(state => ({ tileCounts: { ...state.tileCounts, [pageId]: 0 } }));
      const { currentPageId } = get();
      if (currentPageId === pageId) {
        await useTileStore.getState().loadTiles();
      }
    } catch (err) {
      console.error('Failed to reset page:', err);
    }
  },

  updatePagePalette: (pageId: string, paletteId: string) => {
    set(state => ({
      pages: state.pages.map(p =>
        p.id === pageId ? { ...p, palette_id: paletteId } : p
      ),
    }));
  },

  bumpTileCount: (pageId: string, delta: number) => {
    set(state => ({
      tileCounts: {
        ...state.tileCounts,
        [pageId]: Math.max(0, (state.tileCounts[pageId] ?? 0) + delta),
      },
    }));
  },

  setCurrentPageId: (id) => {
    persistLastPage(id);
    set({ currentPageId: id });
  },
  setPages: (pages) => set({ pages }),
}));
