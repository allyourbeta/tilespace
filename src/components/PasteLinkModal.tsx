import { useState } from 'react';
import { Tile, Link } from '@/types';
import { getInitials } from '@/utils';
import { chipColor, chipTint } from '@/lib/chipColors';
import { Check, X, Loader2, Link as LinkIcon, ClipboardPaste } from 'lucide-react';

interface PasteLinkModalProps {
  tiles: Tile[];
  onClose: () => void;
  onCreateLink: (tileId: string, data: { title: string; url: string; summary: string }) => Promise<Link>;
}

export function PasteLinkModal({ tiles, onClose, onCreateLink }: PasteLinkModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [step, setStep] = useState<'input' | 'select'>('input');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedTile, setSavedTile] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        setUrl(text);
      }
    } catch {
      // Clipboard access denied - user can paste manually
    }
  };

  const handleContinue = () => {
    if (url.trim()) {
      setStep('select');
    }
  };

  const handleSelectTile = async (tile: Tile) => {
    setSaving(true);
    try {
      await onCreateLink(tile.id, { title: title || url, url, summary: '' });
      setSaved(true);
      setSavedTile(tile.title);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Failed to save link:', err);
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-surface-card rounded-lg shadow-cardHi p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-ink mb-1">Saved!</h2>
          <p className="text-ink-2">Added to {savedTile}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card rounded-lg max-w-md w-full shadow-cardHi border border-edge overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-edge">
          <h2 className="text-lg font-semibold text-ink">
            {step === 'input' ? 'Add Link' : 'Choose Tile'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/[0.05] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-ink-2" />
          </button>
        </div>

        {step === 'input' ? (
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1.5">
                  URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-3 py-2.5 border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-faint focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handlePaste}
                    className="px-3 py-2.5 bg-black/[0.04] hover:bg-black/[0.07] rounded-lg transition-colors"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="w-5 h-5 text-ink-2" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-2 mb-1.5">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Page title"
                  className="w-full px-3 py-2.5 border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-ink-faint focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!url.trim()}
              className="w-full mt-6 py-3 bg-ink text-white font-semibold rounded-lg hover:opacity-90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="bg-black/[0.03] rounded-lg p-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-surface-card rounded-lg">
                  <LinkIcon className="w-4 h-4 text-ink-2" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink truncate text-sm">
                    {title || 'Untitled'}
                  </p>
                  <p className="text-xs text-ink-muted truncate">{url}</p>
                </div>
              </div>
            </div>

            {tiles.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <p className="text-sm text-ink-2">No tiles yet.</p>
                <p className="text-xs text-ink-faint">Create a tile first to save links.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {tiles.map(tile => (
                  <button
                    key={tile.id}
                    onClick={() => handleSelectTile(tile)}
                    disabled={saving}
                    className="p-3 rounded-lg text-left transition-all border border-edge hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: chipTint(tile.color_index) }}
                  >
                    <span className="text-xl mb-1 block font-medium tracking-wide" style={{ color: chipColor(tile.color_index) }}>{getInitials(tile.title)}</span>
                    <span className="text-ink font-semibold text-sm block truncate">
                      {tile.title}
                    </span>
                    <span className="text-ink-muted text-xs">
                      {tile.links?.length || 0} links
                    </span>
                  </button>
                ))}
              </div>
            )}

            {saving && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                <Loader2 className="w-6 h-6 text-ink-faint animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
