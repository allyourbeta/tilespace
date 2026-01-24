import { useState, useEffect } from 'react';
import { Tile } from '../types';
import { fetchTiles, createLink } from '../lib/db';
import { Check, X, Loader2, Link as LinkIcon, ClipboardPaste, AlertCircle } from 'lucide-react';

interface PasteLinkModalProps {
  onClose: () => void;
  onLinkAdded: () => void;
}

export function PasteLinkModal({ onClose, onLinkAdded }: PasteLinkModalProps) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [step, setStep] = useState<'input' | 'select'>('input');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedTile, setSavedTile] = useState('');

  useEffect(() => {
    fetchTiles()
      .then(data => {
        setTiles(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load tiles:', err);
        setLoadError('Failed to load tiles. Please try again.');
        setLoading(false);
      });
  }, []);

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
      const position = tile.links?.length || 0;
      await createLink(tile.id, position, title || url, url, '');
      setSaved(true);
      setSavedTile(tile.title);
      setTimeout(() => {
        onLinkAdded();
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
        <div className="bg-white rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Saved!</h2>
          <p className="text-gray-600">Added to {savedTile}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            {step === 'input' ? 'Add Link' : 'Choose Tile'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {step === 'input' ? (
          <div className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={handlePaste}
                    className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Page title"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>

            <button
              onClick={handleContinue}
              disabled={!url.trim()}
              className="w-full mt-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        ) : (
          <div className="p-4">
            <div className="bg-stone-100 rounded-xl p-3 mb-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg">
                  <LinkIcon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate text-sm">
                    {title || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{url}</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="py-8 flex justify-center">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            ) : loadError ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <AlertCircle className="w-8 h-8 text-red-400" />
                <p className="text-sm text-gray-600 text-center">{loadError}</p>
                <button
                  onClick={() => {
                    setLoadError(null);
                    setLoading(true);
                    fetchTiles()
                      .then(data => {
                        setTiles(data);
                        setLoading(false);
                      })
                      .catch(err => {
                        console.error('Failed to load tiles:', err);
                        setLoadError('Failed to load tiles. Please try again.');
                        setLoading(false);
                      });
                  }}
                  className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-800"
                >
                  Retry
                </button>
              </div>
            ) : tiles.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <p className="text-sm text-gray-500">No tiles yet.</p>
                <p className="text-xs text-gray-400">Create a tile first to save links.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
                {tiles.map(tile => (
                  <button
                    key={tile.id}
                    onClick={() => handleSelectTile(tile)}
                    disabled={saving}
                    className="p-3 rounded-xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: tile.accent_color }}
                  >
                    <span className="text-2xl mb-1 block">{tile.emoji}</span>
                    <span className="text-white font-semibold text-sm block truncate">
                      {tile.title}
                    </span>
                    <span className="text-white/70 text-xs">
                      {tile.links?.length || 0} links
                    </span>
                  </button>
                ))}
              </div>
            )}

            {saving && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
