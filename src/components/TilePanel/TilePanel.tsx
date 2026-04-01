import { useState, useRef, useEffect } from 'react';
import { X, Plus, FileText } from 'lucide-react';
import { Tile, Link, getPalette } from '@/types';
import { getButtonStyles } from '@/utils';
import { useIsMobile } from '@/hooks';
import { isValidUrl } from '@/utils/url';
import { PanelLinkItem } from './PanelLinkItem';
import { PanelTempLinkItem, type TempLink } from './PanelTempLinkItem';
import { PanelEmojiPicker } from './PanelEmojiPicker';
import { PanelColorPicker } from './PanelColorPicker';

interface TilePanelProps {
  tile: Tile;
  currentPaletteId: string;
  isNewTile?: boolean;
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

export function TilePanel({
  tile, currentPaletteId, isNewTile = false,
  onClose, onUpdateTile, onUpdateTileColor, onResetTile,
  onCreateLink, onUpdateLink, onDeleteLink, onOpenDocument, onAddNote,
}: TilePanelProps) {
  const [title, setTitle] = useState(tile.title);
  const [tempLinks, setTempLinks] = useState<TempLink[]>([]);
  const [pasteFlash, setPasteFlash] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDraggingLink, setIsDraggingLink] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const palette = getPalette(currentPaletteId);

