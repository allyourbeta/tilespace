import { useEffect, useRef, useState } from 'react';
import { fitLines } from '@/utils/fitLines';

/**
 * How many lines of text actually fit in an element, measured.
 *
 * Earlier versions predicted this from constants — padding, chip size, row
 * height, font size — and the prediction drifted out of sync every time one
 * of those changed, clamping titles to two lines in cards with room for four.
 * A ResizeObserver reports the real box, so there is nothing to keep in sync.
 *
 * The caller must measure one element and clamp a different one: clamping
 * the same element that is measured leaves it flex-sized, so
 * `-webkit-line-clamp` cannot shrink it and an extra sliced line paints into
 * the leftover space. Pair this hook's `ref` with a wrapper around the
 * clamped element, and apply `lines` / `lineHeight` to the clamped element's
 * own `maxHeight`.
 *
 * Returns at least `min`. The measured element must be a flex child that is
 * allowed to shrink (min-h-0) for its measured height to mean anything.
 */
export function useFittingLines(min = 1, max = 6) {
  const ref = useRef<HTMLElement | null>(null);
  const [lines, setLines] = useState(min);
  const [lineHeight, setLineHeight] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const style = window.getComputedStyle(el);
      let height = parseFloat(style.lineHeight);
      if (!Number.isFinite(height) || height <= 0) {
        // 'normal' — approximate the way browsers do, ~1.2x font size
        height = parseFloat(style.fontSize) * 1.2;
      }
      if (!Number.isFinite(height) || height <= 0) return;
      setLineHeight(height);
      setLines(fitLines(el.clientHeight, height, min, max));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [min, max]);

  return { ref, lines, lineHeight };
}
