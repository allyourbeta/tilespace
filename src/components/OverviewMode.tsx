import React, { useState } from 'react';
import { X, MoreVertical } from 'lucide-react';
import { Page } from '../types/page';
import { getPalette } from '../types';

interface OverviewModeProps {
  pages: Page[];
  currentPageId: string;
  onClose: () => void;
  onPageSelect: (pageId: string) => void;
  onSwapPages: (pageAId: string, pageBId: string) => void;
  onUpdatePageTitle: (pageId: string, title: string) => void;
  onResetPage: (pageId: string) => void;
}

interface ContextMenuState {
  pageId: string | null;
  x: number;
  y: number;
}

export function OverviewMode({
  pages,
  currentPageId,
  onClose,
  onPageSelect,
  onSwapPages,
  onUpdatePageTitle,
  onResetPage
}: OverviewModeProps) {
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ pageId: null, x: 0, y: 0 });
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);

  const sortedPages = pages.sort((a, b) => a.position - b.position);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePageClick = (e: React.MouseEvent, pageId: string) => {
    // Only handle click if it wasn't a drag operation
    if (draggedPageId) {
      return;
    }
    onPageSelect(pageId);
    onClose();
  };

  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    if (draggedPageId && draggedPageId !== targetPageId) {
      onSwapPages(draggedPageId, targetPageId);
    }
    setDraggedPageId(null);
  };

  const handleDragEnd = () => {
    setDraggedPageId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      pageId,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleRename = (page: Page) => {
    setEditingPageId(page.id);
    setEditValue(page.title);
    setContextMenu({ pageId: null, x: 0, y: 0 });
  };

  const handleSubmitRename = () => {
    const trimmed = editValue.trim();
    if (editingPageId && trimmed) {
      onUpdatePageTitle(editingPageId, trimmed);
    }
    setEditingPageId(null);
    setEditValue('');
  };

  const handleReset = (pageId: string) => {
    setShowResetConfirm(pageId);
    setContextMenu({ pageId: null, x: 0, y: 0 });
  };

  const confirmReset = () => {
    if (showResetConfirm) {
      onResetPage(showResetConfirm);
    }
    setShowResetConfirm(null);
  };

  // Close context menu when clicking outside
  const handleDocumentClick = () => {
    setContextMenu({ pageId: null, x: 0, y: 0 });
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', handleDocumentClick);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur z-50 flex items-center justify-center p-8"
      onClick={handleBackdropClick}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Page Grid - 4 columns per OVERVIEW_MODE.GRID_COLUMNS */}
      <div className="grid grid-cols-4 gap-6 max-w-4xl w-full">
        {sortedPages.map((page) => {
          const palette = getPalette(page.palette_id);
          const isCurrentPage = page.id === currentPageId;
          const isDragging = draggedPageId === page.id;

          return (
            <div
              key={page.id}
              draggable
              onClick={(e) => handlePageClick(e, page.id)}
              onDragStart={(e) => handleDragStart(e, page.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, page.id)}
              onContextMenu={(e) => handleContextMenu(e, page.id)}
              className={`
                relative aspect-square rounded-2xl p-4 transition-all
                ${isCurrentPage ? 'ring-4 ring-white' : ''}
                ${isDragging ? 'opacity-50 scale-95 cursor-grabbing' : 'hover:scale-105 cursor-grab'}
                shadow-lg hover:shadow-xl
              `}
              style={{ backgroundColor: palette.background }}
            >
              {/* Page Title */}
              {editingPageId === page.id ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitRename();
                    if (e.key === 'Escape') setEditingPageId(null);
                  }}
                  onBlur={handleSubmitRename}
                  autoFocus
                  className="absolute top-2 left-2 right-8 bg-white/90 text-gray-900 text-lg font-semibold px-3 py-2 rounded border-none outline-none"
                  maxLength={30}
                />
              ) : (
                <div className="absolute top-2 left-2 right-8">
                  <h3 
                    className="text-white text-lg font-semibold truncate cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPageId(page.id);
                      setEditValue(page.title);
                    }}
                  >
                    {page.title}
                  </h3>
                </div>
              )}

              {/* More Menu Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, page.id);
                }}
                className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10 p-1 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Page Position Number */}
              <div className="absolute bottom-2 right-2 bg-white/20 text-white text-xs font-mono px-2 py-1 rounded">
                {page.position + 1}
              </div>

              {/* Current Page Indicator */}
              {isCurrentPage && (
                <div className="absolute inset-0 rounded-2xl border-4 border-white pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {contextMenu.pageId && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border py-2 z-60"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              const page = pages.find(p => p.id === contextMenu.pageId);
              if (page) handleRename(page);
            }}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
          >
            Rename
          </button>
          <button
            onClick={() => contextMenu.pageId && handleReset(contextMenu.pageId)}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600"
          >
            Reset Page
          </button>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Reset Page?</h3>
            <p className="text-gray-600 mb-4">
              This will delete all tiles and links on this page. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReset}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}