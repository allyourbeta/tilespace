import { Page } from '../types/page';

interface PageDotsProps {
  pages: Page[];
  currentPageId: string;
  onPageSelect: (pageId: string) => void;
  onShowOverview: () => void;
}

export function PageDots({ pages, currentPageId, onPageSelect, onShowOverview }: PageDotsProps) {
  // Sort pages by position
  const sortedPages = [...pages].sort((a, b) => a.position - b.position);
  
  const handleBarClick = (e: React.MouseEvent) => {
    // If clicking the background (not a dot), open overview
    if (e.target === e.currentTarget) {
      onShowOverview();
    }
  };

  return (
    <div 
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 flex gap-3 bg-black/20 backdrop-blur rounded-full px-6 py-4 cursor-pointer transition-all hover:bg-black/30 active:scale-95"
      onClick={handleBarClick}
      role="button"
      aria-label="Tap for page overview"
    >
      {sortedPages.map((page) => (
        <button
          key={page.id}
          onClick={(e) => {
            e.stopPropagation();
            onPageSelect(page.id);
          }}
          className={`w-2.5 h-2.5 rounded-full transition-all relative z-10 ${
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
