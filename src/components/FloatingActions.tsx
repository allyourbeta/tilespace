import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Link as LinkIcon, FileText } from 'lucide-react';
import { Tile, Link } from '@/types';
import { PaletteSelector } from './PaletteSelector';
import { TileSubmenu } from './TileSubmenu';
import { useIsMobile } from '@/hooks';

interface FloatingActionsProps {
  onAddTile: () => void;
  onPasteLink: () => void;
  onAddNote: () => void;
  canAddTile: boolean;
  currentPaletteId: string;
  onSelectPalette: (paletteId: string) => void;
  tiles: Tile[];
  onCreateLink: (tileId: string, data: { title: string; url: string; summary: string }) => Promise<Link>;
  onSelectTile: (tileId: string) => void;
}

const CLOSE_GRACE_MS = 200;

export function FloatingActions({
  onAddTile, onPasteLink, onAddNote, canAddTile,
  currentPaletteId, onSelectPalette,
  tiles, onCreateLink, onSelectTile,
}: FloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showTileSubmenu, setShowTileSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const submenuTimerRef = useRef<number | null>(null);
  const isMobile = useIsMobile();

  const cancelCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const cancelSubmenuTimer = useCallback(() => {
    if (submenuTimerRef.current) {
      clearTimeout(submenuTimerRef.current);
      submenuTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelCloseTimer();
      cancelSubmenuTimer();
    };
  }, [cancelCloseTimer, cancelSubmenuTimer]);

  useEffect(() => {
    if (!isMobile || !isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowTileSubmenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile]);

  const closeAll = () => {
    setIsOpen(false);
    setShowTileSubmenu(false);
    cancelCloseTimer();
    cancelSubmenuTimer();
  };

  const handleMouseEnterContainer = () => {
    if (isMobile) return;
    cancelCloseTimer();
    setIsOpen(true);
  };

  const handleMouseLeaveContainer = () => {
    if (isMobile) return;
    cancelCloseTimer();
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setShowTileSubmenu(false);
    }, CLOSE_GRACE_MS);
  };

  const handleAddLinkRowEnter = () => {
    if (isMobile) return;
    cancelSubmenuTimer();
    if (tiles.length > 0) {
      setShowTileSubmenu(true);
    }
  };

  const handleAddLinkRowLeave = () => {
    if (isMobile) return;
    cancelSubmenuTimer();
    submenuTimerRef.current = window.setTimeout(() => {
      setShowTileSubmenu(false);
    }, CLOSE_GRACE_MS);
  };

  const handleSubmenuEnter = () => {
    cancelSubmenuTimer();
    cancelCloseTimer();
  };

  const handleSubmenuLeave = () => {
    cancelSubmenuTimer();
    submenuTimerRef.current = window.setTimeout(() => {
      setShowTileSubmenu(false);
    }, CLOSE_GRACE_MS);
  };

  const handleAddTile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    onAddTile();
    closeAll();
  };

  const handlePasteLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    if (isMobile || tiles.length === 0) {
      onPasteLink();
      closeAll();
    }
  };

  const handleAddNote = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    onAddNote();
    closeAll();
  };

  return (
    <div className="flex items-end gap-2">
      <div
        ref={menuRef}
        className="relative z-10"
        onMouseEnter={handleMouseEnterContainer}
        onMouseLeave={handleMouseLeaveContainer}
      >
        <div
          className={`
            absolute bottom-full left-0 mb-2
            transition-all duration-200 ease-out origin-bottom-left
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
          `}
        >
          <div data-testid="floating-actions-menu" className="bg-surface-card rounded-lg shadow-cardHi border border-edge overflow-visible min-w-[180px]">
            {canAddTile && (
              <button
                type="button"
                onClick={handleAddTile}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Plus className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-medium text-gray-700">Add New Tile</span>
              </button>
            )}
            <div
              className="relative"
              onMouseEnter={handleAddLinkRowEnter}
              onMouseLeave={handleAddLinkRowLeave}
            >
              <button
                type="button"
                data-testid="add-link-button"
                onClick={handlePasteLink}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${canAddTile ? 'border-t border-gray-100' : ''}`}
              >
                <div className="p-1.5 bg-sky-100 rounded-lg">
                  <LinkIcon className="w-4 h-4 text-sky-600" />
                </div>
                <span className="font-medium text-gray-700">Add Link</span>
              </button>
              {showTileSubmenu && !isMobile && (
                <div
                  onMouseEnter={handleSubmenuEnter}
                  onMouseLeave={handleSubmenuLeave}
                >
                  <TileSubmenu
                    tiles={tiles}
                    onCreateLink={onCreateLink}
                    onSelectTile={onSelectTile}
                    onClose={closeAll}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddNote}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
            >
              <div className="p-1.5 bg-teal-100 rounded-lg">
                <FileText className="w-4 h-4 text-teal-600" />
              </div>
              <span className="font-medium text-gray-700">Add Note</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => { if (isMobile) setIsOpen(!isOpen); }}
          className={`
            h-[34px] min-w-[34px] px-2.5 rounded-lg bg-surface-card border border-edge shadow-card
            hover:border-edge-hover transition-colors duration-150
            flex items-center justify-center
            ${isOpen ? 'text-ink' : 'text-ink-2'}
          `}
          title="Actions"
        >
          {isOpen ? (
            <X className="w-[18px] h-[18px]" />
          ) : (
            <Plus className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>

      <PaletteSelector
        currentPaletteId={currentPaletteId}
        onSelectPalette={onSelectPalette}
      />
    </div>
  );
}
