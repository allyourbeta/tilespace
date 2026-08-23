import { useState, useEffect, useRef } from 'react';

export function useViewportHeight(): number {
  const [viewportHeight, setViewportHeight] = useState(
    () => window.innerHeight
  );
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        setViewportHeight(window.innerHeight);
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return viewportHeight;
}
