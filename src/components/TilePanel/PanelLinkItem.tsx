import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Trash2, FileText, Pencil } from 'lucide-react';
import { Link } from '@/types';

interface LinkItemProps {
  link: Link;
  tileAccent: string;
  onUpdate: (id: string, updates: Partial<Link>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, linkId: string) => void;
  onDragEnd: () => void;
  onOpenDocument: (link: Link) => void;
}

const INPUT_CLASS = 'w-full px-3 py-2 bg-surface-card border border-edge rounded-[9px] text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-ink-faint';

export function PanelLinkItem({ link, tileAccent, onUpdate, onDelete, onDragStart, onDragEnd, onOpenDocument }: LinkItemProps) {
  const [title, setTitle] = useState(link.title);
  const [url, setUrl] = useState(link.url || '');
  const [summary, setSummary] = useState(link.summary);
  const [isEditing, setIsEditing] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const isDocument = link.type === 'document';

  useEffect(() => {
    setTitle(link.title);
    setUrl(link.url || '');
    setSummary(link.summary);
  }, [link.title, link.url, link.summary]);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const trimmedUrl = url.trim();
    const trimmedSummary = summary.trim();

    if (!trimmedUrl) {
      setIsEditing(false);
      setTitle(link.title);
      setUrl(link.url || '');
      setSummary(link.summary);
      return;
    }

    const hasChanges =
      trimmedTitle !== link.title ||
      trimmedUrl !== link.url ||
      trimmedSummary !== link.summary;

    if (hasChanges) {
      onUpdate(link.id, {
        title: trimmedTitle,
        url: trimmedUrl,
        summary: trimmedSummary
      });
    }
    setIsEditing(false);
  };

  const handleUrlBlur = () => {
    handleSave();
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setTitle(link.title);
      setUrl(link.url || '');
      setSummary(link.summary);
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setTitle(link.title);
      setUrl(link.url || '');
      setSummary(link.summary);
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isDocument) {
        onOpenDocument(link);
      }
    };

    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, link.id)}
        onDragEnd={onDragEnd}
        className="group flex items-center gap-2.5 py-[9px] px-[11px] rounded-[9px] hover:bg-surface-hover transition-colors cursor-grab active:cursor-grabbing"
      >
        {isDocument ? (
          <button
            onClick={handleClick}
            className="flex-1 min-w-0 text-left flex items-center gap-2.5"
          >
            <FileText className="w-[15px] h-[15px] flex-shrink-0" style={{ color: tileAccent }} />
            <span className="text-ts-body font-medium text-ink truncate">{link.title || 'Untitled'}</span>
            {link.summary && (
              <span className="text-ts-meta text-ink-muted flex-none hidden sm:inline">{link.summary}</span>
            )}
          </button>
        ) : (
          <a
            href={link.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 flex items-center gap-2.5"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-[15px] h-[15px] text-ink-faint flex-shrink-0" />
            <span className="text-ts-body font-medium text-ink truncate">{link.title || link.url}</span>
            {link.summary && (
              <span className="text-ts-meta text-ink-muted flex-none hidden sm:inline">{link.summary}</span>
            )}
          </a>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              if (isDocument) {
                onOpenDocument(link);
              } else {
                setIsEditing(true);
                setTimeout(() => titleRef.current?.focus(), 0);
              }
            }}
            title={isDocument ? 'View' : 'Edit'}
            className="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent text-ink-faint hover:bg-ink/[0.06] hover:text-ink-2 flex items-center justify-center transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(link.id)}
            title="Delete"
            className="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent text-ink-faint hover:bg-ink/[0.06] hover:text-ink-2 flex items-center justify-center transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-surface-hover border border-edge rounded-[9px] space-y-2">
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Link title"
        className={INPUT_CLASS}
      />
      <input
        type="text"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Brief note (optional)"
        className={INPUT_CLASS}
      />
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={handleUrlBlur}
        onKeyDown={handleUrlKeyDown}
        placeholder="https://..."
        className={INPUT_CLASS}
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setTitle(link.title);
            setUrl(link.url || '');
            setSummary(link.summary);
            setIsEditing(false);
          }}
          className="py-2 px-4 text-ink-2 hover:bg-ink/[0.06] rounded-[9px] transition-colors text-ts-body"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
