/**
 * The "Clear" palette (2026-10-09 depth + palette refresh): eight hues in
 * one key — same brightness, same strength of colour — in the fixed
 * rainbow order red, orange, gold, green, teal, blue, indigo, plum.
 * Sidebar dots and Master View theme tiles both cycle through this same
 * order so a colour means the same thing in both places.
 */
export const RAINBOW_SWATCHES = [
  '#D8625C', // red
  '#EB883B', // orange
  '#CF9B00', // gold
  '#47A34E', // green
  '#00A7A8', // teal
  '#3690E3', // blue
  '#7C7FE5', // indigo
  '#BE67B7', // plum
] as const;

export const GOLD_SWATCH = '#CF9B00';
export const ORANGE_SWATCH = '#EB883B';

/** Round-robins by position, so consecutive indices always land on different colours. */
export function rainbowSwatch(index: number): string {
  const n = RAINBOW_SWATCHES.length;
  return RAINBOW_SWATCHES[((index % n) + n) % n];
}

/** Gold and orange read better with dark text; every other swatch keeps white. */
export function swatchTextColor(swatch: string): string {
  return swatch === GOLD_SWATCH || swatch === ORANGE_SWATCH ? '#1C1917' : '#FFFFFF';
}
