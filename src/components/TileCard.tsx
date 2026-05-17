import { useState } from 'react';
import { Tile } from '@/types';
import { getInitials, getComplementaryColor } from '@/utils';
import { GripVertical } from 'lucide-react';
import { TILE_VISUALS } from '@/lib/constants';

interface TileCardProps {
  tile: Tile;
  borderColor: string;
  pageBackground: string;
  onClick: () => void;
  onDragStart: (e: React.DragEvent, tile: Tile) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, tile: Tile) => void;
  onLinkDrop: (linkId: string, targetTileId: string) => void;
  isDragging: boolean;
}

export function TileCard({ tile, onClick, onDragStart, onDragOver, onDrop, onLinkDrop, isDragging, pageBackground }: TileCardProps) {
  const linkCount = tile.links?.length || 0;
  const [isLinkDragOver, setIsLinkDragOver] = useState(false);
  const [isTileDragOver, setIsTileDragOver] = useState(false);
  const [isShiftHeld, setIsShiftHeld] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Each tile has its own perspective so rotation is independent of grid position
  const restingTransform = `perspective(800px) rotate3d(-1, 1, 0, ${TILE_VISUALS.TILT_DEGREES}deg)`;
  const hoverTransform = 'perspective(800px) rotate3d(-1, 1, 0, 0deg) translateY(-4px) translateZ(20px)';

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`
        group relative cursor-pointer
        h-full w-full
        flex flex-col items-center
        rounded-2xl
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100'}
        ${isLinkDragOver ? 'ring-4 ring-blue-400 ring-offset-2' : ''}
        ${isTileDragOver
          ? isShiftHeld
            ? 'scale-105 shadow-[0_0_20px_rgba(251,191,36,0.6)] ring-4 ring-amber-400 ring-offset-2 ring-offset-white'
            : 'scale-105 shadow-[0_0_20px_rgba(74,222,128,0.5)] ring-4 ring-green-400 ring-offset-2 ring-offset-white'
          : ''}
      `}
      style={{
        backgroundColor: `${tile.accent_color}30`,
        border: '1px solid rgba(255,255,255,0.15)',
        backdropFilter: 'blur(8px)',
        transform: isHovered ? hoverTransform : restingTransform,
        transformStyle: 'preserve-3d' as const,
        transition: 'transform 400ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 400ms cubic-bezier(0.23, 1, 0.32, 1)',
        boxShadow: isHovered
          ? `${TILE_VISUALS.LIFTED_SHADOW}, inset 2px 2px 6px rgba(255,255,255,0.7), inset -1px -1px 3px rgba(0,0,0,0.08)`
          : `${TILE_VISUALS.RESTING_SHADOW}, inset 2px 2px 6px rgba(255,255,255,0.6), inset -1px -1px 3px rgba(0,0,0,0.06)`,
      }}
    >
      {/* Glass highlight overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 via-white/20 to-transparent pointer-events-none" />

      <div className="absolute top-3 left-4 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-gray-400" />
      </div>

      {isTileDragOver && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-lg z-10 ${
          isShiftHeld ? 'bg-amber-500' : 'bg-green-500'
        }`}>
          {isShiftHeld ? 'SWAP' : 'INSERT'}
        </div>
      )}

      <div className="relative flex-1 flex flex-col items-center justify-center pt-4 pb-4 px-4">
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mb-3"
          style={{
            backgroundColor: 'rgba(255,255,255,0.4)',
            boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          <span
            className="text-lg sm:text-xl lg:text-2xl select-none tracking-wide"
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 700,
              color: getComplementaryColor(pageBackground),
            }}
          >
            {getInitials(tile.title)}
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
