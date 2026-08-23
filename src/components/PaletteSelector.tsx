import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { PALETTES, Palette as PaletteType } from '@/types';

interface PaletteSelectorProps {
  currentPaletteId: string;
  onSelectPalette: (paletteId: string) => void;
}

export function PaletteSelector({ currentPaletteId, onSelectPalette }: PaletteSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const currentPalette = PALETTES.find(p => p.id === currentPaletteId) || PALETTES[0];
  const vibrantPalettes = PALETTES.filter(p => p.category === 'vibrant');
  const mutedPalettes = PALETTES.filter(p => p.category === 'muted');

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-[34px] min-w-[34px] px-2.5 rounded-lg bg-surface-card border border-edge shadow-card hover:border-edge-hover transition-colors flex items-center gap-2"
        title="Change color theme"
      >
        <Palette className="w-[18px] h-[18px] text-ink-2" />
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: currentPalette.background }}
          />
          <div
            className="w-4 h-4 rounded"
            style={{ backgroundColor: currentPalette.border }}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 bg-surface-card rounded-lg shadow-cardHi border border-edge overflow-hidden w-80 z-50">
          <div className="p-3 border-b border-edge">
            <h3 className="text-sm font-semibold text-ink">Color Theme</h3>
            <p className="text-xs text-ink-muted mt-0.5">Background & accent colors</p>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="px-2 py-1.5 mb-1">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Vibrant</span>
              </div>
              {vibrantPalettes.map((palette) => (
                <PaletteOption
                  key={palette.id}
                  palette={palette}
                  isSelected={palette.id === currentPaletteId}
                  onSelect={() => {
                    onSelectPalette(palette.id);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
            <div className="p-2 border-t border-edge">
              <div className="px-2 py-1.5 mb-1">
                <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Muted / Pastel</span>
              </div>
              {mutedPalettes.map((palette) => (
                <PaletteOption
                  key={palette.id}
                  palette={palette}
                  isSelected={palette.id === currentPaletteId}
                  onSelect={() => {
                    onSelectPalette(palette.id);
                    setIsOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface PaletteOptionProps {
  palette: PaletteType;
  isSelected: boolean;
  onSelect: () => void;
}

function PaletteOption({ palette, isSelected, onSelect }: PaletteOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full p-2.5 rounded-lg flex items-center gap-3 transition-all ${
        isSelected
          ? 'bg-black/[0.04] ring-2 ring-ink-faint'
          : 'hover:bg-black/[0.03]'
      }`}
    >
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: palette.background }}
      >
        <div
          className="w-6 h-6 rounded bg-white/90"
          style={{ border: `3px solid ${palette.border}` }}
        />
      </div>
      <div className="flex-1 text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-ink">{palette.name}</span>
          {isSelected && <Check className="w-4 h-4 text-ink-2" />}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-xs text-ink-faint">Background</span>
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: palette.background }}
          />
          <span className="text-xs text-ink-faint ml-1">Border</span>
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: palette.border }}
          />
        </div>
      </div>
    </button>
  );
}
