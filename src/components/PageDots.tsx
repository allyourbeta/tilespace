import { Page } from '../types/page';
import { Grid3x3 } from 'lucide-react';
import { useIsMobile } from '../hooks';

interface PageDotsProps {
  pages: Page[];
  currentPageId: string;
  onPageSelect: (pageId: string) => void;
  onShowOverview: () => void;
}

export function PageDots({ pages, currentPageId, onPageSelect, onShowOverview }: PageDotsProps) {
  const isMobile = useIsMobile();

  // Hidden on mobile — overview icon moves to FloatingActions, swipe replaces dots
  if (isMobile) return null;

  // Sort pages by position
  const sortedPages = [...pages].sort((a, b) => a.position - b.position);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-3 bg-black/20 backdrop-blur rounded-full px-3 py-2">
      {/* Overview Disc */}
      <button
        onClick={onShowOverview}
        className="w-6 h-6 bg-white/60 rounded-full flex items-center justify-center hover:bg-white/75 transition-all active:scale-95"
        aria-label="Open page overview"
      >
        <Grid3x3 className="w-3 h-3 text-black/70" />
      </button>
      
      {/* Page Dots */}
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
  );
}
