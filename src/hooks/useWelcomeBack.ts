import { useEffect, useRef } from 'react';
import { WELCOME_BACK } from '@/lib/constants';
import { useUIStore } from '@/state/uiStore';
import type { Link } from '@/types';

export function useWelcomeBack(
  pageCount: number,
  selectedTileId: string | null,
  editingDocument: Link | null,
) {
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => { isInitializedRef.current = true; }, 2000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const updateLastActive = () => {
      if (!isInitializedRef.current) return;
      localStorage.setItem(WELCOME_BACK.LAST_ACTIVE_KEY, Date.now().toString());
    };
    const handleBlur = () => {
      if (isInitializedRef.current) {
        localStorage.setItem(WELCOME_BACK.LAST_ACTIVE_KEY, Date.now().toString());
      }
    };
    const handleFocus = () => {
      if (selectedTileId || editingDocument) return;
      if (pageCount < 2) return;
      const lastActive = localStorage.getItem(WELCOME_BACK.LAST_ACTIVE_KEY);
      const idle = lastActive ? Date.now() - parseInt(lastActive, 10) : Infinity;
      if (idle >= WELCOME_BACK.IDLE_THRESHOLD_MS) {
        useUIStore.getState().setShowOverview(true);
      }
    };
    const events = ['click', 'keydown', 'scroll', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, updateLastActive));
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    return () => {
      events.forEach(e => window.removeEventListener(e, updateLastActive));
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [pageCount, selectedTileId, editingDocument]);
}
