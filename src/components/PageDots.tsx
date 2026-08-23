import { useState } from 'react';
import { Page } from '@/types';
import { useIsMobile } from '@/hooks';

interface PageDotsProps {
  pages: Page[];
  currentPageId: string;
  onPageSelect: (pageId: string) => void;
}

export function PageDots({ pages, currentPageId, onPageSelect }: PageDotsProps) {
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  if (!isMobile) return null;

  const sortedPages = [...pages].sort((a, b) => a.position - b.position);

  return (
    <div data-testid="page-dots-bar" className="flex items-center gap-3 bg-black/20 backdrop-blur rounded-full px-3 py-2 shadow-lg">
      {sortedPages.map((page) => {
        const isCurrent = page.id === currentPageId;
        const isHovered = page.id === hoveredPageId;

        return (
          <div
            key={page.id}
            className="relative"
            onMouseEnter={() => setHoveredPageId(page.id)}
            onMouseLeave={() => setHoveredPageId(null)}
          >
            {/* Tooltip */}
            <div
              className={`
                absolute bottom-full left-1/2 -translate-x-1/2 mb-3
                bg-black/40 backdrop-blur-md
                text-white text-xs font-medium
                px-3 py-1.5 rounded-lg
                shadow-lg border border-white/10
                whitespace-nowrap
                transition-all duration-200 ease-in-out
                pointer-events-none
                ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}
              `}
            >
              {page.title}
              {isCurrent && (
                <span className="text-white/50 ml-1.5">•&thinsp;current</span>
              )}
            </div>

            {/* Dot button — larger hit area via padding */}
            <button
              onClick={() => onPageSelect(page.id)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all
                ${isCurrent
                  ? 'bg-white scale-150 shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                  : 'bg-white/50 hover:bg-white/75'
                }
              `}
              style={{ padding: '0', margin: '4px' }}
              aria-label={`Navigate to ${page.title}`}
            />
          </div>
        );
      })}
    </div>
  );
}
