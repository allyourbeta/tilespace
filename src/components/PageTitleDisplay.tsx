import { useState, useEffect, useRef } from 'react';
import { Page } from '../types/page';
import { PAGE_TITLE_OVERLAY } from '../lib/constants';
import { useIsMobile } from '../hooks';

interface PageTitleDisplayProps {
  currentPage: Page | null;
  currentPageId: string | null;
}

export function PageTitleDisplay({ currentPage, currentPageId }: PageTitleDisplayProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showFromPageChange, setShowFromPageChange] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const prevPageIdRef = useRef<string | null>(null);
  const isMobile = useIsMobile();

  // Handle page change detection
  useEffect(() => {
    if (!currentPageId) return;

    // If page ID changed from previous value, show title
    if (prevPageIdRef.current !== currentPageId) {
      prevPageIdRef.current = currentPageId;
      setShowFromPageChange(true);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Hide after 2 seconds
      timeoutRef.current = window.setTimeout(() => {
        setShowFromPageChange(false);
      }, PAGE_TITLE_OVERLAY.FADE_TIMEOUT_MS);
    }
  }, [currentPageId]);

  // Cleanup timeout on unmount
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

  const isVisible = isHovered || showFromPageChange;

  // Mobile: always-visible compact title bar
  if (isMobile) {
    return (
      <div className="fixed top-0 left-0 right-0 z-30 bg-black/20 backdrop-blur text-white text-base font-semibold px-4 py-2 text-center pointer-events-none">
        {currentPage.title}
      </div>
    );
  }

  // Desktop: hover/fade behavior
  return (
    <>
      {/* Hover detection area */}
      <div
        className="fixed top-0 left-0 z-20"
        style={{ width: `${PAGE_TITLE_OVERLAY.HOVER_ZONE_WIDTH_PX}px`, height: `${PAGE_TITLE_OVERLAY.HOVER_ZONE_HEIGHT_PX}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      
      {/* Title display */}
      <div
        className={`
          fixed top-6 left-6 z-30 
          bg-black/20 backdrop-blur 
          text-white text-2xl font-semibold 
          px-8 py-6 rounded-2xl
          transition-opacity duration-300 ease-in-out
          pointer-events-none
          min-w-[200px]
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
      >
        {currentPage.title}
      </div>
    </>
  );
}
