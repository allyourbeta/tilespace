import { useState, useRef, useEffect } from 'react';
import { Plus, X, Link as LinkIcon, FileText } from 'lucide-react';
import { PaletteSelector } from './PaletteSelector';

interface FloatingActionsProps {
  onAddTile: () => void;
  onPasteLink: () => void;
  onAddNote: () => void;
  canAddTile: boolean;
  currentPaletteId: string;
  onSelectPalette: (paletteId: string) => void;
}

export function FloatingActions({ onAddTile, onPasteLink, onAddNote, canAddTile, currentPaletteId, onSelectPalette }: FloatingActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleAddTile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur(); // Remove focus to prevent Enter re-triggering
    onAddTile();
    setIsOpen(false);
  };

  const handlePasteLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    onPasteLink();
    setIsOpen(false);
  };

  const handleAddNote = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    onAddNote();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-end gap-2">
      <div ref={menuRef} className="relative">
        <div
          className={`
            absolute bottom-full left-0 mb-2
            transition-all duration-200 ease-out origin-bottom-left
            ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
          `}
        >
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[180px]">
            {canAddTile && (
              <button
                type="button"
                onClick={handleAddTile}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Plus className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="font-medium text-gray-700">Add New Tile</span>
              </button>
            )}
            <button
              type="button"
              onClick={handlePasteLink}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${canAddTile ? 'border-t border-gray-100' : ''}`}
            >
              <div className="p-1.5 bg-sky-100 rounded-lg">
                <LinkIcon className="w-4 h-4 text-sky-600" />
              </div>
              <span className="font-medium text-gray-700">Add Link</span>
            </button>
            <button
              type="button"
              onClick={handleAddNote}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t border-gray-100"
            >
              <div className="p-1.5 bg-teal-100 rounded-lg">
                <FileText className="w-4 h-4 text-teal-600" />
              </div>
              <span className="font-medium text-gray-700">Add Note</span>
            </button>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            p-3.5 rounded-full shadow-lg hover:shadow-xl
            transition-all duration-200 ease-out hover:scale-105
            ${isOpen
              ? 'bg-gray-900 text-white'
              : 'bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white'
            }
          `}
          title="Actions"
        >
          {isOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>

      <PaletteSelector
        currentPaletteId={currentPaletteId}
        onSelectPalette={onSelectPalette}
      />
    </div>
  );
}
