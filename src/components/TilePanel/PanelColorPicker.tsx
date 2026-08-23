import { useState, useRef, useEffect } from 'react';
import { CHIP_COLORS, chipColor } from '@/lib/chipColors';

interface PanelColorPickerProps {
  colorIndex: number;
  onSelect: (colorIndex: number) => void;
}

export function PanelColorPicker({ colorIndex, onSelect }: PanelColorPickerProps) {
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
        className="w-8 h-8 rounded-lg shadow-card border border-edge hover:scale-110 transition-transform"
        style={{ backgroundColor: chipColor(colorIndex) }}
        title="Change color"
      />

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-surface-card rounded-lg shadow-cardHi border border-edge z-10 p-3 w-52">
          <p className="text-xs font-medium text-ink-muted mb-2">Chip colour</p>
          <div className="grid grid-cols-4 gap-2">
            {CHIP_COLORS.map((color, index) => (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                className={`w-10 h-10 rounded-lg shadow-card transition-transform hover:scale-110 ${
                  colorIndex === index ? 'ring-2 ring-offset-2 ring-ink-faint' : ''
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
