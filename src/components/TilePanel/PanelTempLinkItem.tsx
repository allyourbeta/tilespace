import { useRef, useEffect } from 'react';

export interface TempLink {
  tempId: string;
  title: string;
  url: string;
  summary: string;
}

interface TempLinkItemProps {
  tempLink: TempLink;
  onChange: (tempId: string, field: keyof Omit<TempLink, 'tempId'>, value: string) => void;
  onBlur: (tempLink: TempLink) => void;
  onRemove: (tempId: string) => void;
}

const INPUT_CLASS = 'w-full px-3 py-2 bg-surface-card border border-edge rounded-[9px] text-ink placeholder-ink-faint focus:outline-none focus:ring-2 focus:ring-ink-faint';

export function PanelTempLinkItem({ tempLink, onChange, onBlur, onRemove }: TempLinkItemProps) {
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleUrlBlur = () => {
    onBlur(tempLink);
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      onBlur(tempLink);
    }
  };

  return (
    <div className="p-3 bg-surface-hover border border-edge rounded-[9px] space-y-2">
      <input
        ref={titleRef}
        type="text"
        value={tempLink.title}
        onChange={(e) => onChange(tempLink.tempId, 'title', e.target.value)}
        placeholder="Link title"
        className={INPUT_CLASS}
      />
      <input
        type="text"
        value={tempLink.summary}
        onChange={(e) => onChange(tempLink.tempId, 'summary', e.target.value)}
        placeholder="Brief note (optional)"
        className={INPUT_CLASS}
      />
      <input
        type="url"
        value={tempLink.url}
        onChange={(e) => onChange(tempLink.tempId, 'url', e.target.value)}
        onBlur={handleUrlBlur}
        onKeyDown={handleUrlKeyDown}
        placeholder="https://..."
        className={INPUT_CLASS}
      />
      <p className="text-xs text-ink-muted">Enter URL and press Tab or Enter to save</p>
      <div className="flex justify-end">
        <button
          onClick={() => onRemove(tempLink.tempId)}
          className="py-2 px-4 text-ink-muted hover:bg-ink/[0.06] rounded-[9px] transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
