import React, { useMemo } from 'react';
import { getGridConfig, getGridCapacity } from '@/types';
import { APP_CONFIG } from '@/lib/constants';
import { TileCard } from '@/components/TileCard';
import { EmptyCell } from '@/components/EmptyCell';
import { useTileStore } from '@/state/tileStore';
import { useUIStore } from '@/state/uiStore';

export function useTileGrid() {
  const tiles = useTileStore(s => s.tiles);
  const createTile = useTileStore(s => s.createTile);
  const swapTilePositions = useTileStore(s => s.swapTilePositions);
  const moveTileToPosition = useTileStore(s => s.moveTileToPosition);
  const insertTileAtPosition = useTileStore(s => s.insertTileAtPosition);
  const moveLink = useTileStore(s => s.moveLink);
  const setSelectedTileId = useUIStore(s => s.setSelectedTileId);
  const draggedTileId = useUIStore(s => s.draggedTileId);
  const setDraggedTileId = useUIStore(s => s.setDraggedTileId);

  const gridCapacity = getGridCapacity(tiles.length);
  const canAddMore = tiles.length < APP_CONFIG.MAX_TILES;
  const { cols, rows } = getGridConfig(gridCapacity);

  const gridStyle = useMemo(() => ({
    // minmax(0, 1fr) lets tracks shrink below their content size.
    // Plain 1fr means minmax(auto, 1fr): rows refuse to shrink below
    // tile content, grow past the viewport, and get clipped.
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
  }), [cols, rows]);

  const mobileGridStyle = useMemo(() => ({
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'auto',
  }), []);

  const handleDragStart = (e: React.DragEvent, tile: { id: string }) => {
    setDraggedTileId(tile.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tile.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnTile = async (e: React.DragEvent, targetTile: { id: string }) => {
    e.preventDefault();
    const currentDraggedId = useUIStore.getState().draggedTileId;
    if (!currentDraggedId || currentDraggedId === targetTile.id) {
      setDraggedTileId(null);
      return;
    }
    setDraggedTileId(null);

    if (e.shiftKey) {
      await swapTilePositions(currentDraggedId, targetTile.id);
    } else {
      const target = tiles.find(t => t.id === targetTile.id);
      if (target) {
        await insertTileAtPosition(currentDraggedId, target.position);
      }
    }
  };

  const handleDropOnEmpty = async (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    const currentDraggedId = useUIStore.getState().draggedTileId;
    if (!currentDraggedId) return;
    setDraggedTileId(null);
    await moveTileToPosition(currentDraggedId, targetPosition);
  };

  const handleLinkDrop = async (linkId: string, targetTileId: string) => {
    await moveLink(linkId, targetTileId);
  };

  const tilesByPosition = useMemo(
    () => new Map(tiles.map(t => [t.position, t])),
    [tiles]
  );

  const gridCells = useMemo(() => {
    const cells = [];
    for (let position = 0; position < gridCapacity; position++) {
      const tile = tilesByPosition.get(position);
      if (tile) {
        cells.push(
          <TileCard
            key={tile.id}
            tile={tile}
            onClick={() => setSelectedTileId(tile.id)}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDropOnTile}
            onLinkDrop={handleLinkDrop}
            isDragging={draggedTileId === tile.id}
          />
        );
      } else {
        cells.push(
          <EmptyCell
            key={`empty-${position}`}
            position={position}
            onDragOver={handleDragOver}
            onDrop={handleDropOnEmpty}
            onClick={(pos: number) => createTile(pos)}
            isDragActive={draggedTileId !== null}
          />
        );
      }
    }
    return cells;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tilesByPosition, gridCapacity, draggedTileId, tiles]);

  return { gridCells, gridStyle, mobileGridStyle, canAddMore };
}
