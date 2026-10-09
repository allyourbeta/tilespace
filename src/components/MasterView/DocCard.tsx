import type { MasterViewDoc } from '@/types/masterView';

interface DocCardProps {
  doc: MasterViewDoc;
  reason?: string;
  onOpen: () => void;
  onHide?: () => void;
  onRestore?: () => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function DocCard({ doc, reason, onOpen, onHide, onRestore }: DocCardProps) {
  return (
    <div
      role="button"
      onClick={onOpen}
      className="group bg-surface-card border border-edge rounded-tile shadow-card hover:shadow-cardHi hover:-translate-y-px hover:border-edge-tilehover transition-all duration-150 p-4 flex flex-col min-h-[150px] cursor-pointer text-left"
    >
      {doc.pageTitle && (
        <div className="flex items-center gap-[7px] text-ts-meta text-ink-muted">
          <span className="w-[9px] h-[9px] rounded-[3px] flex-none" style={{ background: doc.pageSwatch }} />
          <span className="truncate">{doc.pageTitle}</span>
        </div>
      )}
      <p className="flex-1 text-ts-tile font-semibold text-ink leading-snug line-clamp-2 mt-2.5 mb-3">
        {doc.title || 'Untitled'}
      </p>
      {reason && <p className="text-ts-meta text-ink-muted italic line-clamp-2 mb-2">{reason}</p>}
      <div className="flex items-center justify-between text-ts-meta text-ink-muted pt-2.5 border-t border-edge">
        <span>{formatDate(doc.createdAt)}</span>
        {onHide && (
          <button
            onClick={(e) => { e.stopPropagation(); onHide(); }}
            className="opacity-0 group-hover:opacity-100 hover:text-ink font-medium transition-opacity"
          >
            Hide
          </button>
        )}
        {onRestore && (
          <button
            onClick={(e) => { e.stopPropagation(); onRestore(); }}
            className="hover:text-ink font-medium"
          >
            Restore
          </button>
        )}
      </div>
    </div>
  );
}
