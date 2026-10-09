import { describe, it, expect } from 'vitest';
import { PALETTES } from '@/types/palette';

// Decision 2 of SPEC_master_view_2026-10-09.md: each of the 12 palettes
// maps to one of eight bright sidebar swatches, distinct from `background`
// (which still drives the page wash and tile accents, unchanged).
const EXPECTED_SWATCHES: Record<string, string> = {
  'coral-reef': '#E02718',
  'ocean-bold': '#2563EB',
  'sunset-glow': '#FF8A00',
  emerald: '#0F766E',
  'berry-pop': '#DB2777',
  cobalt: '#2563EB',
  'sage-clay': '#0F766E',
  'dusty-rose': '#DB2777',
  'ocean-mist': '#475569',
  'sand-dune': '#F5C518',
  lavender: '#7C3AED',
  nordic: '#475569',
};

describe('palette swatches', () => {
  it('defines all 12 palettes', () => {
    expect(PALETTES).toHaveLength(12);
  });

  it('maps every palette id to its decided swatch', () => {
    for (const palette of PALETTES) {
      expect(palette.swatch, palette.id).toBe(EXPECTED_SWATCHES[palette.id]);
    }
  });

  it('uses exactly the eight bright colours, never a literal outside that set', () => {
    const distinct = new Set(PALETTES.map((p) => p.swatch));
    expect(distinct.size).toBe(8);
  });

  it('leaves `background` (page wash, tile accents) untouched by the swatch addition', () => {
    const emerald = PALETTES.find((p) => p.id === 'emerald')!;
    expect(emerald.background).toBe('#047857');
    expect(emerald.swatch).toBe('#0F766E');
  });
});
