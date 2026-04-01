import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { Page, getPalette } from '@/types';
import { darkenColor } from '@/utils/color';

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
      className={`
        overview-card relative aspect-square rounded-2xl overflow-hidden
        ${isCurrentPage ? 'ring-4 ring-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}
        ${isDragging ? 'opacity-50 scale-95 cursor-grabbing' : 'hover:shadow-[0_20px_60px_rgba(0,0,0,0.4)] hover:brightness-110 cursor-grab'}
        ${isDragOver ? 'scale-110 shadow-[0_0_25px_rgba(251,191,36,0.7)] ring-4 ring-amber-400' : 'shadow-[0_8px_30px_rgba(0,0,0,0.3)]'}
        ${isNavigating ? 'scale-[1.15] shadow-[0_0_40px_rgba(255,255,255,0.3)] z-10' : ''}
        ${isOtherNavigating ? 'opacity-50 scale-95' : ''}
      `}
      style={{ backgroundColor: darkenColor(palette.background, 15) }}
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
            className="text-white text-xl font-semibold leading-tight break-words cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onEditStart(page.id, page.title); }}
          >
            {page.title}
          </h3>
        </div>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onContextMenu(e, page.id); }}
        className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      <div className="absolute bottom-2 right-2 bg-white/20 text-white text-xs font-mono px-2 py-1 rounded">
        {page.position + 1}
      </div>

      {isCurrentPage && (
        <div className="absolute inset-0 rounded-2xl border-4 border-white pointer-events-none" />
      )}
    </div>
  );
}
