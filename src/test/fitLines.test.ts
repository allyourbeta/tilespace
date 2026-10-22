import { describe, it, expect } from 'vitest';
import { fitLines } from '@/utils/fitLines';

describe('fitLines', () => {
  it('53 / 22.1 fits 2 lines', () => {
    expect(fitLines(53, 22.1, 1, 6)).toBe(2);
  });

  it('101 / 22.1 fits 4 lines', () => {
    expect(fitLines(101, 22.1, 1, 6)).toBe(4);
  });

  it('66.3 / 22.1 fits 3 lines despite floating point rounding under 3', () => {
    expect(66.3 / 22.1).toBeLessThan(3);
    expect(fitLines(66.3, 22.1, 1, 6)).toBe(3);
  });

  it('clamps to min when available space is 0', () => {
    expect(fitLines(0, 22.1, 1, 6)).toBe(1);
  });

  it('clamps to max when available space is huge', () => {
    expect(fitLines(100000, 22.1, 1, 6)).toBe(6);
  });

  it('returns min when lineHeight is 0', () => {
    expect(fitLines(100, 0, 1, 6)).toBe(1);
  });

  it('returns min when lineHeight is NaN', () => {
    expect(fitLines(100, NaN, 1, 6)).toBe(1);
  });
});
