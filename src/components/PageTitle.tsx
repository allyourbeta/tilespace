import { useState, useRef, useEffect } from 'react';
import { Page } from '../types/page';

interface PageTitleProps {
  page: Page;
  onUpdateTitle: (pageId: string, title: string) => void;
}

export function PageTitle({ page, onUpdateTitle }: PageTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(page.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(page.title);
  }, [page.title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSubmit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== page.title) {
      onUpdateTitle(page.id, trimmed);
    } else {
      setEditValue(page.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(page.title);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="bg-white/90 backdrop-blur text-gray-900 text-lg font-medium px-4 py-2 rounded-lg shadow-lg border border-white/50 outline-none focus:ring-2 focus:ring-white/50 text-center min-w-[200px]"
          maxLength={30}
        />
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30">
      <button
        onClick={() => setIsEditing(true)}
        className="bg-black/20 backdrop-blur text-white text-lg font-medium px-4 py-2 rounded-lg hover:bg-black/30 transition-colors"
      >
        {page.title}
      </button>
    </div>
  );
}
