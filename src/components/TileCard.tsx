import { useState } from 'react';
import { Tile } from '@/types';
import { getInitials } from '@/utils';
import { chipColor, chipTint } from '@/lib/chipColors';
import { GripVertical } from 'lucide-react';

interface TileCardProps {
  tile: Tile;
  titleLines: 2 | 3;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, tile: Tile) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, tile: Tile) => void;
  onLinkDrop: (linkId: string, targetTileId: string) => void;
  isDragging: boolean;
}

export function TileCard({ tile, titleLines, onClick, onDragStart, onDragOver, onDrop, onLinkDrop, isDragging }: TileCardProps) {
  const linkCount = tile.links?.length || 0;
  const [isLinkDragOver, setIsLinkDragOver] = useState(false);
  const [isTileDragOver, setIsTileDragOver] = useState(false);
  const [isShiftHeld, setIsShiftHeld] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    const linkData = e.dataTransfer.types.includes('application/link-id');
    if (linkData) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsLinkDragOver(true);
    } else {
      onDragOver(e);
      if (!isDragging) {
        setIsTileDragOver(true);
        setIsShiftHeld(e.shiftKey);
      }
    }
  };

  const handleDragLeave = () => {
    setIsLinkDragOver(false);
    setIsTileDragOver(false);
    setIsShiftHeld(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    const linkId = e.dataTransfer.getData('application/link-id');
    if (linkId) {
      e.preventDefault();
      setIsLinkDragOver(false);
      onLinkDrop(linkId, tile.id);
    } else {
      setIsTileDragOver(false);
      onDrop(e, tile);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, tile)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={onClick}
      title={tile.title}
      className={`
        group relative cursor-pointer
        h-full w-full min-h-0 min-w-0 overflow-hidden
        flex flex-col
        bg-surface-card border border-edge rounded-tile shadow-card
        hover:shadow-cardHi hover:-translate-y-px hover:border-edge-tilehover
        transition-[box-shadow,transform,border-color] duration-[140ms]
        ${isDragging ? 'opacity-50' : ''}
        ${isLinkDragOver ? 'ring-4 ring-blue-400 ring-offset-2' : ''}
        ${isTileDragOver
          ? isShiftHeld
            ? 'ring-4 ring-amber-400 ring-offset-2'
            : 'ring-4 ring-green-400 ring-offset-2'
          : ''}
      `}
      style={{ padding: '14px 16px' }}
    >
      <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-ink-faint" />
      </div>

      {isTileDragOver && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-ts-meta font-semibold text-white shadow-lg z-10 ${
          isShiftHeld ? 'bg-amber-500' : 'bg-green-500'
        }`}>
          {isShiftHeld ? 'SWAP' : 'INSERT'}
        </div>
      )}

      <span
        className="flex-none flex items-center justify-center w-10 h-10 rounded-[10px] mb-[10px] text-ts-body font-bold tracking-[.015em] [@media(max-height:600px)]:hidden"
        style={{
          background: chipTint(tile.color_index),
          color: chipColor(tile.color_index),
        }}
      >
        {getInitials(tile.title)}
      </span>

      <h3
        className={`${titleLines === 3 ? 'line-clamp-3' : 'line-clamp-2'} text-ink font-semibold text-ts-tile tracking-[-.008em] min-h-0 overflow-hidden`}
      >
        {tile.title || '---'}
      </h3>

      {linkCount > 0 && (
        <span
          className="mt-auto flex-none text-ink-muted text-ts-meta pt-[5px] [@media(max-height:600px)]:hidden"
        >
          {linkCount} {linkCount === 1 ? 'item' : 'items'}
        </span>
      )}
    </div>
  );
}
