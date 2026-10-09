/**
 * The eight bright swatches from the 2026-10-09 sidebar refresh, in the
 * fixed rainbow order: blue, violet, raspberry, red, orange, gold, deep
 * teal, slate. Sidebar dots and Master View theme tiles both cycle through
 * this same order so a colour means the same thing in both places.
 */
export const RAINBOW_SWATCHES = [
  '#2563EB', // blue
  '#7C3AED', // violet
  '#DB2777', // raspberry
  '#E02718', // red
  '#FF8A00', // orange
  '#F5C518', // gold
  '#0F766E', // deep teal
  '#475569', // slate
] as const;

export const GOLD_SWATCH = '#F5C518';

/** Round-robins by position, so consecutive indices always land on different colours. */
export function rainbowSwatch(index: number): string {
  const n = RAINBOW_SWATCHES.length;
  return RAINBOW_SWATCHES[((index % n) + n) % n];
}

/** Gold reads better with dark text; every other swatch keeps white. */
export function swatchTextColor(swatch: string): string {
  return swatch === GOLD_SWATCH ? '#1C1917' : '#FFFFFF';
}
