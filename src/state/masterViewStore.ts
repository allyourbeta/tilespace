import { create } from 'zustand';
import * as api from '@/api';
import type { DocTheme, MasterViewDoc, AskResultDoc } from '@/types/masterView';

interface MasterViewState {
  themes: DocTheme[];
  docs: MasterViewDoc[];
  loading: boolean;
  refreshing: boolean;
  hasOpenedOnce: boolean;
  modelError: string | null;
  selectedThemeId: string | null;
  showHidden: boolean;

  askQuery: string;
  askResults: AskResultDoc[] | null;
  askLoading: boolean;
  askError: string | null;

  open: () => Promise<void>;
  loadData: () => Promise<void>;
  selectTheme: (id: string | null) => void;
  toggleShowHidden: () => void;
  hideDoc: (linkId: string) => Promise<void>;
  restoreDoc: (linkId: string) => Promise<void>;
  ask: (query: string) => Promise<void>;
  clearAsk: () => void;
}

export const useMasterViewStore = create<MasterViewState>((set, get) => ({
  themes: [],
  docs: [],
  loading: true,
  refreshing: false,
  hasOpenedOnce: false,
  modelError: null,
  selectedThemeId: null,
  showHidden: false,

  askQuery: '',
  askResults: null,
  askLoading: false,
  askError: null,

  open: async () => {
    set({ refreshing: true, modelError: null });
    try {
      const result = await api.refreshMasterView();
      if (!result.ok && result.error) set({ modelError: result.error });
    } catch (err) {
      set({ modelError: err instanceof Error ? err.message : 'Could not refresh Master View' });
    }
    await get().loadData();
    set({ refreshing: false, hasOpenedOnce: true });
  },

  loadData: async () => {
    try {
      const [themes, docs] = await Promise.all([api.fetchThemes(), api.fetchMasterViewDocs()]);
      set({ themes, docs, loading: false });
    } catch (err) {
      console.error('Failed to load Master View:', err);
      set({ loading: false });
    }
  },

  selectTheme: (id) => set({ selectedThemeId: id, showHidden: false }),
  toggleShowHidden: () => set((state) => ({ showHidden: !state.showHidden })),

  hideDoc: async (linkId) => {
    const previous = get().docs;
    set({ docs: previous.map((d) => (d.linkId === linkId ? { ...d, hidden: true } : d)) });
    try {
      await api.setDocHidden(linkId, true);
    } catch (err) {
      console.error('Failed to hide document:', err);
      set({ docs: previous });
    }
  },

  restoreDoc: async (linkId) => {
    const previous = get().docs;
    set({ docs: previous.map((d) => (d.linkId === linkId ? { ...d, hidden: false } : d)) });
    try {
      await api.setDocHidden(linkId, false);
    } catch (err) {
      console.error('Failed to restore document:', err);
      set({ docs: previous });
    }
  },

  ask: async (query) => {
    set({ askQuery: query, askLoading: true, askError: null });
    try {
      const results = await api.askMasterView(query);
      set({ askResults: results, askLoading: false });
    } catch (err) {
      set({
        askLoading: false,
        askError: err instanceof Error ? err.message : 'Could not search right now',
      });
    }
  },

  clearAsk: () => set({ askQuery: '', askResults: null, askError: null }),
}));
