import type { ThemeGroup } from '@/services';
import { tileSizeForRank, maxTitlesForRank, titlesForTile, visibleDocs } from '@/services';
import { swatchTextColor } from '@/lib/swatches';

interface ThemeTileProps {
  group: ThemeGroup;
  rank: number;
  onClick: () => void;
  onOpenDoc: (linkId: string) => void;
}

const SPAN_CLASSES = {
  xl: 'col-span-2 row-span-2',
  wide: 'col-span-2 row-span-1',
  sm: 'col-span-1 row-span-1',
} as const;

export function ThemeTile({ group, rank, onClick, onOpenDoc }: ThemeTileProps) {
  const size = tileSizeForRank(rank);
  const docs = visibleDocs(group.docs);
  const { titles, moreCount } = titlesForTile(docs, maxTitlesForRank(rank));
  const color = swatchTextColor(group.theme.swatch);
  const dividerClass = color === '#FFFFFF' ? 'border-white/20' : 'border-black/15';

  return (
    <div
      onClick={onClick}
      className={`${SPAN_CLASSES[size]} rounded-tile shadow-tileLift p-4 overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-px cursor-pointer`}
      style={{ background: group.theme.swatch, color }}
    >
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="flex items-baseline justify-between gap-2 text-left"
      >
        <span className="text-ts-tile font-bold truncate">{group.theme.name}</span>
        <span className="text-ts-meta font-semibold opacity-80 flex-none">{docs.length}</span>
      </button>
      <ul className="mt-2.5 min-h-0 overflow-hidden">
        {titles.map((doc) => (
          <li key={doc.linkId} className={`border-t ${dividerClass} first:border-t-0 first:pt-0`}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenDoc(doc.linkId); }}
              className="w-full text-left text-ts-meta leading-snug py-1 opacity-95 truncate"
            >
              {doc.title || 'Untitled'}
            </button>
          </li>
        ))}
        {moreCount > 0 && (
          <li className={`border-t ${dividerClass}`}>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="w-full text-left text-ts-meta leading-snug py-1 opacity-95 truncate font-semibold"
            >
              {moreCount} more
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
