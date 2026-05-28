import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Page, getPalette } from '@/types';
import { darkenColor, isLightColor } from '@/utils/color';
import { TILE_VISUALS } from '@/lib/constants';

interface OverviewPageCardProps {
  page: Page;
  isCurrentPage: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  isNavigating: boolean;
  isOtherNavigating: boolean;
  editingPageId: string | null;
  editValue: string;
  onPageClick: (e: React.MouseEvent, pageId: string) => void;
  onDragStart: (e: React.DragEvent, pageId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, pageId: string) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, pageId: string) => void;
  onContextMenu: (e: React.MouseEvent, pageId: string) => void;
  onEditStart: (pageId: string, title: string) => void;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
}

export function OverviewPageCard({
  page, isCurrentPage, isDragging, isDragOver, isNavigating, isOtherNavigating,
  editingPageId, editValue,
  onPageClick, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onContextMenu, onEditStart, onEditChange, onEditSubmit, onEditCancel,
}: OverviewPageCardProps) {
  const palette = getPalette(page.palette_id);
  const [isHovered, setIsHovered] = useState(false);

  // Cards now render at full opacity, so a light palette needs dark foreground
  // text/controls (white-on-near-white would be invisible). Reuse the existing
  // luminance helper to pick readable colors per card.
  const isLight = isLightColor(palette.background);
  const titleColor = isLight ? '#1F2937' : '#FFFFFF';
  const titleShadow = isLight ? 'none' : '0 1px 3px rgba(0,0,0,0.3)';
  const kebabClass = isLight
    ? 'text-gray-700/80 hover:text-gray-900 hover:bg-black/10'
    : 'text-white/70 hover:text-white hover:bg-white/10';
  const badgeClass = isLight ? 'bg-black/10 text-gray-800' : 'bg-white/20 text-white';
  // Axis (-1, 1, 0): top-left toward viewer, bottom-right away
  const restingTransform = `perspective(800px) rotate3d(-1, 1, 0, ${TILE_VISUALS.TILT_DEGREES}deg)`;
  const hoverTransform = 'perspective(800px) rotate3d(-1, 1, 0, 0deg) scale(1.05) translateZ(20px)';

  // Determine transform based on state priority
  let currentTransform = isHovered ? hoverTransform : restingTransform;
  if (isDragging) currentTransform = 'scale(0.95)';
  if (isDragOver) currentTransform = 'scale(1.10)';
  if (isNavigating) currentTransform = 'scale(1.15)';
  if (isOtherNavigating) currentTransform = 'scale(0.95)';

  return (
    <div
      draggable
      onClick={(e) => onPageClick(e, page.id)}
      onDragStart={(e) => onDragStart(e, page.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, page.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, page.id)}
      onContextMenu={(e) => onContextMenu(e, page.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        overview-card relative aspect-square rounded-2xl overflow-hidden
        ${isCurrentPage ? 'ring-4 ring-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}
        ${isDragging ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
        ${isDragOver ? 'shadow-[0_0_25px_rgba(251,191,36,0.7)] ring-4 ring-amber-400' : ''}
        ${isNavigating ? 'shadow-[0_0_40px_rgba(255,255,255,0.3)] z-10' : ''}
        ${isOtherNavigating ? 'opacity-50' : ''}
      `}
      style={{
        backgroundColor: palette.background,
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.25)',
        transform: currentTransform,
        boxShadow: isHovered ? TILE_VISUALS.HOVER_SHADOW : TILE_VISUALS.RESTING_SHADOW,
      }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 via-transparent to-black/10 pointer-events-none" />
      {editingPageId === page.id ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSubmit();
            if (e.key === 'Escape') onEditCancel();
          }}
          onBlur={onEditSubmit}
          autoFocus
          className="absolute top-3 left-3 right-8 bg-white/90 text-gray-900 text-xl font-semibold px-3 py-2 rounded border-none outline-none"
          maxLength={75}
        />
      ) : (
        <div className="absolute top-3 left-3 right-8">
          <h3
            className="text-xl font-semibold leading-tight break-words cursor-pointer"
            style={{ color: titleColor, textShadow: titleShadow }}
            onClick={(e) => { e.stopPropagation(); onEditStart(page.id, page.title); }}
          >
            {page.title}
          </h3>
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onContextMenu(e, page.id); }}
        className={`absolute top-2 right-2 p-1 rounded transition-colors ${kebabClass}`}
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <div className={`absolute bottom-2 right-2 text-xs font-mono px-2 py-1 rounded ${badgeClass}`}>
        {page.position + 1}
      </div>

      {isCurrentPage && (
        <div className="absolute inset-0 rounded-2xl border-4 border-white pointer-events-none" />
      )}
    </div>
  );
}
