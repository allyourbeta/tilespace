import type { Page } from '@/types';

export function sortPagesByPosition(pages: Page[]): Page[] {
  return [...pages].sort((a, b) => a.position - b.position);
}

export function getNextPagePosition(pages: Page[]): number {
  if (pages.length === 0) return 0;
  return Math.max(...pages.map(p => p.position)) + 1;
}

export function getDefaultPageTitle(position: number): string {
  return `Page ${position + 1}`;
}

export function findPageById(pages: Page[], id: string): Page | undefined {
  return pages.find(p => p.id === id);
}

export function getPagePaletteId(pages: Page[], pageId: string | null): string {
  if (!pageId) return 'ocean';
  const page = pages.find(p => p.id === pageId);
  return page?.palette_id ?? 'ocean';
}

/**
 * A page's rank among all pages sorted by position — the same order the
 * sidebar uses to pick a page's swatch, so any other UI (e.g. the Master
 * View document page dot) that indexes into the rainbow swatches by this
 * rank always matches the sidebar dot for the same page.
 */
export function pageSwatchIndex(pages: { id: string; position: number }[], pageId: string): number {
  return [...pages].sort((a, b) => a.position - b.position).findIndex(p => p.id === pageId);
}

export function calculateOverviewColumns(pageCount: number): number {
  const aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.5;
  return Math.max(2, Math.min(Math.ceil(Math.sqrt(pageCount * aspect)), 6));
}

/**
 * Compute new positions after inserting a page at a target position.
 * Pages between the old and new positions shift to make room (insert, not swap).
 * Returns a map of pageId → newPosition for every affected page.
 *
 * Mirrors TileService.computeInsertPositions so the overview reorders pages
 * the same way the grid reorders tiles.
 */
export function computeInsertPositions(
  pages: Page[],
  pageId: string,
  targetPosition: number
): Map<string, number> {
  const result = new Map<string, number>();
  const draggedPage = pages.find(p => p.id === pageId);
  if (!draggedPage) return result;

  const oldPosition = draggedPage.position;
  if (oldPosition === targetPosition) return result;

  for (const p of pages) {
    if (p.id === pageId) {
      result.set(p.id, targetPosition);
    } else if (oldPosition < targetPosition) {
      // Moving forward: shift pages in (old, target] back by 1
      if (p.position > oldPosition && p.position <= targetPosition) {
        result.set(p.id, p.position - 1);
      }
    } else {
      // Moving backward: shift pages in [target, old) forward by 1
      if (p.position >= targetPosition && p.position < oldPosition) {
        result.set(p.id, p.position + 1);
      }
    }
  }
  return result;
}