  useEffect(() => { setTitle(tile.title); }, [tile.title]);
  useEffect(() => { if (isNewTile && titleRef.current) { titleRef.current.focus(); titleRef.current.select(); } }, [isNewTile]);
  useEffect(() => { setPanelPosition({ x: 0, y: 0 }); }, [tile.id]);

  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const tag = (document.activeElement?.tagName || '').toLowerCase();
      const isEditable = tag === 'input' || tag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable;
      if (isEditable) return;
      const text = e.clipboardData?.getData('text/plain')?.trim();
      if (!text) return;
      const urlCandidate = (!text.startsWith('http://') && !text.startsWith('https://')) ? `https://${text}` : text;
      if (!isValidUrl(urlCandidate)) return;
      e.preventDefault();
      try {
        await onCreateLink(tile.id, { title: urlCandidate, url: urlCandidate, summary: '' });
        setPasteFlash(true);
        setTimeout(() => setPasteFlash(false), 1500);
      } catch (err) { console.error('Auto-link paste failed:', err); }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [tile.id, onCreateLink]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (title !== tile.title) onUpdateTile(tile.id, { title });
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, title, tile.title, tile.id, onUpdateTile]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPanelPosition(prev => ({ x: prev.x + e.clientX - dragStart.x, y: prev.y + e.clientY - dragStart.y }));
      setDragStart({ x: e.clientX, y: e.clientY });
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging, dragStart]);

  const handleTitleBlur = () => { if (title !== tile.title) onUpdateTile(tile.id, { title }); };

  const handleAddTempLink = () => {
    setTempLinks(prev => [...prev, { tempId: `temp-${Date.now()}`, title: '', url: '', summary: '' }]);
  };

  const handleTempLinkChange = (tempId: string, field: keyof Omit<TempLink, 'tempId'>, value: string) => {
    setTempLinks(prev => prev.map(tl => tl.tempId === tempId ? { ...tl, [field]: value } : tl));
  };

  const handleTempLinkBlur = async (tempLink: TempLink) => {
    if (tempLink.title.trim() || tempLink.url.trim()) {
      try {
        await onCreateLink(tile.id, { title: tempLink.title.trim(), url: tempLink.url.trim(), summary: tempLink.summary.trim() });
        setTempLinks(prev => prev.filter(tl => tl.tempId !== tempLink.tempId));
      } catch (err) { console.error('Failed to create link:', err); }
    }
  };

  const realLinks = tile.links || [];
  const hasAnyLinks = realLinks.length > 0 || tempLinks.length > 0;
  const btnStyles = getButtonStyles(tile.accent_color);

  return (
    <>
      <div className={`fixed inset-0 bg-black/30 z-40 ${isDraggingLink ? 'pointer-events-none' : ''}`} onClick={onClose} />
      <div
        data-testid="tile-panel"
        ref={panelRef}
        className={`fixed bg-white shadow-2xl z-50 flex flex-col overflow-hidden ${isMobile ? 'inset-0 rounded-none' : 'w-full max-w-md rounded-l-2xl'}`}
        style={isMobile ? {} : { right: -panelPosition.x, top: Math.max(8, panelPosition.y), bottom: Math.max(8, -panelPosition.y), cursor: isDragging ? 'grabbing' : 'default' }}
      >
        {!isMobile && (
          <div onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }} className="h-6 bg-gray-100 cursor-grab active:cursor-grabbing flex items-center justify-center hover:bg-gray-200 transition-colors" title="Drag to move panel">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2" style={{ backgroundColor: tile.accent_color + '15' }}>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <PanelEmojiPicker currentEmoji={tile.emoji} onSelect={(emoji) => onUpdateTile(tile.id, { emoji })} />
              <PanelColorPicker accentColor={tile.accent_color} colorIndex={tile.color_index} palette={palette} onSelect={(idx) => onUpdateTileColor(tile.id, idx)} />
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="px-4 pb-3 border-b border-gray-100" style={{ backgroundColor: tile.accent_color + '15' }}>
          <input ref={titleRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} onKeyDown={(e) => e.key === 'Enter' && titleRef.current?.blur()} placeholder="Tile name..." className="w-full text-xl font-semibold bg-transparent border-none outline-none text-gray-800 placeholder-gray-400" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {pasteFlash && <div className="mb-2 px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg text-center">Link added from clipboard</div>}
          {!hasAnyLinks ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-base font-medium mb-4">No links yet</p>
              <div className="flex gap-2 justify-center">
                <button onClick={handleAddTempLink} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm hover:opacity-90" style={btnStyles.primary}><Plus className="w-4 h-4" />Add Link</button>
                <button onClick={onAddNote} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm border-2 hover:opacity-80" style={btnStyles.secondary}><FileText className="w-4 h-4" />Add Note</button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {realLinks.map((link) => (
                <PanelLinkItem key={link.id} link={link} onUpdate={onUpdateLink} onDelete={onDeleteLink} onDragStart={(e, id) => { e.dataTransfer.setData('application/link-id', id); e.dataTransfer.effectAllowed = 'move'; setIsDraggingLink(true); }} onDragEnd={() => setIsDraggingLink(false)} onOpenDocument={onOpenDocument} />
              ))}
              {tempLinks.map((tl) => (
                <PanelTempLinkItem key={tl.tempId} tempLink={tl} onChange={handleTempLinkChange} onBlur={handleTempLinkBlur} onRemove={(id) => setTempLinks(prev => prev.filter(t => t.tempId !== id))} />
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 space-y-2">
          {hasAnyLinks && (
            <div className="flex gap-2">
              <button onClick={handleAddTempLink} className="flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm hover:opacity-90" style={btnStyles.primary}><Plus className="w-4 h-4" />Add Link</button>
              <button onClick={onAddNote} className="flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm border-2 hover:opacity-80" style={btnStyles.secondary}><FileText className="w-4 h-4" />Add Note</button>
            </div>
          )}
          <button
            onClick={() => {
              const hasLinks = (tile.links?.length || 0) > 0;
              if (hasLinks) { if (confirm('This tile has links that will be permanently deleted.')) { if (confirm('Are you sure you want to delete this tile?')) onResetTile(tile.id); } }
              else { if (confirm('Delete this tile?')) onResetTile(tile.id); }
            }}
            className="w-full py-2.5 px-4 text-white font-semibold bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            Delete Tile
          </button>
        </div>
      </div>
    </>
  );
}
