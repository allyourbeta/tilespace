import { useMemo, useCallback } from 'react';
import { Page } from '../types/page';

interface UsePageNavigationProps {
  pages: Page[];
  currentPageId: string | null;
  setCurrentPageId: (id: string | null) => void;
  setSelectedTileId: (id: string | null) => void;
}

export function usePageNavigation({
  pages,
  currentPageId,
  setCurrentPageId,
  setSelectedTileId,
}: UsePageNavigationProps) {
  const sortedPages = useMemo(() => {
    return [...pages].sort((a, b) => a.position - b.position);
  }, [pages]);

  const currentPageIndex = useMemo(() => {
    if (!currentPageId) return 0;
    return sortedPages.findIndex(p => p.id === currentPageId);
  }, [sortedPages, currentPageId]);

  const goToNextPage = useCallback(() => {
    if (currentPageIndex < sortedPages.length - 1) {
      setSelectedTileId(null);
      setCurrentPageId(sortedPages[currentPageIndex + 1].id);
    }
  }, [currentPageIndex, sortedPages, setCurrentPageId, setSelectedTileId]);

  const goToPrevPage = useCallback(() => {
    if (currentPageIndex > 0) {
      setSelectedTileId(null);
      setCurrentPageId(sortedPages[currentPageIndex - 1].id);
    }
  }, [currentPageIndex, sortedPages, setCurrentPageId, setSelectedTileId]);

  const goToPage = useCallback((pageId: string) => {
    setSelectedTileId(null);
    setCurrentPageId(pageId);
  }, [setCurrentPageId, setSelectedTileId]);

  return {
    sortedPages,
    currentPageIndex,
    goToNextPage,
    goToPrevPage,
    goToPage,
  };
}