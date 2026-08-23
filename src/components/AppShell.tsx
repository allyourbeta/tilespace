import type { ReactNode } from 'react';
import type { Page } from '@/types';
import { getPalette } from '@/types';
import { LAYOUT } from '@/lib/constants';
import { Sidebar } from '@/components/Sidebar';

interface AppShellProps {
  pages: Page[];
  tileCounts: Record<string, number>;
  currentPage: Page | null;
  currentPageId: string | null;
  onPageSelect: (id: string) => void;
  onInsertPage: (draggedId: string, targetPosition: number) => void;
  onUpdatePageTitle: (id: string, title: string) => void;
  onResetPage: (id: string) => void;
  onCreatePage: () => void;
  isMobile: boolean;
  isMobileSidebarOpen: boolean;
  onMobileSidebarOpen: () => void;
  onMobileSidebarClose: () => void;
  children: ReactNode;
}

export function AppShell({
  pages, tileCounts, currentPage, currentPageId,
  onPageSelect, onInsertPage, onUpdatePageTitle, onResetPage, onCreatePage,
  isMobile, isMobileSidebarOpen, onMobileSidebarOpen, onMobileSidebarClose,
  children,
}: AppShellProps) {
  const paletteBg = currentPage ? getPalette(currentPage.palette_id).background : null;
  const gutter = isMobile ? 16 : LAYOUT.GUTTER_PX;

  return (
    <div
      className="h-screen w-screen overflow-hidden flex bg-surface-page"
      style={paletteBg ? {
        backgroundImage: `radial-gradient(1200px 620px at 18% -12%, ${paletteBg}12 0%, rgba(0,0,0,0) 62%)`,
      } : undefined}
    >
      {isMobile && isMobileSidebarOpen && (
        <div className="fixed inset-0 z-10 bg-black/[0.28]" onClick={onMobileSidebarClose} />
      )}
      {(!isMobile || isMobileSidebarOpen) && (
        <Sidebar
          pages={pages}
          tileCounts={tileCounts}
          currentPageId={currentPageId}
          onPageSelect={(id) => { onPageSelect(id); if (isMobile) onMobileSidebarClose(); }}
          onInsertPage={onInsertPage}
          onUpdatePageTitle={onUpdatePageTitle}
          onResetPage={onResetPage}
          onCreatePage={onCreatePage}
          isMobile={isMobile}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        <header
          className={`flex-none flex items-center gap-2.5 ${isMobile ? 'cursor-pointer' : ''}`}
          style={{ height: LAYOUT.HEADER_HEIGHT_PX, padding: `0 ${gutter}px` }}
          onClick={isMobile ? onMobileSidebarOpen : undefined}
        >
          {currentPage && (
            <>
              <span className="w-[13px] h-[13px] rounded flex-none" style={{ background: paletteBg ?? undefined }} />
              <h1 className="text-[1.1875rem] font-bold tracking-tight text-ink truncate">{currentPage.title}</h1>
              {isMobile && <span className="text-ink-faint text-xs">▾</span>}
            </>
          )}
        </header>

        <div className="flex-1 min-h-0" style={{ padding: `0 ${gutter}px 6px` }}>
          {children}
        </div>

        <footer className="flex-none" style={{ height: LAYOUT.FOOTER_HEIGHT_PX }} />
      </div>
    </div>
  );
}
