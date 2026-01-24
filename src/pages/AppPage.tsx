import { useEffect, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import type { Tile } from '@/types';
import {
  useTiles,
  useSelectedTile,
  useEditingDocument,
  useCurrentPalette,
  useCurrentPaletteId,
  useGridCapacity,
  useCanAddTile,
  useLoading,
  useError,
  useModals,
  useAppActions,
} from '@/state';
import { getGridConfig } from '@/utils';
import { buildTilePositionMap, findInboxTile } from '@/services';
import {
  TileCard,
  TilePanel,
  DocumentEditor,
  FloatingActions,
  PasteLinkModal,
  UserMenu,
} from '@/components';

export function AppPage() {
  const tiles = useTiles();
  const selectedTile = useSelectedTile();
  const editingDocument = useEditingDocument();
  const currentPalette = useCurrentPalette();
  const currentPaletteId = useCurrentPaletteId();
  const gridCapacity = useGridCapacity();
  const canAddTile = useCanAddTile();
  const loading = useLoading();
  const error = useError();
  const modals = useModals();

  const {
    loadData,
    createTile,
    createDocument,
    updateLink,
    deleteLink,
    swapTiles,
    moveTile,
    changePalette,
    selectTile,
    editDocument,
    showModal,
    hideModal,
  } = useAppActions();

  const [draggedTileId, setDraggedTileId] = useState<string | null>(null);
  const paletteDebounceRef = useRef<number | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Set document title
  useEffect(() => {
    document.title = 'TileSpace';
  }, []);

  const handlePaletteChange = (paletteId: string) => {
    // Debounce the palette change
    if (paletteDebounceRef.current) {
      clearTimeout(paletteDebounceRef.current);
    }

    paletteDebounceRef.current = window.setTimeout(() => {
      changePalette(paletteId);
    }, 300);
  };

  const handleDragStart = (e: React.DragEvent, tile: Tile) => {
    setDraggedTileId(tile.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnTile = (e: React.DragEvent, targetTile: Tile) => {
    e.preventDefault();
    if (!draggedTileId || draggedTileId === targetTile.id) {
      setDraggedTileId(null);
      return;
    }

    swapTiles(draggedTileId, targetTile.id);
    setDraggedTileId(null);
  };

  const handleDropOnEmpty = (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    if (!draggedTileId) return;

    moveTile(draggedTileId, targetPosition);
    setDraggedTileId(null);
  };

  const handleAddNote = async () => {
    // Find target tile - use selected tile, or Inbox, or first tile
    let targetTileId: string | null = selectedTile?.id ?? null;

    if (!targetTileId) {
      const inboxTile = findInboxTile(tiles);
      targetTileId = inboxTile?.id ?? tiles[0]?.id ?? null;
    }

    if (!targetTileId) {
      // No tiles at all - create one first
      await createTile();
      return;
    }

    try {
      await createDocument(targetTileId, {
        title: '',
        content: '',
        summary: '',
      });
      hideModal('pasteLink');
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleSaveDocument = (
    id: string,
    updates: { title: string; content: string; summary: string }
  ) => {
    updateLink(id, updates);
  };

  const handleCloseDocument = () => {
    editDocument(null);
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

  const { cols, rows } = getGridConfig(gridCapacity as 16 | 20 | 25);
  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  };

  const tilesByPosition = buildTilePositionMap(tiles);

  const gridCells = [];
  for (let position = 0; position < gridCapacity; position++) {
    const tile = tilesByPosition.get(position);
    if (tile) {
      gridCells.push(
        <TileCard
          key={tile.id}
          tile={tile}
          borderColor={currentPalette.border}
          isDragging={draggedTileId === tile.id}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDropOnTile}
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
    <div
      className="h-screen w-screen overflow-hidden"
      style={{ backgroundColor: currentPalette.background }}
    >
      <div className="h-full w-full grid gap-4 p-4" style={gridStyle}>
        {gridCells}
      </div>

      {selectedTile && (
        <TilePanel
          tile={selectedTile}
          currentPaletteId={currentPaletteId}
          onClose={() => selectTile(null)}
        />
      )}

      <FloatingActions
        onAddTile={createTile}
        onPasteLink={() => showModal('pasteLink')}
        onAddNote={handleAddNote}
        canAddTile={canAddTile}
        currentPaletteId={currentPaletteId}
        onSelectPalette={handlePaletteChange}
      />

      {modals.pasteLink && (
        <PasteLinkModal onClose={() => hideModal('pasteLink')} />
      )}

      {editingDocument && (
        <DocumentEditor
          document={editingDocument}
          onClose={handleCloseDocument}
          onSave={handleSaveDocument}
          onDelete={deleteLink}
        />
      )}

      <UserMenu />
    </div>
  );
}
