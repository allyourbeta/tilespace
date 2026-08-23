import { describe, it, expect } from 'vitest';
import { CHIP_COLORS, chipColor, chipTint } from '@/lib/chipColors';

describe('chipColor', () => {
  it('returns twelve distinct values for indices 0-11', () => {
    const values = Array.from({ length: 12 }, (_, i) => chipColor(i));
    expect(new Set(values).size).toBe(12);
    values.forEach((v, i) => expect(v).toBe(CHIP_COLORS[i]));
  });

  it('wraps out-of-range indices back into the table', () => {
    expect(chipColor(12)).toBe(chipColor(0));
    expect(chipColor(-1)).toBe(chipColor(11));
  });
});

describe('chipTint', () => {
  it('is chipColor plus an 8-digit-hex alpha suffix', () => {
    for (let i = 0; i < 12; i++) {
      expect(chipTint(i)).toBe(`${chipColor(i)}16`);
      expect(chipTint(i)).toMatch(/^#[0-9A-Fa-f]{8}$/);
    }
  });
});
