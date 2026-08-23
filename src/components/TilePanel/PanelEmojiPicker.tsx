import { useState, useRef, useEffect } from 'react';
import { EMOJI_CATEGORIES } from '@/types';

const CATEGORY_LABELS: Record<string, string> = {
  nature: 'Nature',
  animals: 'Animals',
  objects: 'Objects',
  food: 'Food',
  symbols: 'Symbols',
};

interface PanelEmojiPickerProps {
  currentEmoji: string;
  onSelect: (emoji: string) => void;
}

export function PanelEmojiPicker({ currentEmoji, onSelect }: PanelEmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<keyof typeof EMOJI_CATEGORIES>('nature');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-4xl hover:scale-110 transition-transform cursor-pointer"
        title="Change emoji"
      >
        {currentEmoji || '🌿'}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-surface-card rounded-lg shadow-cardHi border border-edge z-10 w-72 overflow-hidden">
          <div className="flex border-b border-edge">
            {Object.keys(EMOJI_CATEGORIES).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat as keyof typeof EMOJI_CATEGORIES)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  category === cat
                    ? 'text-ink bg-black/[0.03]'
                    : 'text-ink-muted hover:text-ink-2 hover:bg-black/[0.02]'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <div className="p-3 grid grid-cols-8 gap-1">
            {EMOJI_CATEGORIES[category].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className={`text-xl p-1.5 rounded-lg transition-all hover:bg-black/[0.04] hover:scale-110 ${
                  currentEmoji === emoji ? 'bg-black/[0.04] ring-2 ring-ink-faint' : ''
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
