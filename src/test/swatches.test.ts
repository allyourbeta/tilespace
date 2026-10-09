import { describe, it, expect } from 'vitest';
import { RAINBOW_SWATCHES, GOLD_SWATCH, ORANGE_SWATCH, rainbowSwatch, swatchTextColor } from '@/lib/swatches';
import { pageSwatchIndex } from '@/services/PageService';

// Decision 5 of SPEC_depth_2026-10-09.md: the "Clear" palette, one family
// in the same key, in this fixed rainbow order.
const CLEAR_PALETTE = [
  '#D8625C', // red
  '#EB883B', // orange
  '#CF9B00', // gold
  '#47A34E', // green
  '#00A7A8', // teal
  '#3690E3', // blue
  '#7C7FE5', // indigo
  '#BE67B7', // plum
];

describe('RAINBOW_SWATCHES (the Clear palette)', () => {
  it('is exactly the eight Clear colours, in order', () => {
    expect(RAINBOW_SWATCHES).toEqual(CLEAR_PALETTE);
  });

  it('exposes gold and orange as the two dark-text swatches', () => {
    expect(GOLD_SWATCH).toBe('#CF9B00');
    expect(ORANGE_SWATCH).toBe('#EB883B');
    expect(RAINBOW_SWATCHES).toContain(GOLD_SWATCH);
    expect(RAINBOW_SWATCHES).toContain(ORANGE_SWATCH);
  });
});

describe('rainbowSwatch', () => {
  it('round-robins by position', () => {
    expect(rainbowSwatch(0)).toBe(CLEAR_PALETTE[0]);
    expect(rainbowSwatch(8)).toBe(CLEAR_PALETTE[0]);
    expect(rainbowSwatch(9)).toBe(CLEAR_PALETTE[1]);
  });

  it('wraps negative indices safely', () => {
    expect(rainbowSwatch(-1)).toBe(CLEAR_PALETTE[7]);
  });
});

describe('swatchTextColor', () => {
  it('is dark on Gold and Orange', () => {
    expect(swatchTextColor(GOLD_SWATCH)).toBe('#1C1917');
    expect(swatchTextColor(ORANGE_SWATCH)).toBe('#1C1917');
  });

  it('is white on every other Clear swatch', () => {
    for (const swatch of CLEAR_PALETTE) {
      if (swatch === GOLD_SWATCH || swatch === ORANGE_SWATCH) continue;
      expect(swatchTextColor(swatch)).toBe('#FFFFFF');
    }
  });
});

// Decision 7: a document card's page dot must match that page's sidebar
// dot. The sidebar picks its dot via rainbowSwatch(index-in-position-order);
// this proves the same rank + the same swatch function always agree.
describe('document card dot matches sidebar dot (Decision 7)', () => {
  it('gives the same swatch for a page via position rank as the sidebar would', () => {
    const pages = [
      { id: 'c', position: 2 },
      { id: 'a', position: 0 },
      { id: 'b', position: 1 },
    ];
    const sidebarDotFor = (id: string) => {
      const sorted = [...pages].sort((p, q) => p.position - q.position);
      return rainbowSwatch(sorted.findIndex((p) => p.id === id));
    };

    for (const page of pages) {
      const cardDot = rainbowSwatch(pageSwatchIndex(pages, page.id));
      expect(cardDot).toBe(sidebarDotFor(page.id));
    }
  });
});
