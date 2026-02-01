import { useState, useRef, useEffect } from 'react';
import { X, Plus, ExternalLink, Trash2, FileText } from 'lucide-react';
import { Tile, Link, EMOJI_CATEGORIES, getPalette } from '../types';

interface TilePanelProps {
  tile: Tile;
  currentPaletteId: string;
  onClose: () => void;
  onUpdateTile: (id: string, updates: Partial<Tile>) => void;
  onUpdateTileColor: (id: string, colorIndex: number) => void;
  onResetTile: (id: string) => void;
  onCreateLink: (tileId: string, data: { title: string; url: string; summary: string }) => Promise<Link>;
  onUpdateLink: (id: string, updates: Partial<Link>) => void;
  onDeleteLink: (id: string) => void;
  onOpenDocument: (link: Link) => void;
  onAddNote: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  nature: 'Nature',
  animals: 'Animals',
  objects: 'Objects',
  food: 'Food',
  symbols: 'Symbols',
};

interface TempLink {
  tempId: string;
  title: string;
  url: string;
  summary: string;
}

export function TilePanel({
  tile,
  currentPaletteId,
  onClose,
  onUpdateTile,
  onUpdateTileColor,
  onResetTile,
  onCreateLink,
  onUpdateLink,
  onDeleteLink,
  onOpenDocument,
  onAddNote
}: TilePanelProps) {
  const [title, setTitle] = useState(tile.title);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState<keyof typeof EMOJI_CATEGORIES>('nature');
  const [tempLinks, setTempLinks] = useState<TempLink[]>([]);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const titleRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const palette = getPalette(currentPaletteId);

  useEffect(() => {
    setTitle(tile.title);
  }, [tile.title]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    if (showEmojiPicker || showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, showColorPicker]);

  // Reset position when tile changes
  useEffect(() => {
    setPanelPosition({ x: 0, y: 0 });
  }, [tile.id]);

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      setPanelPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setDragStart({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleTitleBlur = () => {
    if (title !== tile.title) {
      onUpdateTile(tile.id, { title });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    onUpdateTile(tile.id, { emoji });
    setShowEmojiPicker(false);
  };

  const handleColorSelect = (colorIndex: number) => {
    onUpdateTileColor(tile.id, colorIndex);
    setShowColorPicker(false);
  };

  const handleAddTempLink = () => {
    const newTempLink: TempLink = {
      tempId: `temp-${Date.now()}`,
      title: '',
      url: '',
      summary: ''
    };
    setTempLinks([...tempLinks, newTempLink]);
  };

  const handleTempLinkChange = (tempId: string, field: keyof Omit<TempLink, 'tempId'>, value: string) => {
    setTempLinks(tempLinks.map(tl =>
      tl.tempId === tempId ? { ...tl, [field]: value } : tl
    ));
  };

  const handleTempLinkBlur = async (tempLink: TempLink) => {
    const hasContent = tempLink.title.trim() || tempLink.url.trim();
    if (hasContent) {
      try {
        await onCreateLink(tile.id, {
          title: tempLink.title.trim(),
          url: tempLink.url.trim(),
          summary: tempLink.summary.trim()
        });
        setTempLinks(tempLinks.filter(tl => tl.tempId !== tempLink.tempId));
      } catch (err) {
        console.error('Failed to create link:', err);
      }
    }
  };

  const handleRemoveTempLink = (tempId: string) => {
    setTempLinks(tempLinks.filter(tl => tl.tempId !== tempId));
  };

  const realLinks = tile.links || [];
  const allLinksCount = realLinks.length;
  const hasAnyLinks = allLinksCount > 0 || tempLinks.length > 0;

  const [isDraggingLink, setIsDraggingLink] = useState(false);

  const handleLinkDragStart = (e: React.DragEvent, linkId: string) => {
    e.dataTransfer.setData('application/link-id', linkId);
    e.dataTransfer.effectAllowed = 'move';
    setIsDraggingLink(true);
  };

  const handleLinkDragEnd = () => {
    setIsDraggingLink(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-40 ${isDraggingLink ? 'pointer-events-none' : ''}`}
        onClick={onClose}
      />
      <div 
        ref={panelRef}
        className="fixed w-full max-w-md bg-white shadow-2xl z-50 flex flex-col rounded-l-2xl overflow-hidden"
        style={{
          right: -panelPosition.x,
          top: Math.max(8, panelPosition.y),
          bottom: Math.max(8, -panelPosition.y),
          cursor: isDragging ? 'grabbing' : 'default'
        }}
      >
        {/* Drag handle bar */}
        <div
          onMouseDown={handleDragStart}
          className="h-6 bg-gray-100 cursor-grab active:cursor-grabbing flex items-center justify-center hover:bg-gray-200 transition-colors"
          title="Drag to move panel"
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        <div
          className="px-4 py-3 border-b border-gray-100 flex items-center gap-2"
          style={{ backgroundColor: tile.accent_color + '15' }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="relative" ref={emojiPickerRef}>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-4xl hover:scale-110 transition-transform cursor-pointer"
                  title="Change emoji"
                >
                  {tile.emoji || '🌿'}
                </button>

                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-10 w-72 overflow-hidden">
                    <div className="flex border-b border-gray-100">
                      {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setEmojiCategory(cat as keyof typeof EMOJI_CATEGORIES)}
                          className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                            emojiCategory === cat
                              ? 'text-gray-900 bg-gray-50'
                              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                          }`}
                        >
                          {CATEGORY_LABELS[cat]}
                        </button>
                      ))}
                    </div>
                    <div className="p-3 grid grid-cols-8 gap-1">
                      {EMOJI_CATEGORIES[emojiCategory].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className={`text-xl p-1.5 rounded-lg transition-all hover:bg-gray-100 hover:scale-110 ${
                            tile.emoji === emoji ? 'bg-gray-100 ring-2 ring-gray-300' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" ref={colorPickerRef}>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="w-8 h-8 rounded-lg shadow-md border-2 border-white hover:scale-110 transition-transform"
                  style={{ backgroundColor: tile.accent_color }}
                  title="Change color"
                />

                {showColorPicker && (
                  <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-10 p-3 w-52">
                    <p className="text-xs font-medium text-gray-500 mb-2">{palette.name} palette</p>
                    <div className="grid grid-cols-4 gap-2">
                      {palette.colors.map((color, index) => (
                        <button
                          key={index}
                          onClick={() => handleColorSelect(index)}
                          className={`w-10 h-10 rounded-lg shadow-sm transition-transform hover:scale-110 ${
                            tile.color_index === index ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div 
          className="px-4 pb-3 border-b border-gray-100"
          style={{ backgroundColor: tile.accent_color + '15' }}
        >
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && titleRef.current?.blur()}
            placeholder="Tile name..."
            className="w-full text-xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!hasAnyLinks ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No links yet</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleAddTempLink}
                  className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-all text-sm hover:opacity-90"
                  style={{ backgroundColor: tile.accent_color }}
                >
                  <Plus className="w-4 h-4" />
                  Add Link
                </button>
                <button
                  onClick={onAddNote}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm border-2 hover:opacity-80"
                  style={{ 
                    borderColor: tile.accent_color, 
                    color: tile.accent_color,
                    backgroundColor: tile.accent_color + '10'
                  }}
                >
                  <FileText className="w-4 h-4" />
                  Add Note
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {realLinks.map((link) => (
                <LinkItem
                  key={link.id}
                  link={link}
                  onUpdate={onUpdateLink}
                  onDelete={onDeleteLink}
                  onDragStart={handleLinkDragStart}
                  onDragEnd={handleLinkDragEnd}
                  onOpenDocument={onOpenDocument}
                />
              ))}
              {tempLinks.map((tempLink) => (
                <TempLinkItem
                  key={tempLink.tempId}
                  tempLink={tempLink}
                  onChange={handleTempLinkChange}
                  onBlur={handleTempLinkBlur}
                  onRemove={handleRemoveTempLink}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-2">
          {hasAnyLinks && (
            <div className="flex gap-2">
              <button
                onClick={handleAddTempLink}
                className="flex-1 py-2 px-3 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm hover:opacity-90"
                style={{ backgroundColor: tile.accent_color }}
              >
                <Plus className="w-4 h-4" />
                Add Link
              </button>
              <button
                onClick={onAddNote}
                className="flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm border-2 hover:opacity-80"
                style={{ 
                  borderColor: tile.accent_color, 
                  color: tile.accent_color,
                  backgroundColor: tile.accent_color + '10'
                }}
              >
                <FileText className="w-4 h-4" />
                Add Note
              </button>
            </div>
          )}
          <button
            onClick={() => {
              const hasLinks = (tile.links?.length || 0) > 0;
              if (hasLinks) {
                if (confirm('This tile has links that will be permanently deleted.')) {
                  if (confirm('Are you very, very sure?')) {
                    onResetTile(tile.id);
                  }
                }
              } else {
                if (confirm('Reset this tile?')) {
                  onResetTile(tile.id);
                }
              }
            }}
            className="w-full py-2 px-4 text-red-500 hover:bg-red-50 rounded-lg text-sm transition-colors"
          >
            Reset Tile
          </button>
        </div>
      </div>
    </>
  );
}

interface LinkItemProps {
  link: Link;
  onUpdate: (id: string, updates: Partial<Link>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, linkId: string) => void;
  onDragEnd: () => void;
  onOpenDocument: (link: Link) => void;
}

function LinkItem({ link, onUpdate, onDelete, onDragStart, onDragEnd, onOpenDocument }: LinkItemProps) {
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
        className="group flex items-center gap-2 py-1.5 px-2.5 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-grab active:cursor-grabbing"
      >
        {isDocument ? (
          <button
            onClick={handleClick}
            className="flex-1 min-w-0 text-left flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
            <span className="text-gray-800 text-sm truncate">{link.title || 'Untitled'}</span>
            {link.summary && (
              <span className="text-xs text-gray-400 truncate hidden sm:inline">· {link.summary}</span>
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
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="text-gray-800 text-sm truncate">{link.title || link.url}</span>
            {link.summary && (
              <span className="text-xs text-gray-400 truncate hidden sm:inline">· {link.summary}</span>
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
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-500"
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

interface TempLinkItemProps {
  tempLink: TempLink;
  onChange: (tempId: string, field: keyof Omit<TempLink, 'tempId'>, value: string) => void;
  onBlur: (tempLink: TempLink) => void;
  onRemove: (tempId: string) => void;
}

function TempLinkItem({ tempLink, onChange, onBlur, onRemove }: TempLinkItemProps) {
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleUrlBlur = () => {
    onBlur(tempLink);
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      onBlur(tempLink);
    }
  };

  return (
    <div className="p-4 bg-amber-50 rounded-xl space-y-3 border border-amber-200">
      <input
        ref={titleRef}
        type="text"
        value={tempLink.title}
        onChange={(e) => onChange(tempLink.tempId, 'title', e.target.value)}
        placeholder="Link title"
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <input
        type="text"
        value={tempLink.summary}
        onChange={(e) => onChange(tempLink.tempId, 'summary', e.target.value)}
        placeholder="Brief note (optional)"
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <input
        type="url"
        value={tempLink.url}
        onChange={(e) => onChange(tempLink.tempId, 'url', e.target.value)}
        onBlur={handleUrlBlur}
        onKeyDown={handleUrlKeyDown}
        placeholder="https://..."
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <p className="text-xs text-amber-600">Enter URL and press Tab or Enter to save</p>
      <div className="flex justify-end">
        <button
          onClick={() => onRemove(tempLink.tempId)}
          className="py-2 px-4 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
