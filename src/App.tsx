import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { usePageNavigation, useKeyboardNavigation, useIsMobile } from './hooks';
import { Tile, Link, getGridConfig, getGridCapacity, getColorFromPalette, getPalette } from './types';
import { Page } from './types/page';
import {
  fetchPages,
  updatePage,
  updatePagePalette,
  recolorAllTiles,
  swapPagePositions,
  resetPage,
  createTile,
  updateTile,
  updateTileColor,
  deleteTile,
  swapTilePositions,
  moveTileToPosition,
  createLink,
  createDocument,
  updateLink,
  deleteLink,
  moveLink,
  fetchTiles
} from './lib/db';
import { APP_CONFIG, INBOX_TILE, TIMING } from './lib/constants';
import { TileCard } from './components/TileCard';
import { TilePanel } from './components/TilePanel';
import { FloatingActions } from './components/FloatingActions';
import { PasteLinkModal } from './components/PasteLinkModal';
import { DocumentEditor } from './components/DocumentEditor';
import { UserMenu } from './components/UserMenu';
import { PageDots } from './components/PageDots';
import { OverviewMode } from './components/OverviewMode';
import { PageTitleDisplay } from './components/PageTitleDisplay';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './pages/LoginPage';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  
  // Page state
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  
  // Tile state (for current page)
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [isNewTile, setIsNewTile] = useState(false);
  const [draggedTileId, setDraggedTileId] = useState<string | null>(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasteLink, setShowPasteLink] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Link | null>(null);
  const [showOverview, setShowOverview] = useState(false);

  // Derived state
  const currentPage = useMemo(() => {
    if (!currentPageId) return null;
    return pages.find(p => p.id === currentPageId) ?? null;
  }, [pages, currentPageId]);

  const currentPaletteId = currentPage?.palette_id ?? 'ocean';

  const selectedTile = useMemo(() => {
    if (!selectedTileId) return null;
    return tiles.find(t => t.id === selectedTileId) ?? null;
  }, [tiles, selectedTileId]);


  // Load pages on mount
  const loadPages = useCallback(async () => {
    try {
      setError(null);
      const pagesData = await fetchPages();
      setPages(pagesData);
      
      // Set current page to first page if not set
      if (pagesData.length > 0 && !currentPageId) {
        const sorted = [...pagesData].sort((a, b) => a.position - b.position);
        setCurrentPageId(sorted[0].id);
      }
    } catch (err) {
      setError('Failed to load pages');
      console.error(err);
    }
  }, [currentPageId]);

  // Load tiles when current page changes
  const loadTiles = useCallback(async () => {
    if (!currentPageId) return;
    
    try {
      setError(null);
      const tilesData = await fetchTiles(currentPageId);
      setTiles(tilesData);
    } catch (err) {
      setError('Failed to load tiles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPageId]);

  useEffect(() => {
    document.title = APP_CONFIG.TITLE;
    if (user) {
      loadPages();
    }
  }, [user, loadPages]);

  useEffect(() => {
    if (currentPageId) {
      setLoading(true);
      loadTiles();
    }
  }, [currentPageId, loadTiles]);

  // Page navigation
  const { sortedPages, currentPageIndex, goToNextPage, goToPrevPage, goToPage } = usePageNavigation({
    pages,
    currentPageId,
    setCurrentPageId,
    setSelectedTileId,
  });

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: goToNextPage,
    onSwipedRight: goToPrevPage,
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 50,
  });

  // Keyboard navigation
  // Keyboard navigation
  useKeyboardNavigation(goToPrevPage, goToNextPage);

  // Page handlers
  const handleUpdatePageTitle = async (pageId: string, title: string) => {
    try {
      await updatePage(pageId, { title });
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, title } : p));
    } catch (err) {
      console.error('Failed to update page title:', err);
    }
  };

  const handleSwapPages = async (pageAId: string, pageBId: string) => {
    try {
      await swapPagePositions(pageAId, pageBId);
      // Reload pages to get updated positions
      await loadPages();
    } catch (err) {
      console.error('Failed to swap pages:', err);
    }
  };

  const handleResetPage = async (pageId: string) => {
    try {
      await resetPage(pageId);
      // If we're currently on this page, reload tiles
      if (currentPageId === pageId) {
        await loadTiles();
      }
    } catch (err) {
      console.error('Failed to reset page:', err);
    }
  };

  // Palette change (now per-page)
  const paletteDebounceRef = useRef<number | null>(null);

  const handlePaletteChange = async (paletteId: string) => {
    if (!currentPageId) return;
    
    // Update page's palette
    setPages(prev => prev.map(p => 
      p.id === currentPageId ? { ...p, palette_id: paletteId } : p
    ));
    
    if (paletteDebounceRef.current) {
      clearTimeout(paletteDebounceRef.current);
    }
    
    paletteDebounceRef.current = window.setTimeout(async () => {
      try {
        await updatePagePalette(currentPageId, paletteId);
        const recoloredTiles = await recolorAllTiles(currentPageId, paletteId);
        setTiles(recoloredTiles);
      } catch (err) {
        console.error('Failed to change palette:', err);
      }
    }, TIMING.DEBOUNCE_DELAY_MS);
  };

  // Tile handlers (same as before, but using currentPageId)
  const handleCreateTile = async () => {
    if (!currentPageId) return;
    
    try {
      const newTile = await createTile(currentPageId, currentPaletteId);
      setTiles(prev => [...prev, newTile]);
      setIsNewTile(true);
      setSelectedTileId(newTile.id);
    } catch (err) {
      console.error('Failed to create tile:', err);
    }
  };

  const handleUpdateTile = async (id: string, updates: Partial<Tile>) => {
    try {
      await updateTile(id, updates);
      setTiles(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (err) {
      console.error('Failed to update tile:', err);
    }
  };

  const handleUpdateTileColor = async (id: string, colorIndex: number) => {
    try {
      await updateTileColor(id, colorIndex, currentPaletteId);
      const newColor = getColorFromPalette(currentPaletteId, colorIndex);
      const updates = { color_index: colorIndex, accent_color: newColor };
      setTiles(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (err) {
      console.error('Failed to update tile color:', err);
    }
  };

  const handleResetTile = async (id: string) => {
    if (!currentPageId) return;
    
    try {
      const updatedTiles = await deleteTile(id, currentPageId);
      setTiles(updatedTiles);
      setSelectedTileId(null);
    } catch (err) {
      console.error('Failed to reset tile:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, tile: Tile) => {
    setDraggedTileId(tile.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDropOnTile = async (e: React.DragEvent, targetTile: Tile) => {
    e.preventDefault();
    if (!draggedTileId || draggedTileId === targetTile.id) {
      setDraggedTileId(null);
      return;
    }

    setTiles(prev => {
      const draggedTile = prev.find(t => t.id === draggedTileId);
      if (!draggedTile) return prev;

      return prev.map(t => {
        if (t.id === draggedTileId) return { ...t, position: targetTile.position };
        if (t.id === targetTile.id) return { ...t, position: draggedTile.position };
        return t;
      }).sort((a, b) => a.position - b.position);
    });

    setDraggedTileId(null);

    try {
      await swapTilePositions(draggedTileId, targetTile.id);
    } catch (err) {
      console.error('Failed to swap tiles:', err);
      loadTiles();
    }
  };

  const handleDropOnEmpty = async (e: React.DragEvent, targetPosition: number) => {
    e.preventDefault();
    if (!draggedTileId) return;

    setTiles(prev => {
      const draggedTile = prev.find(t => t.id === draggedTileId);
      if (!draggedTile) return prev;

      return prev.map(t =>
        t.id === draggedTileId ? { ...t, position: targetPosition } : t
      ).sort((a, b) => a.position - b.position);
    });

    setDraggedTileId(null);

    try {
      await moveTileToPosition(draggedTileId, targetPosition);
    } catch (err) {
      console.error('Failed to move tile:', err);
      loadTiles();
    }
  };

  const handleCreateLink = async (tileId: string, data: { title: string; url: string; summary: string }): Promise<Link> => {
    const tile = tiles.find(t => t.id === tileId);
    
    const normalizedUrl = data.url.trim().toLowerCase();
    const existingLink = tile?.links?.find(l => 
      l.url && l.url.toLowerCase() === normalizedUrl
    );
    if (existingLink) {
      throw new Error('This URL already exists in this tile');
    }
    
    try {
      const position = tile?.links?.length || 0;
      const newLink = await createLink(tileId, position, data.title, data.url, data.summary);

      setTiles(prev => prev.map(t =>
        t.id === tileId
          ? { ...t, links: [...(t.links || []), newLink] }
          : t
      ));

      return newLink;
    } catch (err) {
      console.error('Failed to create link:', err);
      throw err;
    }
  };

  const handleUpdateLink = async (id: string, updates: Partial<Link>) => {
    try {
      await updateLink(id, updates);

      setTiles(prev => prev.map(t => ({
        ...t,
        links: t.links?.map(l => l.id === id ? { ...l, ...updates } : l)
      })));

      if (editingDocument?.id === id) {
        setEditingDocument(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      console.error('Failed to update link:', err);
    }
  };

  const handleDeleteLink = async (id: string) => {
    try {
      await deleteLink(id);

      setTiles(prev => prev.map(t => ({
        ...t,
        links: t.links?.filter(l => l.id !== id)
      })));

      if (editingDocument?.id === id) {
        setEditingDocument(null);
      }
    } catch (err) {
      console.error('Failed to delete link:', err);
    }
  };

  const handleOpenDocument = (link: Link) => {
    setEditingDocument(link);
  };

  const handleSaveDocument = async (id: string, updates: { title: string; content: string; summary: string }) => {
    try {
      await updateLink(id, updates);

      setTiles(prev => prev.map(t => ({
        ...t,
        links: t.links?.map(l => l.id === id ? { ...l, ...updates } : l)
      })));

      if (editingDocument?.id === id) {
        setEditingDocument(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (err) {
      console.error('Failed to save document:', err);
    }
  };

  const handleAddNote = async (forTile?: Tile) => {
    if (!currentPageId) return;
    
    let targetTileId: string | null = forTile?.id ?? selectedTileId;
    
    if (!targetTileId) {
      const inboxTile = tiles.find(t => t.title === INBOX_TILE.TITLE);
      
      if (tiles.length === 0) {
        try {
          const newTile = await createTile(currentPageId, currentPaletteId);
          setTiles(prev => [...prev, newTile]);
          setSelectedTileId(newTile.id);
          
          const newDoc = await createDocument(newTile.id, 0, '', '', '');
          setTiles(prev => prev.map(t =>
            t.id === newTile.id
              ? { ...t, links: [newDoc] }
              : t
          ));
          setEditingDocument(newDoc);
        } catch (err) {
          console.error('Failed to create tile and note:', err);
        }
        return;
      }
      
      targetTileId = inboxTile?.id ?? tiles[0].id;
    }

    try {
      const targetTile = tiles.find(t => t.id === targetTileId);
      const position = targetTile?.links?.length || 0;
      
      const newDoc = await createDocument(targetTileId, position, '', '', '');

      setTiles(prev => prev.map(t =>
        t.id === targetTileId
          ? { ...t, links: [...(t.links || []), newDoc] }
          : t
      ));
      
      setShowPasteLink(false);
      setEditingDocument(newDoc);
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleLinkDrop = async (linkId: string, targetTileId: string) => {
    let sourceTileId: string | null = null;
    for (const t of tiles) {
      if (t.links?.some(l => l.id === linkId)) {
        sourceTileId = t.id;
        break;
      }
    }

    if (!sourceTileId || sourceTileId === targetTileId) return;

    try {
      const movedLink = await moveLink(linkId, targetTileId);

      const sourceId = sourceTileId;
      setTiles(prev => prev.map(t => {
        if (t.id === sourceId) {
          return { ...t, links: t.links?.filter(l => l.id !== linkId) };
        }
        if (t.id === targetTileId) {
          return { ...t, links: [...(t.links || []), movedLink] };
        }
        return t;
      }));
    } catch (err) {
      console.error('Failed to move link:', err);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  if (loading || !currentPage) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error}</p>
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

  const gridCapacity = getGridCapacity(tiles.length);
  const canAddMore = tiles.length < APP_CONFIG.MAX_TILES;
  const { cols, rows } = getGridConfig(gridCapacity);

  const gridStyle = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
  };

  // Mobile grid: 2 columns, auto rows
  const mobileGridStyle = {
    gridTemplateColumns: 'repeat(2, 1fr)',
    gridTemplateRows: 'auto',
  };

  const currentPalette = getPalette(currentPaletteId);
  const bgColor = currentPalette.background;
  const borderColor = currentPalette.border;

  const tilesByPosition = new Map(tiles.map(t => [t.position, t]));

  const gridCells = [];
  for (let position = 0; position < gridCapacity; position++) {
    const tile = tilesByPosition.get(position);
    if (tile) {
      gridCells.push(
        <TileCard
          key={tile.id}
          tile={tile}
          borderColor={borderColor}
          onClick={() => setSelectedTileId(tile.id)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDropOnTile}
          onLinkDrop={handleLinkDrop}
          isDragging={draggedTileId === tile.id}
        />
      );
    } else {
      gridCells.push(
        <div
          key={`empty-${position}`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDropOnEmpty(e, position)}
          className="rounded-3xl bg-white/20 border-2 border-dashed border-white/30 flex items-center justify-center hover:bg-white/30 hover:border-white/50 transition-all"
        >
          <span className="text-white/50 text-2xl font-light">-</span>
        </div>
      );
    }
  }

  return (
    <div 
      className="h-screen w-screen overflow-hidden" 
      style={{ backgroundColor: bgColor }}
      {...swipeHandlers}
    >
      {/* Page Title Display */}
      <PageTitleDisplay currentPage={currentPage} currentPageId={currentPageId} />
      
      {/* Tile Grid */}
      <div 
        className={`h-full w-full grid ${isMobile ? 'gap-2 p-2 pt-10 pb-16 overflow-y-auto' : 'gap-4 p-4'}`}
        style={isMobile ? mobileGridStyle : gridStyle}
      >
        {gridCells}
      </div>

      {/* Page Dots */}
      <PageDots 
        pages={pages} 
        currentPageId={currentPageId!} 
        onPageSelect={goToPage} 
        onShowOverview={() => setShowOverview(true)}
      />

      {selectedTile && (
        <TilePanel
          tile={selectedTile}
          currentPaletteId={currentPaletteId}
          isNewTile={isNewTile}
          onClose={() => { setSelectedTileId(null); setIsNewTile(false); }}
          onUpdateTile={handleUpdateTile}
          onUpdateTileColor={handleUpdateTileColor}
          onResetTile={handleResetTile}
          onCreateLink={handleCreateLink}
          onUpdateLink={handleUpdateLink}
          onDeleteLink={handleDeleteLink}
          onOpenDocument={handleOpenDocument}
          onAddNote={() => handleAddNote(selectedTile)}
        />
      )}

      <FloatingActions
        onAddTile={handleCreateTile}
        onPasteLink={() => setShowPasteLink(true)}
        onAddNote={() => handleAddNote()}
        canAddTile={canAddMore}
        currentPaletteId={currentPaletteId}
        onSelectPalette={handlePaletteChange}
      />

      <UserMenu />


      {showPasteLink && (
        <PasteLinkModal
          onClose={() => setShowPasteLink(false)}
          onLinkAdded={loadTiles}
        />
      )}

      {editingDocument && (
        <DocumentEditor
          document={editingDocument}
          onClose={() => setEditingDocument(null)}
          onSave={handleSaveDocument}
          onDelete={handleDeleteLink}
        />
      )}

      {showOverview && (
        <OverviewMode
          pages={pages}
          currentPageId={currentPageId!}
          onClose={() => setShowOverview(false)}
          onPageSelect={goToPage}
          onSwapPages={handleSwapPages}
          onUpdatePageTitle={handleUpdatePageTitle}
          onResetPage={handleResetPage}
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
