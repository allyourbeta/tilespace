import { useState, useEffect, useCallback, useMemo } from 'react';
import { Tile, Link, getGridConfig, getGridCapacity, getColorFromPalette, getPalette, MIN_GRID_SIZE } from './types';
import {
  fetchCurrentPalette,
  updateCurrentPalette,
  recolorAllTiles,
  createTile,
  updateTile,
  updateTileColor,
  deleteTile,
  moveTileToPosition,
  swapTilePositions,
  createLink,
  createDocument,
  updateLink,
  deleteLink,
  moveLink,
  fetchTiles
} from './lib/db';
import { TileCard } from './components/TileCard';
import { TilePanel } from './components/TilePanel';
import { QuickAdd } from './components/QuickAdd';
import { BookmarkletSetup } from './components/BookmarkletSetup';
import { FloatingActions } from './components/FloatingActions';
import { PasteLinkModal } from './components/PasteLinkModal';
import { DocumentEditor } from './components/DocumentEditor';
import { Loader2 } from 'lucide-react';

const MAX_TILES = 25;
const APP_TITLE = 'TileSpace';

function useQuickAddParams() {
  return useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const quickAdd = params.get('quickadd') === '1';
    const url = params.get('url') || '';
    const title = params.get('title') || '';
    return { quickAdd, url, title };
  }, []);
}

