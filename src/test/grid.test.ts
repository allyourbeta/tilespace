import { describe, it, expect } from 'vitest';
import {
  getGridCapacity,
  getGridConfig,
  findFirstEmptyPosition,
  canAddTile,
  MAX_TILES,
} from '@/utils/grid';

describe('getGridCapacity', () => {
  it('returns 16 for 0-16 tiles', () => {
    expect(getGridCapacity(0)).toBe(16);
    expect(getGridCapacity(1)).toBe(16);
    expect(getGridCapacity(15)).toBe(16);
    expect(getGridCapacity(16)).toBe(16);
  });

  it('returns 20 for 17-20 tiles', () => {
    expect(getGridCapacity(17)).toBe(20);
    expect(getGridCapacity(18)).toBe(20);
    expect(getGridCapacity(19)).toBe(20);
    expect(getGridCapacity(20)).toBe(20);
  });

  it('returns 25 for 21-25 tiles', () => {
    expect(getGridCapacity(21)).toBe(25);
    expect(getGridCapacity(22)).toBe(25);
    expect(getGridCapacity(25)).toBe(25);
  });

  it('returns 25 for more than 25 tiles', () => {
    expect(getGridCapacity(26)).toBe(25);
    expect(getGridCapacity(100)).toBe(25);
  });
});

describe('getGridConfig', () => {
  it('returns 4x4 for capacity 16', () => {
    expect(getGridConfig(16)).toEqual({ cols: 4, rows: 4 });
  });

  it('returns 5x4 for capacity 20', () => {
    expect(getGridConfig(20)).toEqual({ cols: 5, rows: 4 });
  });

  it('returns 5x5 for capacity 25', () => {
    expect(getGridConfig(25)).toEqual({ cols: 5, rows: 5 });
  });
});

describe('findFirstEmptyPosition', () => {
  it('returns 0 for empty grid', () => {
    const occupied = new Set<number>();
    expect(findFirstEmptyPosition(occupied, 16)).toBe(0);
  });

  it('finds first gap in occupied positions', () => {
    const occupied = new Set([0, 1, 3, 4]); // gap at 2
    expect(findFirstEmptyPosition(occupied, 16)).toBe(2);
  });

  it('returns next position after last occupied', () => {
    const occupied = new Set([0, 1, 2]);
    expect(findFirstEmptyPosition(occupied, 16)).toBe(3);
  });

  it('returns -1 when grid is full', () => {
    const occupied = new Set(Array.from({ length: 16 }, (_, i) => i));
    expect(findFirstEmptyPosition(occupied, 16)).toBe(-1);
  });

  it('respects capacity limit', () => {
    const occupied = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    expect(findFirstEmptyPosition(occupied, 16)).toBe(-1);
    
    // But with larger capacity, there's room
    expect(findFirstEmptyPosition(occupied, 20)).toBe(16);
  });
});

describe('canAddTile', () => {
  it('returns true when under max tiles', () => {
    expect(canAddTile(0)).toBe(true);
    expect(canAddTile(24)).toBe(true);
  });

  it('returns false when at or over max tiles', () => {
    expect(canAddTile(25)).toBe(false);
    expect(canAddTile(30)).toBe(false);
  });

  it('uses correct MAX_TILES constant', () => {
    expect(MAX_TILES).toBe(25);
  });
});
