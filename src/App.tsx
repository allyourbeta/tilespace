import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { APP_CONFIG, INBOX_TILE, TIMING } from './lib/constants';
import { TileCard } from './components/TileCard';
import { TilePanel } from './components/TilePanel';
import { FloatingActions } from './components/FloatingActions';
import { PasteLinkModal } from './components/PasteLinkModal';
import { DocumentEditor } from './components/DocumentEditor';
import { Loader2 } from 'lucide-react';

function App() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  // Store only the ID, derive the full object from tiles
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [draggedTileId, setDraggedTileId] = useState<string | null>(null);
  const [currentPaletteId, setCurrentPaletteId] = useState<string>('ocean');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasteLink, setShowPasteLink] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Link | null>(null);

  // Derive selectedTile from tiles - this ensures it's always in sync
  const selectedTile = useMemo(() => {
    if (!selectedTileId) return null;
    return tiles.find(t => t.id === selectedTileId) ?? null;
  }, [tiles, selectedTileId]);

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
    document.title = APP_CONFIG.TITLE;
    loadData();
  }, [loadData]);

  // Debounce ref for palette changes
  const paletteDebounceRef = useRef<number | null>(null);

  const handlePaletteChange = async (paletteId: string) => {
    // Update UI immediately
    setCurrentPaletteId(paletteId);
    
    // Debounce the actual recolor operation
    if (paletteDebounceRef.current) {
      clearTimeout(paletteDebounceRef.current);
    }
    
    paletteDebounceRef.current = window.setTimeout(async () => {
      try {
        await updateCurrentPalette(paletteId);
        const recoloredTiles = await recolorAllTiles(paletteId);
        // Full replace from server is fine here
        setTiles(recoloredTiles);
      } catch (err) {
        console.error('Failed to change palette:', err);
      }
    }, TIMING.DEBOUNCE_DELAY_MS);
  };

  const handleCreateTile = async () => {
    try {
      const newTile = await createTile(currentPaletteId);
      // Use functional update to avoid stale closure
      setTiles(prev => [...prev, newTile]);
      setSelectedTileId(newTile.id);
    } catch (err) {
      console.error('Failed to create tile:', err);
    }
  };

  const handleUpdateTile = async (id: string, updates: Partial<Tile>) => {
    try {
      await updateTile(id, updates);
      // Use functional update to avoid stale closure
      setTiles(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      // No need to update selectedTile - it's derived from tiles
    } catch (err) {
      console.error('Failed to update tile:', err);
    }
  };

  const handleUpdateTileColor = async (id: string, colorIndex: number) => {
    try {
      await updateTileColor(id, colorIndex, currentPaletteId);
      const newColor = getColorFromPalette(currentPaletteId, colorIndex);
      const updates = { color_index: colorIndex, accent_color: newColor };
      // Use functional update to avoid stale closure
      setTiles(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      // No need to update selectedTile - it's derived from tiles
    } catch (err) {
      console.error('Failed to update tile color:', err);
    }
  };

  const handleResetTile = async (id: string) => {
    try {
      const updatedTiles = await deleteTile(id);
      setTiles(updatedTiles);
      setSelectedTileId(null);
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

    // Use functional approach for reading current state
    setTiles(prev => {
      const draggedTile = prev.find(t => t.id === draggedTileId);
      if (!draggedTile) return prev;

      return prev.map(t => {
        if (t.id === draggedTileId) return { ...t, position: targetTile.position };
        if (t.id === targetTile.id) return { ...t, position: draggedTile.position };
        return t;
      }).sort((a, b) => a.position - b.position);
    });

    setDraggedTileId(null);

    try {
      await swapTilePositions(draggedTileId, targetTile.id);
    } catch (err) {
      console.error('Failed to swap tiles:', err);
      // Rollback by reloading from server
      loadData();
    }
  };

  const handleDropOnEmpty = async (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    if (!draggedTileId) return;

    // Use functional approach for reading current state
    setTiles(prev => {
      const draggedTile = prev.find(t => t.id === draggedTileId);
      if (!draggedTile) return prev;

      return prev.map(t =>
        t.id === draggedTileId ? { ...t, position: targetPosition } : t
      ).sort((a, b) => a.position - b.position);
    });

    setDraggedTileId(null);

    try {
      await moveTileToPosition(draggedTileId, targetPosition);
    } catch (err) {
      console.error('Failed to move tile:', err);
      // Rollback by reloading from server
      loadData();
    }
  };

  const handleCreateLink = async (tileId: string, data: { title: string; url: string; summary: string }): Promise<Link> => {
    // Read current tile from state for validation
    const tile = tiles.find(t => t.id === tileId);
    
    // Check for duplicate URL in this tile
    const normalizedUrl = data.url.trim().toLowerCase();
    const existingLink = tile?.links?.find(l => 
      l.url && l.url.toLowerCase() === normalizedUrl
    );
    if (existingLink) {
      throw new Error('This URL already exists in this tile');
    }
    
    try {
      const position = tile?.links?.length || 0;
      const newLink = await createLink(tileId, position, data.title, data.url, data.summary);

      // Use functional update to avoid stale closure
      setTiles(prev => prev.map(t =>
        t.id === tileId
          ? { ...t, links: [...(t.links || []), newLink] }
          : t
      ));

      return newLink;
    } catch (err) {
      console.error('Failed to create link:', err);
      throw err;
    }
  };

  const handleUpdateLink = async (id: string, updates: Partial<Link>) => {
    try {
      await updateLink(id, updates);

      // Use functional update to avoid stale closure
      setTiles(prev => prev.map(t => ({
        ...t,
        links: t.links?.map(l => l.id === id ? { ...l, ...updates } : l)
      })));

      // Update editingDocument if it's the one being edited
      if (editingDocument?.id === id) {
        setEditingDocument(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      console.error('Failed to update link:', err);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteLink(id);

      // Use functional update to avoid stale closure
      setTiles(prev => prev.map(t => ({
        ...t,
        links: t.links?.filter(l => l.id !== id)
      })));

      // Clear editing document if it was deleted
      if (editingDocument?.id === id) {
        setEditingDocument(null);
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

      // Use functional update to avoid stale closure
      setTiles(prev => prev.map(t => ({
        ...t,
        links: t.links?.map(l => l.id === id ? { ...l, ...updates } : l)
      })));

      // Update the editing document state
      if (editingDocument?.id === id) {
        setEditingDocument(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      console.error('Failed to save document:', err);
    }
  };

  const handleAddNote = async (forTile?: Tile) => {
    // Get target tile - use the passed tile, or current selectedTile, or find Inbox
    let targetTileId: string | null = forTile?.id ?? selectedTileId;
    
    if (!targetTileId) {
      // No tile selected - find Inbox or first tile
      const currentTiles = tiles; // Safe to read here, we're not in an async gap yet
      const inboxTile = currentTiles.find(t => t.title === INBOX_TILE.TITLE);
      
      if (currentTiles.length === 0) {
        // No tiles at all - create a new tile first
        try {
          const newTile = await createTile(currentPaletteId);
          setTiles(prev => [...prev, newTile]);
          setSelectedTileId(newTile.id);
          
          const newDoc = await createDocument(newTile.id, 0, '', '', '');
          setTiles(prev => prev.map(t =>
            t.id === newTile.id
              ? { ...t, links: [newDoc] }
              : t
          ));
          setEditingDocument(newDoc);
        } catch (err) {
          console.error('Failed to create tile and note:', err);
        }
        return;
      }
      
      targetTileId = inboxTile?.id ?? currentTiles[0].id;
    }

    try {
      // Get current link count for position
      const targetTile = tiles.find(t => t.id === targetTileId);
      const position = targetTile?.links?.length || 0;
      
      const newDoc = await createDocument(targetTileId, position, '', '', '');

      // Use functional update to avoid stale closure
      setTiles(prev => prev.map(t =>
        t.id === targetTileId
          ? { ...t, links: [...(t.links || []), newDoc] }
          : t
      ));
      
      setShowPasteLink(false);
      setEditingDocument(newDoc);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleLinkDrop = async (linkId: string, targetTileId: string) => {
    // Find source tile
    let sourceTileId: string | null = null;
    for (const t of tiles) {
      if (t.links?.some(l => l.id === linkId)) {
        sourceTileId = t.id;
        break;
      }
    }

    if (!sourceTileId || sourceTileId === targetTileId) return;

    try {
      const movedLink = await moveLink(linkId, targetTileId);

      // Use functional update to avoid stale closure
      const sourceId = sourceTileId; // Capture for closure
      setTiles(prev => prev.map(t => {
        if (t.id === sourceId) {
          return { ...t, links: t.links?.filter(l => l.id !== linkId) };
        }
        if (t.id === targetTileId) {
          return { ...t, links: [...(t.links || []), movedLink] };
        }
        return t;
      }));
    } catch (err) {
      console.error('Failed to move link:', err);
    }
  };

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

  // Grid capacity based on tile count only
  // Positions are always within the valid range for the current tile count
  const gridCapacity = getGridCapacity(tiles.length);
  
  const canAddMore = tiles.length < APP_CONFIG.MAX_TILES;
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
          onClick={() => setSelectedTileId(tile.id)}
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
          onClose={() => setSelectedTileId(null)}
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
        onPasteLink={() => setShowPasteLink(true)}
        onAddNote={() => handleAddNote()}
        canAddTile={canAddMore}
        currentPaletteId={currentPaletteId}
        onSelectPalette={handlePaletteChange}
      />

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
