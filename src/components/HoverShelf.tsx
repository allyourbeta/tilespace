import { useRef, useEffect, useCallback } from 'react';
import { Page } from '../types/page';
import { getPalette } from '../types/palette';
import { HOVER_SHELF } from '../lib/constants';

interface HoverShelfProps {
  pages: Page[];
  currentPageId: string;
  isOpen: boolean;
  onPageSelect: (pageId: string) => void;
}

export function HoverShelf({ pages, currentPageId, isOpen, onPageSelect }: HoverShelfProps) {
  const navTimerRef = useRef<number | null>(null);
  const hoveredPageRef = useRef<string | null>(null);

  const cancelNavTimer = useCallback(() => {
    if (navTimerRef.current) {
      clearTimeout(navTimerRef.current);
      navTimerRef.current = null;
    }
    hoveredPageRef.current = null;
  }, []);

  useEffect(() => {
    return () => cancelNavTimer();
  }, [cancelNavTimer]);

  const handleCardMouseEnter = (pageId: string) => {
    cancelNavTimer();
    hoveredPageRef.current = pageId;
    navTimerRef.current = window.setTimeout(() => {
      if (hoveredPageRef.current === pageId) {
        onPageSelect(pageId);
      }
    }, HOVER_SHELF.NAV_DELAY_MS);
  };

  const handleCardMouseLeave = () => {
    cancelNavTimer();
  };

  const sortedPages = [...pages].sort((a, b) => a.position - b.position);

  return (
    <div
      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 transition-all duration-200 ${
        isOpen
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className="bg-black/40 backdrop-blur rounded-xl p-4 grid grid-cols-4 gap-3 w-[800px] max-w-[90vw] max-h-[60vh] overflow-y-auto">
        {sortedPages.map((page) => {
          const palette = getPalette(page.palette_id);
          const isCurrent = page.id === currentPageId;

          return (
            <button
              key={page.id}
              onMouseEnter={() => handleCardMouseEnter(page.id)}
              onMouseLeave={handleCardMouseLeave}
              onClick={(e) => {
                e.stopPropagation();
                cancelNavTimer();
                onPageSelect(page.id);
              }}
              className={`rounded-lg transition-all duration-150 flex items-end p-3 overflow-hidden ${
                isCurrent ? 'ring-2 ring-white' : 'ring-1 ring-white/20 hover:ring-white/50'
              } hover:scale-105`}
              style={{
                minHeight: HOVER_SHELF.CARD_HEIGHT_PX,
                backgroundColor: palette.background,
              }}
              title={page.title}
            >
              <span className="text-white text-sm font-medium truncate w-full text-left drop-shadow-sm">
                {page.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
