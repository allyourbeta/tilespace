import { useEffect, useRef, useState } from 'react';

/**
 * How many lines of text actually fit in an element, measured.
 *
 * Earlier versions predicted this from constants — padding, chip size, row
 * height, font size — and the prediction drifted out of sync every time one
 * of those changed, clamping titles to two lines in cards with room for four.
 * A ResizeObserver reports the real box, so there is nothing to keep in sync.
 *
 * Returns at least 1. The element must be a flex child that is allowed to
 * shrink (min-h-0) for its measured height to mean anything.
 */
export function useFittingLines(min = 1, max = 6) {
  const ref = useRef<HTMLElement | null>(null);
  const [lines, setLines] = useState(min);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const style = window.getComputedStyle(el);
      let lineHeight = parseFloat(style.lineHeight);
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
        // 'normal' — approximate the way browsers do, ~1.2x font size
        lineHeight = parseFloat(style.fontSize) * 1.2;
      }
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;

      const fits = Math.floor(el.clientHeight / lineHeight);
      setLines(Math.min(max, Math.max(min, fits)));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [min, max]);

  return { ref, lines };
}
