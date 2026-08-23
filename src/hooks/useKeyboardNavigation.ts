import { useEffect } from 'react';

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

export function useKeyboardNavigation(onLeft: () => void, onRight: () => void, onToggleSidebar: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't navigate or toggle while the user is typing.
      if (isEditableTarget(e.target)) return;

      if (e.key === 'ArrowLeft') {
        onLeft();
      } else if (e.key === 'ArrowRight') {
        onRight();
      } else if (e.key === '\\' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onToggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLeft, onRight, onToggleSidebar]);
}
