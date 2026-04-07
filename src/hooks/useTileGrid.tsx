import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { getGridConfig, getGridCapacity } from '@/types';
import { APP_CONFIG } from '@/lib/constants';
import { TileCard } from '@/components/TileCard';
import { EmptyCell } from '@/components/EmptyCell';
import { useTileStore } from '@/state/tileStore';
import { useUIStore } from '@/state/uiStore';
import { usePageStore } from '@/state/pageStore';
import { getPalette } from '@/types';

export function useTileGrid() {
  const tiles = useTileStore(s => s.tiles);
  const swapTilePositions = useTileStore(s => s.swapTilePositions);
  const moveTileToPosition = useTileStore(s => s.moveTileToPosition);
  const insertTileAtPosition = useTileStore(s => s.insertTileAtPosition);
  const moveLink = useTileStore(s => s.moveLink);
  const setSelectedTileId = useUIStore(s => s.setSelectedTileId);
  const draggedTileId = useUIStore(s => s.draggedTileId);
  const setDraggedTileId = useUIStore(s => s.setDraggedTileId);

  const pages = usePageStore(s => s.pages);
  const currentPageId = usePageStore(s => s.currentPageId);
  const currentPage = currentPageId ? pages.find(p => p.id === currentPageId) : null;
  const currentPaletteId = currentPage?.palette_id ?? 'ocean';
  const currentPalette = getPalette(currentPaletteId);
  const borderColor = currentPalette.border;

  const gridCapacity = getGridCapacity(tiles.length);
  const canAddMore = tiles.length < APP_CONFIG.MAX_TILES;
  const { cols, rows } = getGridConfig(gridCapacity);

  // Use a ref so drag handlers always read the latest draggedTileId
  // without needing to be in any dependency array
  const draggedTileIdRef = useRef(draggedTileId);
  useEffect(() => { draggedTileIdRef.current = draggedTileId; }, [draggedTileId]);

  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  }), [cols, rows]);

  const mobileGridStyle = useMemo(() => ({
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'auto',
  }), []);

  const handleDragStart = useCallback((e: React.DragEvent, tile: { id: string }) => {
    setDraggedTileId(tile.id);
    e.dataTransfer.effectAllowed = 'move';
  }, [setDraggedTileId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Drop on an occupied tile: shift+drop = swap, normal drop = insert
  const handleDropOnTile = useCallback(async (e: React.DragEvent, targetTile: { id: string }) => {
    e.preventDefault();
    const currentDraggedId = draggedTileIdRef.current;
    if (!currentDraggedId || currentDraggedId === targetTile.id) {
      setDraggedTileId(null);
      return;
    }
    setDraggedTileId(null);

    if (e.shiftKey) {
      await swapTilePositions(currentDraggedId, targetTile.id);
    } else {
      // Insert: find target tile's position and insert there
      const target = tiles.find(t => t.id === targetTile.id);
      if (target) {
        await insertTileAtPosition(currentDraggedId, target.position);
      }
    }
  }, [setDraggedTileId, swapTilePositions, insertTileAtPosition, tiles]);

  // Drop on an empty cell: always move directly (no shift needed)
  const handleDropOnEmpty = useCallback(async (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    const currentDraggedId = draggedTileIdRef.current;
    if (!currentDraggedId) return;
    setDraggedTileId(null);
    await moveTileToPosition(currentDraggedId, targetPosition);
  }, [setDraggedTileId, moveTileToPosition]);

  const handleLinkDrop = useCallback(async (linkId: string, targetTileId: string) => {
    await moveLink(linkId, targetTileId);
  }, [moveLink]);

  const tilesByPosition = useMemo(
    () => new Map(tiles.map(t => [t.position, t])),
    [tiles]
  );

  // Build grid cells directly (no useMemo around JSX with embedded handlers)
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
        <EmptyCell
          key={`empty-${position}`}
          position={position}
          onDragOver={handleDragOver}
          onDrop={handleDropOnEmpty}
          isDragActive={draggedTileId !== null}
        />
      );
    }
  }

  return { gridCells, gridStyle, mobileGridStyle, canAddMore };
}
