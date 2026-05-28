import React, { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { Page } from '@/types';
import { useIsMobile } from '@/hooks';
import { OverviewPageCard } from './OverviewPageCard';

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
  pages, currentPageId, onClose, onPageSelect, onSwapPages, onUpdatePageTitle, onResetPage,
}: OverviewModeProps) {
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ pageId: null, x: 0, y: 0 });
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [navigatingPageId, setNavigatingPageId] = useState<string | null>(null);

  useEffect(() => { requestAnimationFrame(() => setIsVisible(true)); }, []);

  const sortedPages = useMemo(() => [...pages].sort((a, b) => a.position - b.position), [pages]);

  const desktopCols = useMemo(() => {
    const aspect = window.innerWidth / window.innerHeight;
    return Math.max(2, Math.min(Math.ceil(Math.sqrt(pages.length * aspect)), 6));
  }, [pages.length]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    const handleClick = () => setContextMenu({ pageId: null, x: 0, y: 0 });
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleClick);
    return () => { document.removeEventListener('keydown', handleKeyDown); document.removeEventListener('click', handleClick); };
  }, [onClose]);

  const handlePageClick = (e: React.MouseEvent, pageId: string) => {
    if (draggedPageId || navigatingPageId) return;
    setNavigatingPageId(pageId);
    setTimeout(() => { onPageSelect(pageId); onClose(); }, 300);
  };

  const handleDragStart = (e: React.DragEvent, pageId: string) => { setDraggedPageId(pageId); e.dataTransfer.effectAllowed = 'move'; };
  const handleDragOver = (e: React.DragEvent, pageId: string) => { e.preventDefault(); if (pageId !== draggedPageId) setDragOverPageId(pageId); };
  const handleDrop = (e: React.DragEvent, targetPageId: string) => { e.preventDefault(); if (draggedPageId && draggedPageId !== targetPageId) onSwapPages(draggedPageId, targetPageId); setDraggedPageId(null); setDragOverPageId(null); };
  const handleDragEnd = () => { setDraggedPageId(null); setDragOverPageId(null); };

  const handleContextMenu = (e: React.MouseEvent, pageId: string) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ pageId, x: e.clientX, y: e.clientY }); };

  const handleSubmitRename = () => {
    const trimmed = editValue.trim();
    if (editingPageId && trimmed) onUpdatePageTitle(editingPageId, trimmed);
    setEditingPageId(null);
    setEditValue('');
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${isMobile ? 'p-3' : 'p-8'}`}
      style={{
        backgroundColor: '#BD7A24',
        backgroundImage: [
          'repeating-linear-gradient(90deg, rgba(0,0,0,0.17) 0px, rgba(0,0,0,0.05) 1px, rgba(255,255,255,0.16) 3px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.17) 6px)',
          'repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.04) 1px, rgba(255,255,255,0.13) 3px, rgba(0,0,0,0.04) 5px, rgba(0,0,0,0.15) 6px)',
          'radial-gradient(ellipse at 50% 36%, rgba(255,231,184,0.26) 0%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.16) 100%)',
        ].join(', '),
        backgroundSize: '6px 6px, 6px 6px, 100% 100%',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button onClick={onClose} className="absolute top-6 right-6 text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
        <X className="w-6 h-6" />
      </button>

      <div
        className={`grid ${isMobile ? 'grid-cols-2 gap-3 p-4 overflow-y-auto max-h-[80vh] w-full' : 'gap-6 w-[85vw] max-w-screen-xl'} transition-all duration-200 ease-out ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'}`}
        style={!isMobile ? { gridTemplateColumns: `repeat(${desktopCols}, 1fr)`, perspective: '1000px', perspectiveOrigin: '50% 50%', transformStyle: 'preserve-3d' as const } : undefined}
      >
        {sortedPages.map((page) => (
          <OverviewPageCard
            key={page.id}
            page={page}
            isCurrentPage={page.id === currentPageId}
            isDragging={draggedPageId === page.id}
            isDragOver={dragOverPageId === page.id && draggedPageId !== page.id}
            isNavigating={navigatingPageId === page.id}
            isOtherNavigating={!!navigatingPageId && navigatingPageId !== page.id}
            editingPageId={editingPageId}
            editValue={editValue}
            onPageClick={handlePageClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={() => setDragOverPageId(null)}
            onDrop={handleDrop}
            onContextMenu={handleContextMenu}
            onEditStart={(id, title) => { setEditingPageId(id); setEditValue(title); }}
            onEditChange={setEditValue}
            onEditSubmit={handleSubmitRename}
            onEditCancel={() => setEditingPageId(null)}
          />
        ))}
      </div>

      {contextMenu.pageId && (
        <div className="fixed bg-white rounded-lg shadow-lg border py-2 z-60" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => { const page = pages.find(p => p.id === contextMenu.pageId); if (page) { setEditingPageId(page.id); setEditValue(page.title); setContextMenu({ pageId: null, x: 0, y: 0 }); } }} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700">Rename</button>
          <button onClick={() => { if (contextMenu.pageId) { setShowResetConfirm(contextMenu.pageId); setContextMenu({ pageId: null, x: 0, y: 0 }); } }} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-red-600">Reset Page</button>
        </div>
      )}

      {showResetConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Reset Page?</h3>
            <p className="text-gray-600 mb-4">This will delete all tiles and links on this page. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetConfirm(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button onClick={() => { if (showResetConfirm) onResetPage(showResetConfirm); setShowResetConfirm(null); }} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors">Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
