import { Tile, Link } from '@/types';
import { isValidUrl } from '@/utils/url';
import { getInitials } from '@/utils';
import { chipColor, chipTint } from '@/lib/chipColors';

interface TileSubmenuProps {
  tiles: Tile[];
  onCreateLink: (tileId: string, data: { title: string; url: string; summary: string }) => Promise<Link>;
  onSelectTile: (tileId: string) => void;
  onClose: () => void;
}

async function readClipboardUrl(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText();
    const trimmed = text?.trim();
    if (!trimmed) return null;
    const candidate = (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))
      ? `https://${trimmed}` : trimmed;
    return isValidUrl(candidate) ? candidate : null;
  } catch {
    return null;
  }
}

export function TileSubmenu({ tiles, onCreateLink, onSelectTile, onClose }: TileSubmenuProps) {
  const sortedTiles = [...tiles].sort((a, b) => a.position - b.position);

  const handleTileClick = async (tileId: string) => {
    const url = await readClipboardUrl();
    if (url) {
      try {
        await onCreateLink(tileId, { title: url, url, summary: '' });
      } catch { /* duplicate or error — still open panel */ }
    }
    onSelectTile(tileId);
    onClose();
  };

  if (sortedTiles.length === 0) return null;

  return (
    <div data-testid="tile-submenu" className="absolute left-full bottom-0 ml-2 z-50">
      <div className="bg-surface-card rounded-lg shadow-cardHi border border-edge p-2 grid grid-cols-2 gap-1.5 min-w-[220px] max-h-[300px] overflow-y-auto">
        {sortedTiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => handleTileClick(tile.id)}
            className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all hover:scale-[1.03]"
            style={{ backgroundColor: chipTint(tile.color_index) }}
          >
            <span className="text-xs font-medium shrink-0 tracking-wide" style={{ color: chipColor(tile.color_index) }}>{getInitials(tile.title)}</span>
            <span className="text-xs font-medium text-ink-2 truncate">{tile.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
