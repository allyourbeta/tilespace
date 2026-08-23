import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, FileText, Check } from 'lucide-react';
import { Tile, Link } from '@/types';
import { chipColor, chipTint } from '@/lib/chipColors';
import { useIsMobile } from '@/hooks';
import { isValidUrl } from '@/utils/url';
import { PanelLinkItem } from './PanelLinkItem';
import { PanelTempLinkItem, type TempLink } from './PanelTempLinkItem';
import { PanelEmojiPicker } from './PanelEmojiPicker';
import { PanelColorPicker } from './PanelColorPicker';

interface TilePanelProps {
  tile: Tile;
  isNewTile?: boolean;
  isDocumentOpen?: boolean;
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
  tile, isNewTile = false, isDocumentOpen = false,
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
  const [showSaved, setShowSaved] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const saveAndClose = useCallback(() => {
    if (title !== tile.title) onUpdateTile(tile.id, { title });
    setShowSaved(true);
    setTimeout(() => onClose(), 600);
  }, [title, tile.title, tile.id, onUpdateTile, onClose]);

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
      // When a note/document is open on top, let it own the keyboard (Escape
      // should close the note first, not the whole panel).
      if (isDocumentOpen) return;
      if (e.key === 'Escape') {
        saveAndClose();
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        saveAndClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveAndClose, isDocumentOpen]);

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
  const accent = chipColor(tile.color_index);
  const headerTint = chipTint(tile.color_index);
  const primaryBtn = { backgroundColor: accent, color: 'white' };
  const secondaryBtn = { borderColor: accent, color: accent, backgroundColor: headerTint };

  return (
    <>
      <div className={`fixed inset-0 bg-black/30 z-40 ${isDraggingLink ? 'pointer-events-none' : ''}`} onClick={onClose} />
      <div
        data-testid="tile-panel"
        ref={panelRef}
        className={`fixed bg-surface-card shadow-cardHi z-50 flex flex-col overflow-hidden ${isMobile ? 'inset-0 rounded-none' : 'w-full max-w-md rounded-l-tile'}`}
        style={isMobile ? {} : { right: -panelPosition.x, top: Math.max(8, panelPosition.y), bottom: Math.max(8, -panelPosition.y), cursor: isDragging ? 'grabbing' : 'default' }}
      >
        {!isMobile && (
          <div onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }} className="h-6 bg-edge-soft cursor-grab active:cursor-grabbing flex items-center justify-center hover:bg-edge transition-colors" title="Drag to move panel">
            <div className="w-12 h-1 bg-ink-faint/50 rounded-full" />
          </div>
        )}

        <div className="px-4 py-3 border-b border-edge flex items-center gap-2" style={{ backgroundColor: headerTint }}>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <PanelEmojiPicker currentEmoji={tile.emoji} onSelect={(emoji) => onUpdateTile(tile.id, { emoji })} />
              <PanelColorPicker colorIndex={tile.color_index} onSelect={(idx) => onUpdateTileColor(tile.id, idx)} />
            </div>
          </div>
          <button onClick={saveAndClose} className="p-2 hover:bg-black/[0.05] rounded-lg transition-colors">
            <X className="w-5 h-5 text-ink-2" />
          </button>
        </div>

        <div className="px-4 pb-3 border-b border-edge" style={{ backgroundColor: headerTint }}>
          <input ref={titleRef} type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} onKeyDown={(e) => e.key === 'Enter' && titleRef.current?.blur()} placeholder="Tile name..." className="w-full text-xl font-semibold bg-transparent border-none outline-none text-ink placeholder-ink-faint" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {pasteFlash && <div className="mb-2 px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg text-center">Link added from clipboard</div>}
          {!hasAnyLinks ? (
            <div className="text-center py-8">
              <p className="text-ink-muted text-base font-medium mb-4">No links yet</p>
              <div className="flex gap-2 justify-center">
                <button onClick={handleAddTempLink} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm hover:opacity-90" style={primaryBtn}><Plus className="w-4 h-4" />Add Link</button>
                <button onClick={onAddNote} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm border hover:opacity-80" style={secondaryBtn}><FileText className="w-4 h-4" />Add Note</button>
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

        <div className="p-4 border-t border-edge space-y-2">
          {hasAnyLinks && (
            <div className="flex gap-2">
              <button onClick={handleAddTempLink} className="flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm hover:opacity-90" style={primaryBtn}><Plus className="w-4 h-4" />Add Link</button>
              <button onClick={onAddNote} className="flex-1 py-2 px-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm border hover:opacity-80" style={secondaryBtn}><FileText className="w-4 h-4" />Add Note</button>
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

        {/* Saved indicator */}
        {showSaved && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 animate-in fade-in duration-200">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 px-6 py-4 rounded-lg shadow-cardHi">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
              <span className="text-green-800 text-lg font-semibold">Saved</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
