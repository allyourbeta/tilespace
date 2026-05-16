import { Page } from '@/types';
import { useIsMobile } from '@/hooks';

interface PageDotsProps {
  pages: Page[];
  currentPageId: string;
  onPageSelect: (pageId: string) => void;
  onShowOverview: () => void;
  onCreatePage: () => void;
}

export function PageDots({ pages, currentPageId, onPageSelect }: PageDotsProps) {
  const isMobile = useIsMobile();

  if (isMobile) return null;

  const sortedPages = [...pages].sort((a, b) => a.position - b.position);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
      <div data-testid="page-dots-bar" className="flex items-center gap-3 bg-black/20 backdrop-blur rounded-full px-3 py-2 shadow-lg">
        {sortedPages.map((page) => (
          <button
            key={page.id}
            onClick={() => onPageSelect(page.id)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              page.id === currentPageId
                ? 'bg-white scale-150 shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            title={page.title}
            aria-label={`Navigate to ${page.title}`}
          />
        ))}
      </div>
    </div>
  );
}
