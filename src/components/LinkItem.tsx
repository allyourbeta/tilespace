import { useState, useRef, useEffect } from 'react';
import { ExternalLink, Trash2, FileText } from 'lucide-react';
import type { Link } from '@/types';

interface LinkItemProps {
  link: Link;
  onUpdate: (id: string, updates: Partial<Link>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, linkId: string) => void;
  onDragEnd: () => void;
  onOpenDocument: (link: Link) => void;
}

export function LinkItem({
  link,
  onUpdate,
  onDelete,
  onDragStart,
  onDragEnd,
  onOpenDocument,
}: LinkItemProps) {
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
        summary: trimmedSummary,
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
        className="group flex items-center gap-3 py-2.5 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-grab active:cursor-grabbing"
      >
        {isDocument ? (
          <button
            onClick={handleClick}
            className="flex-1 min-w-0 text-left flex items-center gap-2"
          >
            <FileText className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span className="text-gray-900 text-base font-medium truncate">
              {link.title || 'Untitled'}
            </span>
            {link.summary && (
              <span className="text-sm text-gray-500 truncate hidden sm:inline">
                · {link.summary}
              </span>
            )}
          </button>
        ) : (
          <a
            href={link.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-0 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-900 text-base font-medium truncate">
              {link.title || link.url}
            </span>
            {link.summary && (
              <span className="text-sm text-gray-500 truncate hidden sm:inline">
                · {link.summary}
              </span>
            )}
          </a>
        )}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => {
              if (isDocument) {
                onOpenDocument(link);
              } else {
                setIsEditing(true);
                setTimeout(() => titleRef.current?.focus(), 0);
              }
            }}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600 font-medium text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(link.id)}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 rounded-xl space-y-3">
      <input
        ref={titleRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Link title"
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      <input
        type="text"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Brief note (optional)"
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onBlur={handleUrlBlur}
        onKeyDown={handleUrlKeyDown}
        placeholder="https://..."
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setTitle(link.title);
            setUrl(link.url || '');
            setSummary(link.summary);
            setIsEditing(false);
          }}
          className="py-2 px-4 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
