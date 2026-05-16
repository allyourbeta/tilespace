import { useState } from 'react';

interface EmptyCellProps {
  position: number;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, position: number) => void;
  onClick: (position: number) => void;
  isDragActive: boolean;
}

export function EmptyCell({ position, onDragOver, onDrop, onClick, isDragActive }: EmptyCellProps) {
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
      className={`
        rounded-2xl shadow-inner border flex items-center justify-center transition-all
        ${isDraggedOver
          ? 'bg-white/20 border-white/50 shadow-[0_0_15px_rgba(255,255,255,0.2)] scale-[1.02]'
          : isDragActive
            ? 'bg-black/5 border-white/20 border-dashed'
            : 'bg-black/5 border-white/10'
        }
      `}
    >
      <span className={`text-2xl font-light transition-all ${
        isDraggedOver ? 'text-white/80 scale-125' : 'text-white/50'
      }`}>
        {isDraggedOver ? '+' : '-'}
      </span>
    </div>
  );
}
