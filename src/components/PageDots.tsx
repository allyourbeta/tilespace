import { Page } from '../types/page';

interface PageDotsProps {
  pages: Page[];
  currentPageId: string;
  onPageSelect: (pageId: string) => void;
}

export function PageDots({ pages, currentPageId, onPageSelect }: PageDotsProps) {
  // Sort pages by position
  const sortedPages = [...pages].sort((a, b) => a.position - b.position);
  
  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex gap-2 bg-black/20 rounded-full px-3 py-2">
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
        />
      ))}
    </div>
  );
}
