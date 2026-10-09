import { useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import type { Link } from '@/types';
import * as api from '@/api';
import { useMasterViewStore } from '@/state';
import { groupDocsByTheme, sortDocsNewestFirst, visibleDocs } from '@/services';
import { AskBox } from './AskBox';
import { ThemeTile } from './ThemeTile';
import { ThemeDetail } from './ThemeDetail';
import { DocCard } from './DocCard';

interface MasterViewProps {
  onOpenDocument: (link: Link) => void;
}

export function MasterView({ onOpenDocument }: MasterViewProps) {
  const {
    themes, docs, loading, refreshing, hasOpenedOnce, modelError,
    selectedThemeId, showHidden,
    askResults, askLoading, askError,
    open, selectTheme, toggleShowHidden, hideDoc, restoreDoc, ask, clearAsk,
  } = useMasterViewStore();

  useEffect(() => {
    void open();
  }, [open]);

  const handleOpen = useCallback(async (linkId: string) => {
    try {
      const link = await api.fetchLink(linkId);
      onOpenDocument(link);
    } catch (err) {
      console.error('Failed to open document:', err);
    }
  }, [onOpenDocument]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (askResults !== null) clearAsk();
      else if (selectedThemeId) selectTheme(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [askResults, selectedThemeId, clearAsk, selectTheme]);

  const firstRun = !hasOpenedOnce && themes.length === 0;
  if (firstRun) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-ts-body text-ink-faint">Sorting your documents...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-ink-faint animate-spin" />
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-ts-body text-ink-faint">No documents yet. Notes you save show up here, grouped by theme.</p>
      </div>
    );
  }

  const selectedGroup = selectedThemeId
    ? groupDocsByTheme(docs, themes).find((g) => g.theme.id === selectedThemeId) ?? null
    : null;

  if (selectedGroup) {
    return (
      <div className="h-full overflow-y-auto">
        <ThemeDetail
          group={selectedGroup}
          showHidden={showHidden}
          onToggleHidden={toggleShowHidden}
          onBack={() => selectTheme(null)}
          onOpenDoc={handleOpen}
          onHide={hideDoc}
          onRestore={restoreDoc}
        />
      </div>
    );
  }

  const showUnsorted = !refreshing && themes.length === 0;

  return (
    <div className="h-full overflow-y-auto">
      <AskBox onAsk={ask} onClear={clearAsk} loading={askLoading} hasResults={askResults !== null} />

      {askResults !== null ? (
        askError ? (
          <p className="text-ts-body text-ink-faint">Couldn't search right now. {askError}</p>
        ) : askResults.length === 0 ? (
          <p className="text-ts-body text-ink-faint">Nothing close. Try other words.</p>
        ) : (
          <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {askResults.map((result) => {
              const doc = docs.find((d) => d.linkId === result.linkId);
              return doc ? (
                <DocCard key={doc.linkId} doc={doc} reason={result.reason} onOpen={() => handleOpen(doc.linkId)} />
              ) : null;
            })}
          </div>
        )
      ) : showUnsorted ? (
        <>
          {modelError && (
            <p className="text-ts-body text-ink-faint mb-4">
              Couldn't sort right now. Showing your documents unsorted.
            </p>
          )}
          <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
            {sortDocsNewestFirst(visibleDocs(docs)).map((doc) => (
              <DocCard key={doc.linkId} doc={doc} onOpen={() => handleOpen(doc.linkId)} onHide={() => hideDoc(doc.linkId)} />
            ))}
          </div>
        </>
      ) : (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', gridAutoRows: '150px' }}
        >
          {groupDocsByTheme(docs, themes).map((group, rank) => (
            <ThemeTile
              key={group.theme.id}
              group={group}
              rank={rank}
              onClick={() => selectTheme(group.theme.id)}
              onOpenDoc={handleOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
