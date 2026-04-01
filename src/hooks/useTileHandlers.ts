import { useCallback } from 'react';
import type { Tile, Link } from '@/types';
import { isValidUrl } from '@/utils/url';
import { INBOX_TILE } from '@/lib/constants';
import { usePageStore } from '@/state/pageStore';
import { useTileStore } from '@/state/tileStore';
import { useUIStore } from '@/state/uiStore';

export function useTileHandlers() {
  const handlePasteLink = useCallback(async () => {
    const tiles = useTileStore.getState().tiles;
    const currentPageId = usePageStore.getState().currentPageId;
    const inboxTile = tiles.find(t => t.title === INBOX_TILE.TITLE);

    if (!inboxTile && tiles.length === 0) {
      if (!currentPageId) return;
      try {
        await useTileStore.getState().createTile();
        const newTiles = useTileStore.getState().tiles;
        const newTile = newTiles[newTiles.length - 1];
        if (!newTile) return;

        let clipUrl: string | null = null;
        try {
          const text = await navigator.clipboard.readText();
          const trimmed = text?.trim();
          if (trimmed) {
            const candidate = (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))
              ? `https://${trimmed}` : trimmed;
            if (isValidUrl(candidate)) clipUrl = candidate;
          }
        } catch { /* clipboard denied */ }

        if (clipUrl) {
          await useTileStore.getState().createLink(newTile.id, {
            title: clipUrl, url: clipUrl, summary: '',
          });
        }
      } catch (err) {
        console.error('Failed to create tile and link:', err);
      }
      return;
    }

    if (inboxTile) {
      try {
        const text = await navigator.clipboard.readText();
        const trimmed = text?.trim();
        if (trimmed) {
          const candidate = (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))
            ? `https://${trimmed}` : trimmed;
          if (isValidUrl(candidate)) {
            await useTileStore.getState().createLink(inboxTile.id, {
              title: candidate, url: candidate, summary: '',
            });
            useUIStore.getState().setSelectedTileId(inboxTile.id);
            return;
          }
        }
      } catch { /* clipboard denied */ }
    }

    useUIStore.getState().setShowPasteLink(true);
  }, []);

  const handleAddNote = useCallback(async (forTile?: Tile) => {
    const tiles = useTileStore.getState().tiles;
    const selectedTileId = useUIStore.getState().selectedTileId;
    const currentPageId = usePageStore.getState().currentPageId;
    if (!currentPageId) return;

    let targetTileId: string | null = forTile?.id ?? selectedTileId;

    if (!targetTileId) {
      const inboxTile = tiles.find(t => t.title === INBOX_TILE.TITLE);

      if (tiles.length === 0) {
        try {
          await useTileStore.getState().createTile();
          const newTiles = useTileStore.getState().tiles;
          const newTile = newTiles[newTiles.length - 1];
          if (!newTile) return;

          const newDoc = await useTileStore.getState().createDocument(
            newTile.id, 0, '', '', '',
          );
          useUIStore.getState().setEditingDocument(newDoc);
        } catch (err) {
          console.error('Failed to create tile and note:', err);
        }
        return;
      }

      targetTileId = inboxTile?.id ?? tiles[0].id;
    }

    try {
      const targetTile = tiles.find(t => t.id === targetTileId);
      const position = targetTile?.links?.length || 0;

      const newDoc = await useTileStore.getState().createDocument(
        targetTileId!, position, '', '', '',
      );

      useUIStore.getState().setShowPasteLink(false);
      useUIStore.getState().setEditingDocument(newDoc);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  }, []);

  const handleSaveDocument = useCallback(async (
    id: string,
    updates: { title: string; content: string; summary: string },
  ) => {
    await useTileStore.getState().updateLink(id, updates);
  }, []);

  const handleOpenDocument = useCallback((link: Link) => {
    useUIStore.getState().setEditingDocument(link);
  }, []);

  return { handlePasteLink, handleAddNote, handleSaveDocument, handleOpenDocument };
}
