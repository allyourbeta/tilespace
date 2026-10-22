/**
 * How many whole lines fit in `availablePx` given a line height, clamped to
 * [min, max]. Floating point line-height/measurement divisions can land just
 * under a whole number (e.g. 66.3 / 22.1 === 2.9999999999999996), so a small
 * epsilon is added before flooring.
 */
export function fitLines(availablePx: number, lineHeightPx: number, min: number, max: number): number {
  if (!Number.isFinite(lineHeightPx) || lineHeightPx <= 0) return min;
  const lines = Math.floor(availablePx / lineHeightPx + 0.01);
  return Math.min(max, Math.max(min, lines));
}
