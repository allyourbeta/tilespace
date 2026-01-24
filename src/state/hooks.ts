import { useMemo } from 'react';
import { useAppStore, selectSelectedTile, selectEditingDocument, selectGridCapacity, selectCanAddTile } from './store';
import { getPalette } from '@/types';

/**
 * Hook to get tiles array
 */
export function useTiles() {
  return useAppStore((state) => state.tiles);
}

/**
 * Hook to get the currently selected tile
 */
export function useSelectedTile() {
  return useAppStore(selectSelectedTile);
}

/**
 * Hook to get the document currently being edited
 */
export function useEditingDocument() {
  return useAppStore(selectEditingDocument);
}

/**
 * Hook to get the current palette
 */
export function useCurrentPalette() {
  const paletteId = useAppStore((state) => state.currentPaletteId);
  return useMemo(() => getPalette(paletteId), [paletteId]);
}

/**
 * Hook to get the current palette ID
 */
export function useCurrentPaletteId() {
  return useAppStore((state) => state.currentPaletteId);
}

/**
 * Hook to get grid capacity based on tile count
 */
export function useGridCapacity() {
  return useAppStore(selectGridCapacity);
}

/**
 * Hook to check if we can add more tiles
 */
export function useCanAddTile() {
  return useAppStore(selectCanAddTile);
}

/**
 * Hook to get loading state
 */
export function useLoading() {
  return useAppStore((state) => state.loading);
}

/**
 * Hook to get error state
 */
export function useError() {
  return useAppStore((state) => state.error);
}

/**
 * Hook to get modal states
 */
export function useModals() {
  return useAppStore((state) => state.modals);
}

/**
 * Hook to get all actions
 */
export function useAppActions() {
  return {
    loadData: useAppStore((state) => state.loadData),
    createTile: useAppStore((state) => state.createTile),
    updateTile: useAppStore((state) => state.updateTile),
    updateTileColor: useAppStore((state) => state.updateTileColor),
    deleteTile: useAppStore((state) => state.deleteTile),
    swapTiles: useAppStore((state) => state.swapTiles),
    moveTile: useAppStore((state) => state.moveTile),
    createLink: useAppStore((state) => state.createLink),
    createDocument: useAppStore((state) => state.createDocument),
    updateLink: useAppStore((state) => state.updateLink),
    deleteLink: useAppStore((state) => state.deleteLink),
    moveLink: useAppStore((state) => state.moveLink),
    changePalette: useAppStore((state) => state.changePalette),
    selectTile: useAppStore((state) => state.selectTile),
    editDocument: useAppStore((state) => state.editDocument),
    showModal: useAppStore((state) => state.showModal),
    hideModal: useAppStore((state) => state.hideModal),
    clearError: useAppStore((state) => state.clearError),
  };
}
