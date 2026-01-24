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

export function TempLinkItem({ tempLink, onChange, onBlur, onRemove }: TempLinkItemProps) {
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
    <div className="p-4 bg-amber-50 rounded-xl space-y-3 border border-amber-200">
      <input
        ref={titleRef}
        type="text"
        value={tempLink.title}
        onChange={(e) => onChange(tempLink.tempId, 'title', e.target.value)}
        placeholder="Link title"
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <input
        type="text"
        value={tempLink.summary}
        onChange={(e) => onChange(tempLink.tempId, 'summary', e.target.value)}
        placeholder="Brief note (optional)"
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <input
        type="url"
        value={tempLink.url}
        onChange={(e) => onChange(tempLink.tempId, 'url', e.target.value)}
        onBlur={handleUrlBlur}
        onKeyDown={handleUrlKeyDown}
        placeholder="https://..."
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-300"
      />
      <p className="text-xs text-amber-600">Enter URL and press Tab or Enter to save</p>
      <div className="flex justify-end">
        <button
          onClick={() => onRemove(tempLink.tempId)}
          className="py-2 px-4 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
