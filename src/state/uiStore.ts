import { create } from 'zustand';
import type { Link } from '@/types';

interface UIState {
  selectedTileId: string | null;
  isNewTile: boolean;
  draggedTileId: string | null;
  showPasteLink: boolean;
  editingDocument: Link | null;
  isPageTransitioning: boolean;

  selectTile: (id: string | null, isNew?: boolean) => void;
  setSelectedTileId: (id: string | null) => void;
  setIsNewTile: (value: boolean) => void;
  setDraggedTileId: (id: string | null) => void;
  setShowPasteLink: (value: boolean) => void;
  setEditingDocument: (doc: Link | null) => void;
  setIsPageTransitioning: (value: boolean) => void;
  closeTilePanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedTileId: null,
  isNewTile: false,
  draggedTileId: null,
  showPasteLink: false,
  editingDocument: null,
  isPageTransitioning: false,

  selectTile: (id, isNew = false) => set({
    selectedTileId: id,
    isNewTile: isNew,
  }),

  setSelectedTileId: (id) => set({ selectedTileId: id }),
  setIsNewTile: (value) => set({ isNewTile: value }),
  setDraggedTileId: (id) => set({ draggedTileId: id }),
  setShowPasteLink: (value) => set({ showPasteLink: value }),
  setEditingDocument: (doc) => set({ editingDocument: doc }),
  setIsPageTransitioning: (value) => set({ isPageTransitioning: value }),
  closeTilePanel: () => set({ selectedTileId: null, isNewTile: false }),
}));
