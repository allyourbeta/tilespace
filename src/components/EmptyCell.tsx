import { useState } from 'react';

interface EmptyCellProps {
  position: number;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, position: number) => void;
  onClick: (position: number) => void;
  isDragActive: boolean;
}

export function EmptyCell({ position, onDragOver, onDrop, onClick }: EmptyCellProps) {
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggedOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggedOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggedOver(false);
    onDrop(e, position);
  };

  return (
    <div
      onClick={() => onClick(position)}
      onDragOver={onDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-tile flex items-center justify-center transition-colors ${
        isDraggedOver
          ? 'border border-ink-faint bg-white'
          : 'border border-dashed border-edge-soft bg-white/35'
      }`}
    >
      {isDraggedOver && <span className="text-2xl font-light text-ink-muted">+</span>}
    </div>
  );
}
