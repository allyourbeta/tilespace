import { getPalette } from '@/types';
import type { Page } from '@/types';

interface PageRowProps {
  page: Page;
  tileCount: number;
  isActive: boolean;
  isCollapsed: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  editingPageId: string | null;
  editValue: string;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onEditStart: (pageId: string, title: string) => void;
  onEditChange: (value: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
}

export function PageRow({
  page, tileCount, isActive, isCollapsed, isDragging, isDragOver,
  editingPageId, editValue,
  onClick, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop,
  onContextMenu, onEditStart, onEditChange, onEditSubmit, onEditCancel,
}: PageRowProps) {
  const bg = getPalette(page.palette_id).background;
  const isEditing = editingPageId === page.id;

  if (isCollapsed) {
    return (
      <div
        role="button"
        title={page.title}
        draggable
        onClick={onClick}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onContextMenu={onContextMenu}
        className={`flex items-center justify-center w-10 py-2 rounded-lg cursor-pointer ${isDragOver ? 'ring-1 ring-ink-faint' : ''}`}
      >
        <span className="w-[15px] h-[15px] rounded-[4.5px] flex-none" style={{ background: bg }} />
      </div>
    );
  }

  return (
    <div
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onContextMenu={onContextMenu}
      className={`group relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg cursor-pointer text-ts-body transition-colors ${
        isActive ? 'text-ink font-semibold' : 'text-ink-2 hover:bg-black/[0.04]'
      } ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'ring-1 ring-ink-faint' : ''}`}
      style={isActive ? { background: `${bg}14` } : undefined}
    >
      <span className="absolute -left-px w-2.5 text-ts-meta leading-none text-ink-grip opacity-0 group-hover:opacity-100 cursor-grab">⠿</span>
      <span className="w-[11px] h-[11px] rounded-[3.5px] flex-none" style={{ background: bg }} />
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          maxLength={75}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onEditChange(e.target.value)}
          onBlur={onEditSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onEditSubmit();
            if (e.key === 'Escape') onEditCancel();
          }}
          className="flex-1 min-w-0 bg-white text-ink text-ts-body rounded border border-edge px-1 -mx-1 outline-none"
        />
      ) : (
        <span
          className="flex-1 min-w-0 truncate"
          onDoubleClick={(e) => { e.stopPropagation(); onEditStart(page.id, page.title); }}
        >
          {page.title}
        </span>
      )}
      {!isEditing && (
        <span className="text-ts-meta text-ink-faint tabular-nums">{tileCount}</span>
      )}
    </div>
  );
}
