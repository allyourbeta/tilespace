import { ChevronLeft } from 'lucide-react';
import type { ThemeGroup } from '@/services';
import { visibleDocs, hiddenDocs } from '@/services';
import { DocCard } from './DocCard';

interface ThemeDetailProps {
  group: ThemeGroup;
  showHidden: boolean;
  onToggleHidden: () => void;
  onBack: () => void;
  onOpenDoc: (linkId: string) => void;
  onHide: (linkId: string) => void;
  onRestore: (linkId: string) => void;
}

export function ThemeDetail({
  group, showHidden, onToggleHidden, onBack, onOpenDoc, onHide, onRestore,
}: ThemeDetailProps) {
  const visible = visibleDocs(group.docs);
  const hidden = hiddenDocs(group.docs);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-ts-body text-ink-2 hover:text-ink mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Master View
      </button>

      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-3 h-3 rounded flex-none" style={{ background: group.theme.swatch }} />
        <h2 className="text-ts-head font-bold text-ink">{group.theme.name}</h2>
        <span className="text-ts-meta text-ink-faint">{visible.length} documents</span>
      </div>

      {visible.length === 0 ? (
        <p className="text-ts-body text-ink-faint">Everything here is hidden.</p>
      ) : (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
          {visible.map((doc) => (
            <DocCard key={doc.linkId} doc={doc} onOpen={() => onOpenDoc(doc.linkId)} onHide={() => onHide(doc.linkId)} />
          ))}
        </div>
      )}

      {hidden.length > 0 && (
        <div className="mt-5 text-ts-meta text-ink-muted">
          {!showHidden ? (
            <button onClick={onToggleHidden} className="hover:text-ink">
              {hidden.length} hidden. <span className="underline">Show hidden</span>
            </button>
          ) : (
            <>
              <button onClick={onToggleHidden} className="hover:text-ink mb-3">
                <span className="underline">Hide hidden</span>
              </button>
              <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
                {hidden.map((doc) => (
                  <DocCard key={doc.linkId} doc={doc} onOpen={() => onOpenDoc(doc.linkId)} onRestore={() => onRestore(doc.linkId)} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
