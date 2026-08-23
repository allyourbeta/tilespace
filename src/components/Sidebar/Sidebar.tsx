import { useState, useEffect, useCallback } from 'react';
import type { Page } from '@/types';
import { LAYOUT } from '@/lib/constants';
import { chipColor } from '@/lib/chipColors';
import { PageRow } from './PageRow';
import { UserMenu } from '@/components/UserMenu';

interface SidebarProps {
  pages: Page[];
  tileCounts: Record<string, number>;
  currentPageId: string | null;
  onPageSelect: (id: string) => void;
  onInsertPage: (draggedId: string, targetPosition: number) => void;
  onUpdatePageTitle: (id: string, title: string) => void;
  onResetPage: (id: string) => void;
  onCreatePage: () => void;
  isMobile: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}

interface ContextMenuState {
  pageId: string | null;
  x: number;
  y: number;
}

const TOGGLE_SHORTCUT_HINT = '⌘\\ / Ctrl+\\';

export function Sidebar({
  pages, tileCounts, currentPageId, onPageSelect, onInsertPage,
  onUpdatePageTitle, onResetPage, onCreatePage, isMobile,
  isCollapsed, onToggleCollapsed,
}: SidebarProps) {
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ pageId: null, x: 0, y: 0 });
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState<string | null>(null);

  const closeContextMenu = useCallback(() => setContextMenu({ pageId: null, x: 0, y: 0 }), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeContextMenu(); };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', closeContextMenu);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('click', closeContextMenu);
    };
  }, [closeContextMenu]);

  const sortedPages = [...pages].sort((a, b) => a.position - b.position);
  const collapsed = isCollapsed && !isMobile;

  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    // Safari won't start a real drag without a payload set in dragstart.
    e.dataTransfer.setData('text/plain', pageId);
  };
  const handleDragOver = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (pageId !== draggedPageId) setDragOverPageId(pageId);
  };
  const handleDrop = (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();
    const draggedId = draggedPageId;
    setDraggedPageId(null);
    setDragOverPageId(null);
    if (!draggedId || draggedId === targetPageId) return;
    const target = sortedPages.find(p => p.id === targetPageId);
    if (target) onInsertPage(draggedId, target.position);
  };
  const handleDragEnd = () => { setDraggedPageId(null); setDragOverPageId(null); };

  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ pageId, x: e.clientX, y: e.clientY });
  };

  const handleSubmitRename = () => {
    const trimmed = editValue.trim();
    if (editingPageId && trimmed) onUpdatePageTitle(editingPageId, trimmed);
    setEditingPageId(null);
    setEditValue('');
  };

  return (
    <aside
      className={`flex-none flex flex-col border-r border-edge-soft py-4 pb-3 ${collapsed ? 'items-center px-2' : 'px-3'} ${
        isMobile ? 'fixed inset-y-0 left-0 z-20 bg-surface-page shadow-[0_0_40px_rgba(28,27,25,0.16)] border-r border-edge' : ''
      }`}
      style={{ width: collapsed ? LAYOUT.SIDEBAR_COLLAPSED_PX : LAYOUT.SIDEBAR_WIDTH_PX }}
    >
      <div className={`flex flex-col pb-4 ${collapsed ? 'items-center' : ''}`}>
        <div className={`flex items-center font-bold text-ts-body tracking-tight ${collapsed ? 'justify-center' : 'justify-between px-2'}`}>
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded-md flex-none" style={{ background: `linear-gradient(135deg, ${chipColor(1)}, ${chipColor(0)})` }} />
            {!collapsed && <span>TileSpace</span>}
          </div>
          {!isMobile && !collapsed && (
            <button
              onClick={onToggleCollapsed}
              title={`Collapse sidebar (${TOGGLE_SHORTCUT_HINT})`}
              className="w-[26px] h-[26px] rounded-md flex-none flex items-center justify-center text-ink-faint hover:bg-black/[0.05] hover:text-ink-2"
            >
              «
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={onToggleCollapsed}
            title={`Expand sidebar (${TOGGLE_SHORTCUT_HINT})`}
            className="w-[26px] h-[26px] rounded-md flex-none flex items-center justify-center text-ink-faint hover:bg-black/[0.05] hover:text-ink-2 mt-1.5"
          >
            »
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-px">
        {sortedPages.map(page => (
          <PageRow
            key={page.id}
            page={page}
            tileCount={tileCounts[page.id] ?? 0}
            isActive={page.id === currentPageId}
            isCollapsed={collapsed}
            isDragging={draggedPageId === page.id}
            isDragOver={dragOverPageId === page.id && draggedPageId !== page.id}
            editingPageId={editingPageId}
            editValue={editValue}
            onClick={() => onPageSelect(page.id)}
            onDragStart={(e) => handleDragStart(e, page.id)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, page.id)}
            onDragLeave={() => setDragOverPageId(null)}
            onDrop={(e) => handleDrop(e, page.id)}
            onContextMenu={(e) => handleContextMenu(e, page.id)}
            onEditStart={(id, title) => { setEditingPageId(id); setEditValue(title); }}
            onEditChange={setEditValue}
            onEditSubmit={handleSubmitRename}
            onEditCancel={() => setEditingPageId(null)}
          />
        ))}
        {!collapsed && (
          <button
            onClick={onCreatePage}
            className="flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-ts-body text-ink-faint hover:text-ink-2 hover:bg-black/[0.03] text-left"
          >
            <span className="w-[11px] h-[11px] rounded-[3.5px] flex-none bg-edge-placeholder" />
            New page
          </button>
        )}
      </div>

      <div className={`flex items-center gap-2.5 pt-2.5 mt-2 border-t border-edge-soft w-full ${collapsed ? 'flex-col' : ''}`}>
        <UserMenu isCollapsed={collapsed} />
      </div>

      {contextMenu.pageId && (
        <div
          className="fixed bg-surface-card rounded-lg shadow-cardHi border border-edge py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              const page = pages.find(p => p.id === contextMenu.pageId);
              if (page) { setEditingPageId(page.id); setEditValue(page.title); }
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-2 hover:bg-black/[0.04] text-ts-body text-ink-2"
          >
            Rename
          </button>
          <button
            onClick={() => {
              if (contextMenu.pageId) setShowResetConfirm(contextMenu.pageId);
              closeContextMenu();
            }}
            className="w-full text-left px-4 py-2 hover:bg-black/[0.04] text-ts-body text-red-600"
          >
            Reset Page
          </button>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-ts-head font-medium text-gray-900 mb-2">Reset Page?</h3>
            <p className="text-gray-600 mb-4">This will delete all tiles and links on this page. This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowResetConfirm(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
              <button
                onClick={() => { if (showResetConfirm) onResetPage(showResetConfirm); setShowResetConfirm(null); }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
