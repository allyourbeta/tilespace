import { useState, useRef, useEffect } from 'react';
import type { Palette } from '@/types';

interface PanelColorPickerProps {
  accentColor: string;
  colorIndex: number;
  palette: Palette;
  onSelect: (colorIndex: number) => void;
}

export function PanelColorPicker({ accentColor, colorIndex, palette, onSelect }: PanelColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const handleSelect = (index: number) => {
    onSelect(index);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg shadow-md border-2 border-white hover:scale-110 transition-transform"
        style={{ backgroundColor: accentColor }}
        title="Change color"
      />

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-10 p-3 w-52">
          <p className="text-xs font-medium text-gray-500 mb-2">{palette.name} palette</p>
          <div className="grid grid-cols-4 gap-2">
            {palette.colors.map((color, index) => (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                className={`w-10 h-10 rounded-lg shadow-sm transition-transform hover:scale-110 ${
                  colorIndex === index ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
