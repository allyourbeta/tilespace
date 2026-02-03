import { useState } from 'react';
import { Tile } from '../types';
import { GripVertical } from 'lucide-react';

interface TileCardProps {
  tile: Tile;
  borderColor: string;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, tile: Tile) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, tile: Tile) => void;
  onLinkDrop: (linkId: string, targetTileId: string) => void;
  isDragging: boolean;
}

export function TileCard({ tile, borderColor, onClick, onDragStart, onDragOver, onDrop, onLinkDrop, isDragging }: TileCardProps) {
  const linkCount = tile.links?.length || 0;
  const [isLinkDragOver, setIsLinkDragOver] = useState(false);
  const [isTileDragOver, setIsTileDragOver] = useState(false);

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
      }
    }
  };

  const handleDragLeave = () => {
    setIsLinkDragOver(false);
    setIsTileDragOver(false);
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
      className={`
        group relative cursor-pointer
        h-full w-full
        flex flex-col items-center
        bg-white
        rounded-xl
        border-[6px]
        transition-all duration-150 ease-out
        hover:shadow-xl hover:-translate-y-1
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${isLinkDragOver ? 'ring-4 ring-blue-400 ring-offset-2' : ''}
        ${isTileDragOver ? 'scale-105 shadow-[0_0_20px_rgba(251,191,36,0.6)] ring-4 ring-amber-400 ring-offset-2 ring-offset-white' : ''}
      `}
      style={{ borderColor }}
    >
      <div className="absolute top-3 left-4 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center pt-4 pb-4 px-4">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mb-3"
          style={{ backgroundColor: `${tile.accent_color}20` }}
        >
          <span
            className="text-2xl sm:text-3xl lg:text-4xl select-none"
            style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }}
          >
            {tile.emoji || '📁'}
          </span>
        </div>

        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 text-center tracking-tight leading-tight">
          {tile.title || '---'}
        </h3>

        <div className="h-6 mt-2 flex items-center">
          {linkCount > 0 && (
            <span className="text-xs sm:text-sm text-gray-400 font-medium">
              {linkCount} {linkCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
