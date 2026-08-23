import type { Link } from '@/types';
import * as api from '@/api';
import { useUIStore } from './uiStore';
import type { TileState } from './tileStore';

type SetFn = (fn: (state: TileState) => Partial<TileState>) => void;
type GetFn = () => TileState;

/** Link/document mutations, split out of tileStore.ts to keep it under the file-size limit. */
export function createLinkActions(set: SetFn, get: GetFn) {
  return {
    createLink: async (tileId: string, data: { title: string; url: string; summary: string }): Promise<Link> => {
      const { tiles } = get();
      const tile = tiles.find(t => t.id === tileId);
      const normalizedUrl = data.url.trim().toLowerCase();
      const existingLink = tile?.links?.find(l =>
        l.url && l.url.toLowerCase() === normalizedUrl
      );
      if (existingLink) {
        throw new Error('This URL already exists in this tile');
      }

      try {
        const position = tile?.links?.length || 0;
        const newLink = await api.createLink(tileId, position, data.title, data.url, data.summary);
        set(state => ({
          tiles: state.tiles.map(t =>
            t.id === tileId
              ? { ...t, links: [...(t.links || []), newLink] }
              : t
          ),
        }));

        return newLink;
      } catch (err) {
        console.error('Failed to create link:', err);
        throw err;
      }
    },

    createDocument: async (
      tileId: string, position: number, title: string, content: string, summary: string
    ): Promise<Link> => {
      try {
        const newDoc = await api.createDocument(tileId, position, title, content, summary);
        set(state => ({
          tiles: state.tiles.map(t =>
            t.id === tileId
              ? { ...t, links: [...(t.links || []), newDoc] }
              : t
          ),
        }));

        return newDoc;
      } catch (err) {
        console.error('Failed to create document:', err);
        throw err;
      }
    },

    updateLink: async (id: string, updates: Partial<Link>) => {
      try {
        await api.updateLink(id, updates);
        set(state => ({
          tiles: state.tiles.map(t => ({
            ...t,
            links: t.links?.map(l => l.id === id ? { ...l, ...updates } : l),
          })),
        }));
        const editingDoc = useUIStore.getState().editingDocument;
        if (editingDoc?.id === id) {
          useUIStore.getState().setEditingDocument({ ...editingDoc, ...updates } as Link);
        }
      } catch (err) {
        console.error('Failed to update link:', err);
      }
    },

    deleteLink: async (id: string) => {
      try {
        await api.deleteLink(id);
        set(state => ({
          tiles: state.tiles.map(t => ({
            ...t,
            links: t.links?.filter(l => l.id !== id),
          })),
        }));
        const editingDoc = useUIStore.getState().editingDocument;
        if (editingDoc?.id === id) {
          useUIStore.getState().setEditingDocument(null);
        }
      } catch (err) {
        console.error('Failed to delete link:', err);
      }
    },

    moveLink: async (linkId: string, targetTileId: string) => {
      const { tiles } = get();
      let sourceTileId: string | null = null;
      for (const t of tiles) {
        if (t.links?.some(l => l.id === linkId)) {
          sourceTileId = t.id;
          break;
        }
      }
      if (!sourceTileId || sourceTileId === targetTileId) return;

      try {
        const movedLink = await api.moveLink(linkId, targetTileId);
        const sourceId = sourceTileId;
        set(state => ({
          tiles: state.tiles.map(t => {
            if (t.id === sourceId) {
              return { ...t, links: t.links?.filter(l => l.id !== linkId) };
            }
            if (t.id === targetTileId) {
              return { ...t, links: [...(t.links || []), movedLink] };
            }
            return t;
          }),
        }));
      } catch (err) {
        console.error('Failed to move link:', err);
      }
    },
  };
}
