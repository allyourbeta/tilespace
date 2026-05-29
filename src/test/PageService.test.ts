import { describe, it, expect } from 'vitest';
import {
  sortPagesByPosition,
  getNextPagePosition,
  computeInsertPositions,
} from '@/services/PageService';
import type { Page } from '@/types';

function createMockPage(overrides: Partial<Page> = {}): Page {
  return {
    id: 'page-id',
    user_id: 'user-id',
    position: 0,
    title: 'Test Page',
    palette_id: 'ocean',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// Five pages at positions 0..4
function makePages(): Page[] {
  return [0, 1, 2, 3, 4].map(pos =>
    createMockPage({ id: `p${pos}`, position: pos })
  );
}

describe('PageService.sortPagesByPosition', () => {
  it('sorts ascending by position without mutating input', () => {
    const pages = [
      createMockPage({ id: 'a', position: 2 }),
      createMockPage({ id: 'b', position: 0 }),
      createMockPage({ id: 'c', position: 1 }),
    ];
    const sorted = sortPagesByPosition(pages);
    expect(sorted.map(p => p.id)).toEqual(['b', 'c', 'a']);
    expect(pages[0].id).toBe('a'); // original untouched
  });
});

describe('PageService.getNextPagePosition', () => {
  it('returns 0 for an empty list', () => {
    expect(getNextPagePosition([])).toBe(0);
  });
  it('returns max position + 1', () => {
    expect(getNextPagePosition(makePages())).toBe(5);
  });
});

describe('PageService.computeInsertPositions', () => {
  it('returns an empty map when the dragged page is not found', () => {
    const result = computeInsertPositions(makePages(), 'missing', 2);
    expect(result.size).toBe(0);
  });

  it('returns an empty map when target equals current position (no-op)', () => {
    const result = computeInsertPositions(makePages(), 'p2', 2);
    expect(result.size).toBe(0);
  });

  it('moves a page backward and shifts the gap forward by 1', () => {
    // Move p4 (pos 4) to position 1: p1,p2,p3 -> 2,3,4; p4 -> 1
    const result = computeInsertPositions(makePages(), 'p4', 1);
    expect(result.get('p4')).toBe(1);
    expect(result.get('p1')).toBe(2);
    expect(result.get('p2')).toBe(3);
    expect(result.get('p3')).toBe(4);
    expect(result.has('p0')).toBe(false); // untouched
  });

  it('moves a page forward and shifts the gap back by 1', () => {
    // Move p0 (pos 0) to position 3: p1,p2,p3 -> 0,1,2; p0 -> 3
    const result = computeInsertPositions(makePages(), 'p0', 3);
    expect(result.get('p0')).toBe(3);
    expect(result.get('p1')).toBe(0);
    expect(result.get('p2')).toBe(1);
    expect(result.get('p3')).toBe(2);
    expect(result.has('p4')).toBe(false); // untouched
  });

  it('produces a contiguous 0..n-1 ordering after applying the result', () => {
    const pages = makePages();
    const result = computeInsertPositions(pages, 'p4', 0);
    const finalPositions = pages
      .map(p => ({ id: p.id, position: result.get(p.id) ?? p.position }))
      .sort((a, b) => a.position - b.position);
    expect(finalPositions.map(p => p.position)).toEqual([0, 1, 2, 3, 4]);
    expect(finalPositions[0].id).toBe('p4'); // dragged page now first
  });

  it('handles adjacent forward move (target = old + 1)', () => {
    const result = computeInsertPositions(makePages(), 'p1', 2);
    expect(result.get('p1')).toBe(2);
    expect(result.get('p2')).toBe(1);
    expect(result.size).toBe(2);
  });
});
