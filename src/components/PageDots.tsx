import { useState, useRef, useEffect, useCallback } from 'react';
import { Page } from '../types/page';
import { Grid3x3 } from 'lucide-react';
import { useIsMobile } from '../hooks';
import { HoverShelf } from './HoverShelf';
import { HOVER_SHELF } from '../lib/constants';

interface PageDotsProps {
  pages: Page[];
  currentPageId: string;
  onPageSelect: (pageId: string) => void;
  onShowOverview: () => void;
  onCreatePage: () => void;
}

export function PageDots({ pages, currentPageId, onPageSelect, onShowOverview, onCreatePage }: PageDotsProps) {
  const isMobile = useIsMobile();
  const [isShelfOpen, setShelfOpen] = useState(false);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const cancelOpenTimer = useCallback(() => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const cancelCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelOpenTimer();
      cancelCloseTimer();
    };
  }, [cancelOpenTimer, cancelCloseTimer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isShelfOpen) {
        setShelfOpen(false);
        cancelOpenTimer();
        cancelCloseTimer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShelfOpen, cancelOpenTimer, cancelCloseTimer]);

  if (isMobile) return null;

  const sortedPages = [...pages].sort((a, b) => a.position - b.position);

  const handleMouseEnter = () => {
    cancelCloseTimer();
    if (!isShelfOpen) {
      openTimerRef.current = window.setTimeout(() => {
        setShelfOpen(true);
      }, HOVER_SHELF.OPEN_DELAY_MS);
    }
  };

  const handleMouseLeave = () => {
    cancelOpenTimer();
    if (isShelfOpen) {
      closeTimerRef.current = window.setTimeout(() => {
        setShelfOpen(false);
      }, HOVER_SHELF.CLOSE_GRACE_MS);
    }
  };

  const closeShelf = () => {
    setShelfOpen(false);
    cancelOpenTimer();
    cancelCloseTimer();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-20 bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
          isShelfOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeShelf}
      />

      <div
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <HoverShelf
          pages={pages}
          currentPageId={currentPageId}
          isOpen={isShelfOpen}
          onPageSelect={onPageSelect}
          onCreatePage={() => {
            onCreatePage();
            closeShelf();
          }}
        />

      <div className="flex items-center gap-3 bg-black/20 backdrop-blur rounded-full px-3 py-2">
        <button
          onClick={onShowOverview}
          className="w-6 h-6 bg-white/60 rounded-full flex items-center justify-center hover:bg-white/75 transition-all active:scale-95"
          aria-label="Open page overview"
        >
          <Grid3x3 className="w-3 h-3 text-black/70" />
        </button>

        {sortedPages.map((page) => (
          <button
            key={page.id}
            onClick={() => onPageSelect(page.id)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              page.id === currentPageId
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            title={page.title}
            aria-label={`Navigate to ${page.title}`}
          />
        ))}
      </div>
      </div>
    </>
  );
}
