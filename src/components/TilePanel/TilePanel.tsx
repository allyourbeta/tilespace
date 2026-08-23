import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Plus, FileText } from 'lucide-react';
import { Tile, Link } from '@/types';
import { chipColor } from '@/lib/chipColors';
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

const BTN_BASE = 'inline-flex items-center justify-center gap-[7px] h-9 px-3.5 rounded-[9px] border text-sm font-medium shadow-card transition-[border-color,color,filter] duration-150';
const BTN_SECONDARY = `${BTN_BASE} border-edge bg-surface-card text-ink-2 hover:border-edge-hover hover:text-ink`;
const BTN_PRIMARY = `${BTN_BASE} text-white hover:brightness-[.94] hover:text-white`;

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
  const titleRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const saveAndClose = useCallback(() => {
    if (title !== tile.title) onUpdateTile(tile.id, { title });
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
  const primaryBtnStyle = { backgroundColor: accent, borderColor: accent };

  return (
    <>
      <div className={`fixed inset-0 bg-ink/20 z-40 ${isDraggingLink ? 'pointer-events-none' : ''}`} onClick={onClose} />
      <div
        data-testid="tile-panel"
        ref={panelRef}
        className={`fixed bg-surface-card shadow-[-16px_0_48px_rgba(28,27,25,.13)] z-50 flex flex-col overflow-hidden ${isMobile ? 'inset-0 rounded-none' : 'w-full max-w-md rounded-l-[14px] border border-edge border-r-0'}`}
        style={isMobile ? {} : { right: -panelPosition.x, top: Math.max(10, panelPosition.y), bottom: Math.max(10, -panelPosition.y), cursor: isDragging ? 'grabbing' : 'default' }}
      >
        {!isMobile && (
          <div onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); setDragStart({ x: e.clientX, y: e.clientY }); }} className="h-[22px] flex-none flex items-center justify-center cursor-grab active:cursor-grabbing">
            <div className="w-[34px] h-[3px] rounded-[2px] bg-edge-grip" />
          </div>
        )}

        <div className="px-[18px] pt-0.5 pb-4 flex-none">
          <div className="flex items-center gap-[9px] mb-3">
            <PanelEmojiPicker currentEmoji={tile.emoji} onSelect={(emoji) => onUpdateTile(tile.id, { emoji })} />
            <PanelColorPicker colorIndex={tile.color_index} onSelect={(idx) => onUpdateTileColor(tile.id, idx)} />
            <span className="flex-1" />
            <button
              onClick={saveAndClose}
              title="Close"
              className="w-[30px] h-[30px] rounded-lg border-none bg-transparent text-ink-muted hover:bg-ink/5 hover:text-ink-2 flex items-center justify-center transition-colors"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && titleRef.current?.blur()}
            placeholder="Tile name..."
            className="w-full border-none outline-none bg-transparent p-0 text-[1.375rem] font-bold tracking-[-.022em] text-ink placeholder-ink-faint"
          />
        </div>

        <div className="h-px bg-edge-soft flex-none" />

        <div className="flex-1 min-h-0 overflow-y-auto p-3.5">
          {pasteFlash && <div className="mb-2 px-3 py-2 bg-surface-hover text-ink-2 text-sm font-medium rounded-lg text-center">Link added from clipboard</div>}
          {!hasAnyLinks ? (
            <div className="text-center py-11 px-5">
              <p className="text-[.9375rem] text-ink-muted mb-[18px]">No links yet</p>
              <div className="flex gap-2 justify-center">
                <button onClick={handleAddTempLink} className={BTN_PRIMARY} style={primaryBtnStyle}><Plus className="w-4 h-4" />Add Link</button>
                <button onClick={onAddNote} className={BTN_SECONDARY}><FileText className="w-4 h-4" />Add Note</button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {realLinks.map((link) => (
                <PanelLinkItem key={link.id} link={link} tileAccent={accent} onUpdate={onUpdateLink} onDelete={onDeleteLink} onDragStart={(e, id) => { e.dataTransfer.setData('application/link-id', id); e.dataTransfer.effectAllowed = 'move'; setIsDraggingLink(true); }} onDragEnd={() => setIsDraggingLink(false)} onOpenDocument={onOpenDocument} />
              ))}
              {tempLinks.map((tl) => (
                <PanelTempLinkItem key={tl.tempId} tempLink={tl} onChange={handleTempLinkChange} onBlur={handleTempLinkBlur} onRemove={(id) => setTempLinks(prev => prev.filter(t => t.tempId !== id))} />
              ))}
            </div>
          )}
        </div>

        <div className="flex-none px-3.5 py-3 border-t border-edge-soft">
          {hasAnyLinks && (
            <div className="flex gap-2">
              <button onClick={handleAddTempLink} className={`flex-1 ${BTN_PRIMARY}`} style={primaryBtnStyle}><Plus className="w-4 h-4" />Add Link</button>
              <button onClick={onAddNote} className={`flex-1 ${BTN_SECONDARY}`}><FileText className="w-4 h-4" />Add Note</button>
            </div>
          )}
          <div className="mt-2.5 text-center">
            <button
              onClick={() => {
                const hasLinks = (tile.links?.length || 0) > 0;
                if (hasLinks) { if (confirm('This tile has links that will be permanently deleted.')) { if (confirm('Are you sure you want to delete this tile?')) onResetTile(tile.id); } }
                else { if (confirm('Delete this tile?')) onResetTile(tile.id); }
              }}
              className="border-none bg-transparent text-[.8125rem] text-ink-muted px-[9px] py-[5px] rounded-[7px] hover:text-danger hover:bg-danger-tint transition-colors"
            >
              Delete tile
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
