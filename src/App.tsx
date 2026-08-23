import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { usePageNavigation, useKeyboardNavigation, useIsMobile } from './hooks';
import { APP_CONFIG } from '@/lib/constants';
import { TilePanel } from '@/components/TilePanel';
import { FloatingActions } from '@/components/FloatingActions';
import { PasteLinkModal } from '@/components/PasteLinkModal';
import { DocumentEditor } from '@/components/DocumentEditor';
import { PageDots } from '@/components/PageDots';
import { AppShell } from '@/components/AppShell';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { usePageStore, useTileStore, useUIStore } from '@/state';
import { useTileGrid } from '@/hooks/useTileGrid';
import { useTileHandlers } from '@/hooks/useTileHandlers';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const pages = usePageStore(s => s.pages);
  const tileCounts = usePageStore(s => s.tileCounts);
  const currentPageId = usePageStore(s => s.currentPageId);
  const pageError = usePageStore(s => s.error);
  const loadPages = usePageStore(s => s.loadPages);
  const setCurrentPageId = usePageStore(s => s.setCurrentPageId);
  const pageCreatePage = usePageStore(s => s.createPage);
  const insertPage = usePageStore(s => s.insertPage);
  const updatePageTitle = usePageStore(s => s.updatePageTitle);
  const pageResetPage = usePageStore(s => s.resetPage);

  const tiles = useTileStore(s => s.tiles);
  const tilesLoading = useTileStore(s => s.loading);
  const loadTiles = useTileStore(s => s.loadTiles);
  const tileCreateTile = useTileStore(s => s.createTile);
  const tileUpdateTile = useTileStore(s => s.updateTile);
  const tileUpdateColor = useTileStore(s => s.updateTileColor);
  const tileDelete = useTileStore(s => s.deleteTile);
  const tileCreateLink = useTileStore(s => s.createLink);
  const tileUpdateLink = useTileStore(s => s.updateLink);
  const tileDeleteLink = useTileStore(s => s.deleteLink);
  const changePalette = useTileStore(s => s.changePalette);

  const selectedTileId = useUIStore(s => s.selectedTileId);
  const isNewTile = useUIStore(s => s.isNewTile);
  const showPasteLink = useUIStore(s => s.showPasteLink);
  const editingDocument = useUIStore(s => s.editingDocument);
  const isPageTransitioning = useUIStore(s => s.isPageTransitioning);
  const setSelectedTileId = useUIStore(s => s.setSelectedTileId);
  const setIsNewTile = useUIStore(s => s.setIsNewTile);
  const setShowPasteLink = useUIStore(s => s.setShowPasteLink);
  const setEditingDocument = useUIStore(s => s.setEditingDocument);
  const setIsPageTransitioning = useUIStore(s => s.setIsPageTransitioning);
  const closeTilePanel = useUIStore(s => s.closeTilePanel);

  const currentPage = useMemo(
    () => currentPageId ? pages.find(p => p.id === currentPageId) ?? null : null,
    [pages, currentPageId]
  );
  const currentPaletteId = currentPage?.palette_id ?? 'ocean';

  const selectedTile = useMemo(
    () => selectedTileId ? tiles.find(t => t.id === selectedTileId) ?? null : null,
    [tiles, selectedTileId]
  );

  const prevPageIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevPageIdRef.current && prevPageIdRef.current !== currentPageId) {
      setIsPageTransitioning(true);
      const timer = setTimeout(() => setIsPageTransitioning(false), 150);
      return () => clearTimeout(timer);
    }
    prevPageIdRef.current = currentPageId;
  }, [currentPageId, setIsPageTransitioning]);

  useEffect(() => {
    document.title = APP_CONFIG.TITLE;
    if (user) loadPages();
  }, [user, loadPages]);

  useEffect(() => {
    if (currentPageId) loadTiles();
  }, [currentPageId, loadTiles]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  const { goToNextPage, goToPrevPage, goToPage } = usePageNavigation({
    pages,
    currentPageId,
    setCurrentPageId,
    setSelectedTileId,
  });

  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNextPage,
    onSwipedRight: goToPrevPage,
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 50,
  });

  useKeyboardNavigation(goToPrevPage, goToNextPage);

  const { handlePasteLink, handleAddNote, handleSaveDocument, handleOpenDocument } =
    useTileHandlers();

  const { gridCells, gridStyle, mobileGridStyle, canAddMore } =
    useTileGrid();

  const handleCreatePage = useCallback(async () => {
    await pageCreatePage(currentPaletteId);
  }, [pageCreatePage, currentPaletteId]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ink-faint animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (tilesLoading || !currentPage) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-ink-faint animate-spin" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-surface-page flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink-2 mb-4">{pageError}</p>
          <button
            onClick={() => { loadPages(); loadTiles(); }}
            className="px-4 py-2 bg-ink text-white rounded-lg hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      pages={pages}
      tileCounts={tileCounts}
      currentPage={currentPage}
      currentPageId={currentPageId}
      onPageSelect={goToPage}
      onInsertPage={insertPage}
      onUpdatePageTitle={updatePageTitle}
      onResetPage={pageResetPage}
      onCreatePage={handleCreatePage}
      isMobile={isMobile}
      isMobileSidebarOpen={isMobileSidebarOpen}
      onMobileSidebarOpen={() => setIsMobileSidebarOpen(true)}
      onMobileSidebarClose={() => setIsMobileSidebarOpen(false)}
    >
      <div
        className={`h-full w-full grid ${isMobile ? 'gap-2 pb-16 overflow-y-auto' : 'gap-3'} transition-all duration-150 ease-out ${isPageTransitioning ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100'}`}
        style={isMobile ? mobileGridStyle : gridStyle}
        {...swipeHandlers}
      >
        {gridCells}
      </div>

      <PageDots
        pages={pages}
        currentPageId={currentPageId!}
        onPageSelect={goToPage}
      />

      {selectedTile && (
        <TilePanel
          tile={selectedTile}
          isNewTile={isNewTile}
          isDocumentOpen={!!editingDocument}
          onClose={closeTilePanel}
          onUpdateTile={tileUpdateTile}
          onUpdateTileColor={tileUpdateColor}
          onResetTile={tileDelete}
          onCreateLink={tileCreateLink}
          onUpdateLink={tileUpdateLink}
          onDeleteLink={tileDeleteLink}
          onOpenDocument={handleOpenDocument}
          onAddNote={() => handleAddNote(selectedTile)}
        />
      )}

      <FloatingActions
        onAddTile={tileCreateTile}
        onPasteLink={handlePasteLink}
        onAddNote={() => handleAddNote()}
        canAddTile={canAddMore}
        currentPaletteId={currentPaletteId}
        onSelectPalette={changePalette}
        tiles={tiles}
        onCreateLink={tileCreateLink}
        onSelectTile={(id) => { setSelectedTileId(id); setIsNewTile(false); }}
      />

      {showPasteLink && (
        <PasteLinkModal
          tiles={tiles}
          onClose={() => setShowPasteLink(false)}
          onCreateLink={tileCreateLink}
        />
      )}

      {editingDocument && (
        <DocumentEditor
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSave={handleSaveDocument}
          onDelete={tileDeleteLink}
        />
      )}
    </AppShell>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
