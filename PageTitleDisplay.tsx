import { useState, useEffect, useRef, useMemo } from 'react';
import { Page, getPalette } from '@/types';
import { PAGE_TITLE_OVERLAY } from '@/lib/constants';
import { darkenColor } from '@/utils/color';
import { useIsMobile } from '@/hooks';

interface PageTitleDisplayProps {
  currentPage: Page | null;
  currentPageId: string | null;
  pages: Page[];
  onShowOverview: () => void;
}

export function PageTitleDisplay({ currentPage, currentPageId, pages, onShowOverview }: PageTitleDisplayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showFromPageChange, setShowFromPageChange] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const prevPageIdRef = useRef<string | null>(null);
  const isMobile = useIsMobile();

  const sortedPages = useMemo(
    () => [...pages].sort((a, b) => a.position - b.position),
    [pages]
  );

  // Calculate grid dimensions to match actual page count
  const gridCols = useMemo(() => {
    const count = sortedPages.length;
    if (count <= 2) return 2;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    if (count <= 9) return 3;
    if (count <= 12) return 4;
    if (count <= 16) return 4;
    return 5;
  }, [sortedPages.length]);

  // Handle page change — briefly show page title as orientation cue
  useEffect(() => {
    if (!currentPageId) return;

    if (prevPageIdRef.current !== currentPageId) {
      prevPageIdRef.current = currentPageId;
      setShowFromPageChange(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setShowFromPageChange(false);
      }, PAGE_TITLE_OVERLAY.FADE_TIMEOUT_MS);
    }
  }, [currentPageId]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!currentPage) {
    return null;
  }

  // Mobile: always-visible compact title bar (unchanged)
  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-30 bg-black/20 backdrop-blur text-white text-base font-semibold px-4 py-2 text-center pointer-events-none">
        {currentPage.title}
      </div>
    );
  }

  const isVisible = isHovered || showFromPageChange;

  return (
    <>
      {/* Hover detection zone — same position/size as before */}
      <div
        className="fixed top-0 left-0 z-20"
        style={{
          width: `${PAGE_TITLE_OVERLAY.HOVER_ZONE_WIDTH_PX}px`,
          height: `${PAGE_TITLE_OVERLAY.HOVER_ZONE_HEIGHT_PX}px`,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Overview thumbnail — clickable mini-grid of pages */}
      <button
        onClick={onShowOverview}
        aria-label="Open page overview"
        className={`
          fixed top-5 left-5 z-30
          bg-black/25 backdrop-blur-md
          rounded-xl
          shadow-xl border border-white/15
          transition-all duration-300 ease-in-out
          cursor-pointer
          hover:bg-black/35 hover:scale-105 hover:shadow-2xl
          active:scale-95
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
        `}
        style={{ padding: '10px' }}
      >
        {/* Mini page grid */}
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          }}
        >
          {sortedPages.map((page) => {
            const palette = getPalette(page.palette_id);
            const isCurrent = page.id === currentPageId;
            return (
              <div
                key={page.id}
                className={`
                  rounded-[3px]
                  ${isCurrent ? 'ring-1 ring-white shadow-[0_0_4px_rgba(255,255,255,0.6)]' : ''}
                `}
                style={{
                  width: '16px',
                  height: '16px',
                  backgroundColor: darkenColor(palette.background, 10),
                }}
              />
            );
          })}
        </div>

        {/* "Overview" label below grid */}
        <div className="text-white/70 text-[10px] font-medium text-center mt-1.5 tracking-wide uppercase">
          Overview
        </div>
      </button>

      {/* Page title — brief orientation cue on page change only */}
      <div
        className={`
          fixed top-5 z-30
          bg-black/20 backdrop-blur
          text-white text-xl font-semibold
          px-6 py-3 rounded-xl
          shadow-lg border border-white/10
          transition-all duration-300 ease-in-out
          pointer-events-none
          ${showFromPageChange && !isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        `}
        style={{
          left: `${PAGE_TITLE_OVERLAY.HOVER_ZONE_WIDTH_PX + 8}px`,
        }}
      >
        {currentPage.title}
      </div>
    </>
  );
}
