import { useState, useEffect } from 'react';
import { Search, Loader2 } from 'lucide-react';

interface AskBoxProps {
  onAsk: (query: string) => void;
  onClear: () => void;
  loading: boolean;
  hasResults: boolean;
}

export function AskBox({ onAsk, onClear, loading, hasResults }: AskBoxProps) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (!hasResults) setValue('');
  }, [hasResults]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      onAsk(value.trim());
    } else if (e.key === 'Escape') {
      setValue('');
      onClear();
    }
  };

  return (
    <div className="relative mb-5">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-faint" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type roughly what you remember..."
        className="w-full bg-surface-card border border-edge rounded-tile shadow-inset pl-11 pr-11 py-3.5 text-ts-body text-ink placeholder-ink-faint outline-none focus:border-edge-hover"
      />
      {loading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-faint animate-spin" />}
    </div>
  );
}
