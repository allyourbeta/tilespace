import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { usePageNavigation, useKeyboardNavigation, useIsMobile } from './hooks';
import { getPalette } from '@/types';
import { darkenColor } from '@/utils/color';
import { APP_CONFIG } from '@/lib/constants';
import { TilePanel } from '@/components/TilePanel';
import { FloatingActions } from '@/components/FloatingActions';
import { PasteLinkModal } from '@/components/PasteLinkModal';
import { DocumentEditor } from '@/components/DocumentEditor';
import { UserMenu } from '@/components/UserMenu';
import { PageDots } from '@/components/PageDots';
import { OverviewMode } from '@/components/OverviewMode';
import { PageTitleDisplay } from '@/components/PageTitleDisplay';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { usePageStore, useTileStore, useUIStore } from '@/state';
import { useWelcomeBack } from '@/hooks/useWelcomeBack';
import { useTileGrid } from '@/hooks/useTileGrid';
import { useTileHandlers } from '@/hooks/useTileHandlers';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();

  const pages = usePageStore(s => s.pages);
  const currentPageId = usePageStore(s => s.currentPageId);
  const pageError = usePageStore(s => s.error);
  const loadPages = usePageStore(s => s.loadPages);
  const setCurrentPageId = usePageStore(s => s.setCurrentPageId);
  const pageCreatePage = usePageStore(s => s.createPage);
  const swapPages = usePageStore(s => s.swapPages);
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
  const showOverview = useUIStore(s => s.showOverview);
  const isPageTransitioning = useUIStore(s => s.isPageTransitioning);
  const setSelectedTileId = useUIStore(s => s.setSelectedTileId);
  const setIsNewTile = useUIStore(s => s.setIsNewTile);
  const setShowPasteLink = useUIStore(s => s.setShowPasteLink);
  const setEditingDocument = useUIStore(s => s.setEditingDocument);
  const setShowOverview = useUIStore(s => s.setShowOverview);
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

  useWelcomeBack(pages.length, selectedTileId, editingDocument);

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

  const { sortedPages, goToNextPage, goToPrevPage, goToPage } = usePageNavigation({
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
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  if (tilesLoading || !currentPage) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{pageError}</p>
          <button
            onClick={() => { loadPages(); loadTiles(); }}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const currentPalette = getPalette(currentPaletteId);
  const bgColor = currentPalette.background;

  return (
    <div
      className="h-screen w-screen overflow-hidden relative"
      style={{ background: `radial-gradient(ellipse at center, ${bgColor} 0%, ${darkenColor(bgColor, 25)} 100%)` }}
      {...swipeHandlers}
    >
      {/* Grain texture overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.15 }}>
        <filter id="tilespace-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#tilespace-grain)" />
      </svg>

      <PageTitleDisplay currentPage={currentPage} currentPageId={currentPageId} pages={pages} onShowOverview={() => setShowOverview(true)} />

      <div
        className={`h-full w-full grid ${isMobile ? 'gap-2 p-2 pt-10 pb-16 overflow-y-auto' : 'gap-4 p-4'} transition-all duration-150 ease-out ${isPageTransitioning ? 'opacity-0 scale-[0.97]' : 'opacity-100 scale-100'}`}
        style={{
          ...(isMobile ? mobileGridStyle : gridStyle),
          ...(!isMobile ? {} : {}),
        }}
      >
        {gridCells}
      </div>

      <PageDots
        pages={pages}
        currentPageId={currentPageId!}
        onPageSelect={goToPage}
        onShowOverview={() => setShowOverview(true)}
        onCreatePage={handleCreatePage}
      />

      {selectedTile && (
        <TilePanel
          tile={selectedTile}
          currentPaletteId={currentPaletteId}
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
        onShowOverview={() => setShowOverview(true)}
        tiles={tiles}
        onCreateLink={tileCreateLink}
        onSelectTile={(id) => { setSelectedTileId(id); setIsNewTile(false); }}
      />

      <UserMenu />

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

      {showOverview && (
        <OverviewMode
          pages={pages}
          currentPageId={currentPageId!}
          onClose={() => setShowOverview(false)}
          onPageSelect={goToPage}
          onSwapPages={swapPages}
          onUpdatePageTitle={updatePageTitle}
          onResetPage={pageResetPage}
        />
      )}
    </div>
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