function App() {
  const { quickAdd, url: quickAddUrl, title: quickAddTitle } = useQuickAddParams();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [draggedTileId, setDraggedTileId] = useState<string | null>(null);
  const [currentPaletteId, setCurrentPaletteId] = useState<string>('ocean');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookmarklet, setShowBookmarklet] = useState(false);
  const [showPasteLink, setShowPasteLink] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Link | null>(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const paletteId = await fetchCurrentPalette();
      setCurrentPaletteId(paletteId);
      const data = await fetchTiles();
      setTiles(data);
    } catch (err) {
      setError('Failed to load tiles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = APP_TITLE;
    loadData();
  }, [loadData]);

  const handlePaletteChange = async (paletteId: string) => {
    try {
      setCurrentPaletteId(paletteId);
      await updateCurrentPalette(paletteId);
      const recoloredTiles = await recolorAllTiles(paletteId);
      setTiles(recoloredTiles);
      if (selectedTile) {
        const updated = recoloredTiles.find(t => t.id === selectedTile.id);
        if (updated) setSelectedTile(updated);
      }
    } catch (err) {
      console.error('Failed to change palette:', err);
    }
  };

  const handleCreateTile = async () => {
    try {
      const newTile = await createTile(currentPaletteId);
      setTiles([...tiles, newTile]);
      setSelectedTile(newTile);
    } catch (err) {
      console.error('Failed to create tile:', err);
    }
  };

  const handleUpdateTile = async (id: string, updates: Partial<Tile>) => {
    try {
      await updateTile(id, updates);
      setTiles(tiles.map(t => t.id === id ? { ...t, ...updates } : t));
      if (selectedTile?.id === id) {
        setSelectedTile({ ...selectedTile, ...updates });
      }
    } catch (err) {
      console.error('Failed to update tile:', err);
    }
  };

  const handleUpdateTileColor = async (id: string, colorIndex: number) => {
    try {
      await updateTileColor(id, colorIndex, currentPaletteId);
      const newColor = getColorFromPalette(currentPaletteId, colorIndex);
      const updates = { color_index: colorIndex, accent_color: newColor };
      setTiles(tiles.map(t => t.id === id ? { ...t, ...updates } : t));
      if (selectedTile?.id === id) {
        setSelectedTile({ ...selectedTile, ...updates });
      }
    } catch (err) {
      console.error('Failed to update tile color:', err);
    }
  };

  const handleResetTile = async (id: string) => {
    try {
      const updatedTiles = await deleteTile(id);
      setTiles(updatedTiles);
      setSelectedTile(null);
    } catch (err) {
      console.error('Failed to reset tile:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, tile: Tile) => {
    setDraggedTileId(tile.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnTile = async (e: React.DragEvent, targetTile: Tile) => {
    e.preventDefault();
    if (!draggedTileId || draggedTileId === targetTile.id) {
      setDraggedTileId(null);
      return;
    }

    const draggedTile = tiles.find(t => t.id === draggedTileId);
    if (!draggedTile) {
      setDraggedTileId(null);
      return;
    }

    const newTiles = tiles.map(t => {
      if (t.id === draggedTileId) return { ...t, position: targetTile.position };
      if (t.id === targetTile.id) return { ...t, position: draggedTile.position };
      return t;
    }).sort((a, b) => a.position - b.position);

    setTiles(newTiles);
    setDraggedTileId(null);

    try {
      await swapTilePositions(draggedTileId, targetTile.id);
    } catch (err) {
      console.error('Failed to swap tiles:', err);
      loadData();
    }
  };

  const handleDropOnEmpty = async (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    if (!draggedTileId) return;

    const draggedTile = tiles.find(t => t.id === draggedTileId);
    if (!draggedTile) {
      setDraggedTileId(null);
      return;
    }

    const newTiles = tiles.map(t =>
      t.id === draggedTileId ? { ...t, position: targetPosition } : t
    ).sort((a, b) => a.position - b.position);

    setTiles(newTiles);
    setDraggedTileId(null);

    try {
      await moveTileToPosition(draggedTileId, targetPosition);
    } catch (err) {
      console.error('Failed to move tile:', err);
      loadData();
    }
  };

  const handleCreateLink = async (tileId: string, data: { title: string; url: string; summary: string }): Promise<Link> => {
    const tile = tiles.find(t => t.id === tileId);
    
    // Check for duplicate URL in this tile
    const normalizedUrl = data.url.trim().toLowerCase();
    const existingLink = tile?.links?.find(l => 
      l.url && l.url.toLowerCase() === normalizedUrl
    );
    if (existingLink) {
      throw new Error('This URL already exists in this tile');
    }
    
    const position = tile?.links?.length || 0;
    const newLink = await createLink(tileId, position, data.title, data.url, data.summary);

    const updatedTiles = tiles.map(t =>
      t.id === tileId
        ? { ...t, links: [...(t.links || []), newLink] }
        : t
    );
    setTiles(updatedTiles);

    if (selectedTile?.id === tileId) {
      setSelectedTile({
        ...selectedTile,
        links: [...(selectedTile.links || []), newLink]
      });
    }

    return newLink;
  };

  const handleUpdateLink = async (id: string, updates: Partial<Link>) => {
    try {
      await updateLink(id, updates);

      const updatedTiles = tiles.map(t => ({
        ...t,
        links: t.links?.map(l => l.id === id ? { ...l, ...updates } : l)
      }));
      setTiles(updatedTiles);

      if (selectedTile) {
        setSelectedTile({
          ...selectedTile,
          links: selectedTile.links?.map(l => l.id === id ? { ...l, ...updates } : l)
        });
      }
    } catch (err) {
      console.error('Failed to update link:', err);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteLink(id);

      const updatedTiles = tiles.map(t => ({
        ...t,
        links: t.links?.filter(l => l.id !== id)
      }));
      setTiles(updatedTiles);

      if (selectedTile) {
        setSelectedTile({
          ...selectedTile,
          links: selectedTile.links?.filter(l => l.id !== id)
        });
      }
    } catch (err) {
      console.error('Failed to delete link:', err);
    }
  };

  const handleOpenDocument = (link: Link) => {
    setEditingDocument(link);
  };

  const handleSaveDocument = async (id: string, updates: { title: string; content: string; summary: string }) => {
    try {
      await updateLink(id, updates);

      const updatedTiles = tiles.map(t => ({
        ...t,
        links: t.links?.map(l => l.id === id ? { ...l, ...updates } : l)
      }));
      setTiles(updatedTiles);

      if (selectedTile) {
        setSelectedTile({
          ...selectedTile,
          links: selectedTile.links?.map(l => l.id === id ? { ...l, ...updates } : l)
        });
      }

      if (editingDocument?.id === id) {
        setEditingDocument({ ...editingDocument, ...updates });
      }
    } catch (err) {
      console.error('Failed to save document:', err);
    }
  };

  const handleAddNote = async (forTile?: Tile) => {
    const targetTile = forTile || selectedTile;
    
    if (!targetTile) {
      // No tile selected - add to Inbox
      const inboxTile = tiles.find(t => t.title === 'Inbox');
      
      if (tiles.length === 0) {
        // No tiles at all - create a new tile
        const newTile = await createTile(currentPaletteId);
        setTiles([newTile]);
        setSelectedTile(newTile);
        const newDoc = await createDocument(newTile.id, 0, '', '', '');
        const updatedTile = { ...newTile, links: [newDoc] };
        setTiles([updatedTile]);
        setSelectedTile(updatedTile);
        setEditingDocument(newDoc);
      } else if (inboxTile) {
        // Add to Inbox tile
        setShowPasteLink(false);
        setShowBookmarklet(false);
        const position = inboxTile.links?.length || 0;
        const newDoc = await createDocument(inboxTile.id, position, '', '', '');
        const updatedTiles = tiles.map(t =>
          t.id === inboxTile.id
            ? { ...t, links: [...(t.links || []), newDoc] }
            : t
        );
        setTiles(updatedTiles);
        setEditingDocument(newDoc);
      } else {
        // No Inbox tile - use first tile
        setShowPasteLink(false);
        setShowBookmarklet(false);
        const firstTile = tiles[0];
        const position = firstTile.links?.length || 0;
        const newDoc = await createDocument(firstTile.id, position, '', '', '');
        const updatedTiles = tiles.map(t =>
          t.id === firstTile.id
            ? { ...t, links: [...(t.links || []), newDoc] }
            : t
        );
        setTiles(updatedTiles);
        setEditingDocument(newDoc);
      }
      return;
    }

    const position = targetTile.links?.length || 0;
    const newDoc = await createDocument(targetTile.id, position, '', '', '');

    const updatedTiles = tiles.map(t =>
      t.id === targetTile.id
        ? { ...t, links: [...(t.links || []), newDoc] }
        : t
    );
    setTiles(updatedTiles);
    
    if (selectedTile?.id === targetTile.id) {
      setSelectedTile({
        ...selectedTile,
        links: [...(selectedTile.links || []), newDoc]
      });
    }
    setEditingDocument(newDoc);
  };

  const handleLinkDrop = async (linkId: string, targetTileId: string) => {
    let sourceTileId: string | null = null;
    for (const t of tiles) {
      if (t.links?.some(l => l.id === linkId)) {
        sourceTileId = t.id;
        break;
      }
    }

    if (sourceTileId === targetTileId) return;

    try {
      const movedLink = await moveLink(linkId, targetTileId);

      const updatedTiles = tiles.map(t => {
        if (t.id === sourceTileId) {
          return { ...t, links: t.links?.filter(l => l.id !== linkId) };
        }
        if (t.id === targetTileId) {
          return { ...t, links: [...(t.links || []), movedLink] };
        }
        return t;
      });
      setTiles(updatedTiles);

      if (selectedTile) {
        if (selectedTile.id === sourceTileId) {
          setSelectedTile({
            ...selectedTile,
            links: selectedTile.links?.filter(l => l.id !== linkId)
          });
        } else if (selectedTile.id === targetTileId) {
          setSelectedTile({
            ...selectedTile,
            links: [...(selectedTile.links || []), movedLink]
          });
        }
      }
    } catch (err) {
      console.error('Failed to move link:', err);
    }
  };

  const handleCloseQuickAdd = () => {
    window.location.href = window.location.origin;
  };

  if (quickAdd) {
    return (
      <QuickAdd
        url={quickAddUrl}
        title={quickAddTitle}
        onClose={handleCloseQuickAdd}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const canAddMore = tiles.length < MAX_TILES;
  const gridCapacity = getGridCapacity(Math.max(tiles.length, MIN_GRID_SIZE));
  const { cols, rows } = getGridConfig(gridCapacity);

  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  };

  const currentPalette = getPalette(currentPaletteId);
  const bgColor = currentPalette.background;
  const borderColor = currentPalette.border;

  const tilesByPosition = new Map(tiles.map(t => [t.position, t]));

  const gridCells = [];
  for (let position = 0; position < gridCapacity; position++) {
    const tile = tilesByPosition.get(position);
    if (tile) {
      gridCells.push(
        <TileCard
          key={tile.id}
          tile={tile}
          borderColor={borderColor}
          onClick={() => setSelectedTile(tile)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDropOnTile}
          onLinkDrop={handleLinkDrop}
          isDragging={draggedTileId === tile.id}
        />
      );
    } else {
      gridCells.push(
        <div
          key={`empty-${position}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnEmpty(e, position)}
          className="rounded-3xl bg-white/20 border-2 border-dashed border-white/30 flex items-center justify-center hover:bg-white/30 hover:border-white/50 transition-all"
        >
          <span className="text-white/50 text-2xl font-light">-</span>
        </div>
      );
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden" style={{ backgroundColor: bgColor }}>
      <div className="h-full w-full grid gap-4 p-4" style={gridStyle}>
        {gridCells}
      </div>

      {selectedTile && (
        <TilePanel
          tile={selectedTile}
          currentPaletteId={currentPaletteId}
          onClose={() => setSelectedTile(null)}
          onUpdateTile={handleUpdateTile}
          onUpdateTileColor={handleUpdateTileColor}
          onResetTile={handleResetTile}
          onCreateLink={handleCreateLink}
          onUpdateLink={handleUpdateLink}
          onDeleteLink={handleDeleteLink}
          onOpenDocument={handleOpenDocument}
          onAddNote={() => handleAddNote(selectedTile)}
        />
      )}

      <FloatingActions
        onAddTile={handleCreateTile}
        onShowBookmarklet={() => setShowBookmarklet(true)}
        onPasteLink={() => setShowPasteLink(true)}
        onAddNote={() => handleAddNote()}
        canAddTile={canAddMore}
        currentPaletteId={currentPaletteId}
        onSelectPalette={handlePaletteChange}
      />


      {showBookmarklet && (
        <BookmarkletSetup onClose={() => setShowBookmarklet(false)} />
      )}

      {showPasteLink && (
        <PasteLinkModal
          onClose={() => setShowPasteLink(false)}
          onLinkAdded={loadData}
        />
      )}

      {editingDocument && (
        <DocumentEditor
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSave={handleSaveDocument}
          onDelete={handleDeleteLink}
        />
      )}
    </div>
  );
}

export default App;
