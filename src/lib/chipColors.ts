/**
 * Display colours for tile chips.
 *
 * Indexed by the tile's existing color_index (0-11). Deliberately NOT the
 * page palette: several palettes are monochrome by design, which reads fine
 * as full-bleed coloured tiles but produces twelve identical chips once the
 * card is white. These twelve hues are spaced around the wheel and all
 * readable as ink on white.
 */
export const CHIP_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#E11D48',
  '#EA580C', '#D97706', '#CA8A04', '#16A34A',
  '#0D9488', '#0891B2', '#4F46E5', '#9333EA',
] as const;

/** Safe lookup: any integer, including out-of-range or negative, maps to a colour. */
export function chipColor(colorIndex: number): string {
  const n = CHIP_COLORS.length;
  return CHIP_COLORS[((colorIndex % n) + n) % n];
}

/** The chip's tinted background: the same hue at ~9% over white. */
export function chipTint(colorIndex: number): string {
  return `${chipColor(colorIndex)}16`;
}
