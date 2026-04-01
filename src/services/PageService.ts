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

export function calculateOverviewColumns(pageCount: number): number {
  const aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 1.5;
  return Math.max(2, Math.min(Math.ceil(Math.sqrt(pageCount * aspect)), 6));
}
