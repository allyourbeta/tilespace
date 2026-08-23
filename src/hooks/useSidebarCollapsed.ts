import { useState, useCallback } from 'react';
import { LAYOUT } from '@/lib/constants';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(LAYOUT.SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeCollapsed(value: boolean) {
  try {
    localStorage.setItem(LAYOUT.SIDEBAR_COLLAPSED_KEY, value ? '1' : '0');
  } catch {
    // private mode etc — collapse still works for this session
  }
}

export function useSidebarCollapsed(isMobile: boolean) {
  const [isCollapsed, setIsCollapsed] = useState(() => !isMobile && readCollapsed());

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => {
      writeCollapsed(!prev);
      return !prev;
    });
  }, []);

  return { isCollapsed, toggleCollapsed };
}
