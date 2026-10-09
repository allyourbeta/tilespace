import type { ThemeGroup } from '@/services';
import { tileSizeForRank, maxTitlesForRank, visibleDocs } from '@/services';

interface ThemeTileProps {
  group: ThemeGroup;
  rank: number;
  onClick: () => void;
}

const SPAN_CLASSES = {
  xl: 'col-span-2 row-span-2',
  wide: 'col-span-2 row-span-1',
  sm: 'col-span-1 row-span-1',
} as const;

export function ThemeTile({ group, rank, onClick }: ThemeTileProps) {
  const size = tileSizeForRank(rank);
  const docs = visibleDocs(group.docs);
  const titles = docs.slice(0, maxTitlesForRank(rank));

  return (
    <button
      onClick={onClick}
      className={`${SPAN_CLASSES[size]} rounded-tile p-4 text-left text-white overflow-hidden flex flex-col transition-transform duration-150 hover:-translate-y-px`}
      style={{ background: group.theme.swatch }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-ts-tile font-bold truncate">{group.theme.name}</span>
        <span className="text-ts-meta font-semibold opacity-80 flex-none">{docs.length}</span>
      </div>
      <ul className="mt-2.5 min-h-0 overflow-hidden">
        {titles.map((doc) => (
          <li
            key={doc.linkId}
            className="text-ts-meta leading-snug py-1 border-t border-white/20 opacity-95 truncate first:border-t-0 first:pt-0"
          >
            {doc.title || 'Untitled'}
          </li>
        ))}
      </ul>
    </button>
  );
}
