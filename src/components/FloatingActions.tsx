import { useState, useRef, useEffect, useCallback } from 'react';
import { Plus, X, Link as LinkIcon, FileText, Grid3x3 } from 'lucide-react';
import { Tile, Link } from '../types';
import { PaletteSelector } from './PaletteSelector';
import { TileSubmenu } from './TileSubmenu';
import { useIsMobile } from '../hooks';

interface FloatingActionsProps {
  onAddTile: () => void;
  onPasteLink: () => void;
  onAddNote: () => void;
  canAddTile: boolean;
  currentPaletteId: string;
  onSelectPalette: (paletteId: string) => void;
  onShowOverview?: () => void;
  tiles: Tile[];
  onCreateLink: (tileId: string, data: { title: string; url: string; summary: string }) => Promise<Link>;
  onSelectTile: (tileId: string) => void;
}

const CLOSE_GRACE_MS = 200;

export function FloatingActions({
  onAddTile, onPasteLink, onAddNote, canAddTile,
  currentPaletteId, onSelectPalette, onShowOverview,
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
    <div className="fixed bottom-4 left-4 z-40 flex items-end gap-2">
      <div
        ref={menuRef}
        className="relative"
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
          <div data-testid="floating-actions-menu" className="bg-white rounded-xl shadow-2xl border border-gray-100 border-white/10 overflow-visible min-w-[180px]">
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
            p-3.5 rounded-full shadow-lg hover:shadow-xl
            transition-all duration-200 ease-out hover:scale-105 hover:-translate-y-0.5
            ${isOpen
              ? 'bg-gray-900 text-white'
              : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white'
            }
          `}
          title="Actions"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>

      <PaletteSelector
        currentPaletteId={currentPaletteId}
        onSelectPalette={onSelectPalette}
      />

      {isMobile && onShowOverview && (
        <button
          onClick={onShowOverview}
          className="p-3.5 rounded-full shadow-lg bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white transition-all"
          title="Page overview"
        >
          <Grid3x3 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
