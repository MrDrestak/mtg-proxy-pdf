import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Upload, Trash2, Layout, Info, FileText, List, Lock, ChevronDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { CardImage, PageLayout, CardColor, SearchResult } from './types';
import { GRID, MM_TO_PX, PaperFormat, PAPER_SIZES } from './constants';
import CardPreview from './components/CardPreview';
import GalleryCard from './components/GalleryCard';
import ListingDrawer from './components/ListingDrawer';
import AdminLoginModal from './components/AdminLoginModal';
import AdminPanel from './components/AdminPanel';
import CardZoomModal from './components/CardZoomModal';
import WishlistCart from './components/WishlistCart';
import GalleryFilters from './components/GalleryFilters';
import PrintCardSelector from './components/PrintCardSelector';
import SearchSummaryModal from './components/SearchSummaryModal';
import CardManagerPopup from './components/CardManagerPopup';
import SheetPreviewModal from './components/SheetPreviewModal';
import FileValidationModal from './components/FileValidationModal';
import FolderSearchModal from './components/FolderSearchModal';
import PrintWorkflowInfo from './components/PrintWorkflowInfo';
import { generatePDF } from './services/pdfGenerator';
import { generateSVG } from './services/svgGenerator';
import { processCardImageWithBlackCorners, ImageProcessOptions } from './services/imageProcessor';
import { processMultipleImageFiles, openFilePickerDialog } from './services/fileHandler';
import { folderSearchCards, parseCardNamesList } from './services/folderSearch';
import { useSupabaseCards } from './hooks/useSupabaseCards';
import { useWatermarkSettings } from './hooks/useWatermarkSettings';

const App: React.FC = () => {
  const { cards, addCard, removeCard, updateCard, refreshCards } = useSupabaseCards();
  const {
    watermarkOpacity,
    watermarkScale,
    showWatermark,
    updateOpacity: onWatermarkOpacityChange,
    updateScale: onWatermarkScaleChange,
    updateShowWatermark: onWatermarkVisibilityChange
  } = useWatermarkSettings();

  const [activeTab, setActiveTab] = useState<'gallery' | 'print'>('gallery');
  const [isExporting, setIsExporting] = useState(false);
  const [paperFormat, setPaperFormat] = useState<PaperFormat>('a4');
  const [fixRoundedCorners, setFixRoundedCorners] = useState(true);
  const [foilMode, setFoilMode] = useState(false);
  const [deepBlackLevel, setDeepBlackLevel] = useState<number>(45);
  const [boostContrast, setBoostContrast] = useState(true);
  const [useCompensation, setUseCompensation] = useState(false);
  const [compensationPreset, setCompensationPreset] = useState<'epson_l3250' | 'custom'>('epson_l3250');
  const [measuredWidth, setMeasuredWidth] = useState<number>(61.0);
  const [measuredHeight, setMeasuredHeight] = useState<number>(84.0);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isListingOpen, setIsListingOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'new'>('all');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const ADMIN_PASSWORD = 'drestakmtg';

  // Gallery Pro States
  const [zoomedCard, setZoomedCard] = useState<CardImage | null>(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [wishlistCards, setWishlistCards] = useState<CardImage[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColors, setSelectedColors] = useState<CardColor[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [onlyFoil, setOnlyFoil] = useState(false);

  // Print Tab States - Separate from Gallery
  const [printCards, setPrintCards] = useState<CardImage[]>([]);
  const [printCardsOrder, setPrintCardsOrder] = useState<number[]>([]);
  const [searchSummary, setSearchSummary] = useState<any>(null);
  const [showSearchSummary, setShowSearchSummary] = useState(false);
  const [showCardManager, setShowCardManager] = useState(false);
  const [showSheetPreview, setShowSheetPreview] = useState(false);
  const [fileValidationResult, setFileValidationResult] = useState<any>(null);
  const [showFileValidation, setShowFileValidation] = useState(false);
  const [pendingCardsToAdd, setPendingCardsToAdd] = useState<CardImage[]>([]);
  const [showFolderSearch, setShowFolderSearch] = useState(false);
  const [isFolderSearching, setIsFolderSearching] = useState(false);
  const [showPrintWorkflowInfo, setShowPrintWorkflowInfo] = useState(false);
  const [includeCardBack, setIncludeCardBack] = useState(false);

  const scaleX = useMemo(() => {
    if (!useCompensation) return 1.0;
    if (compensationPreset === 'epson_l3250') return (63 / 61.0) * (63 / 64.0) * (63.0 / 62.5);
    return 63 / (measuredWidth || 63);
  }, [useCompensation, compensationPreset, measuredWidth]);

  const scaleY = useMemo(() => {
    if (!useCompensation) return 1.0;
    if (compensationPreset === 'epson_l3250') return (88 / 84.0) * (88 / 91.0) * (88.0 / 87.0);
    return 88 / (measuredHeight || 88);
  }, [useCompensation, compensationPreset, measuredHeight]);

  const currentProcessOptions = useMemo<ImageProcessOptions>(() => ({
    fixWhiteCorners: fixRoundedCorners,
    foilMode: foilMode,
    deepBlackThreshold: foilMode ? deepBlackLevel : 0,
    boostContrast: foilMode && boostContrast
  }), [fixRoundedCorners, foilMode, deepBlackLevel, boostContrast]);

  // REMOVED: File upload is now handled by AdminPanel (Firebase) or Print tab (temporary)
  // Gallery tab only displays cards from Firebase

  const applyProcessSettings = async (newOpts: Partial<ImageProcessOptions>) => {
    const effectiveOpts: ImageProcessOptions = {
      ...currentProcessOptions,
      ...newOpts
    };

    if (cards.length === 0) return;

    // Update each card with reprocessed image in Firebase
    for (const card of cards) {
      const sourceUrl = card.originalDataUrl || card.dataUrl;
      const newUrl = await processCardImageWithBlackCorners(sourceUrl, effectiveOpts);
      await updateCard(card.id, {
        dataUrl: newUrl,
        originalDataUrl: sourceUrl
      });
    }
  };

  const toggleFixCorners = async (enabled: boolean) => {
    setFixRoundedCorners(enabled);
    await applyProcessSettings({ fixWhiteCorners: enabled });
  };

  const toggleFoilMode = async (enabled: boolean) => {
    setFoilMode(enabled);
    await applyProcessSettings({
      foilMode: enabled,
      deepBlackThreshold: enabled ? deepBlackLevel : 0,
      boostContrast: enabled && boostContrast
    });
  };

  const updateDeepBlack = async (level: number) => {
    setDeepBlackLevel(level);
    if (foilMode) {
      await applyProcessSettings({ deepBlackThreshold: level });
    }
  };

  const toggleContrast = async (enabled: boolean) => {
    setBoostContrast(enabled);
    if (foilMode) {
      await applyProcessSettings({ boostContrast: enabled });
    }
  };

  const clearAll = () => {
    if (confirm('¿Seguro que quieres borrar todas las cartas?')) {
      cards.forEach(card => removeCard(card.id));
      setSelectedCardId(null);
    }
  };

  // Filter cards based on mode
  const filteredCards = useMemo(() => {
    if (filterMode === 'new' && cards.length > 0) {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return cards.filter(card => card.createdAt && card.createdAt > oneDayAgo);
    }
    return cards;
  }, [cards, filterMode]);

  const pages: PageLayout[] = useMemo(() => {
    const result: PageLayout[] = [];
    const pageSize = GRID.cols * GRID.rows;
    const cardsToUse = printCards.length > 0 ? printCards : cards;

    for (let i = 0; i < cardsToUse.length; i += pageSize) {
      const pageCards = cardsToUse.slice(i, i + pageSize);
      while (pageCards.length < pageSize) {
        (pageCards as any).push(null);
      }
      result.push({
        pageNumber: result.length + 1,
        cards: pageCards as (CardImage | null)[]
      });
    }

    if (result.length === 0) {
       result.push({ pageNumber: 1, cards: Array(9).fill(null) });
    }

    return result;
  }, [printCards, cards]);

  const handleExportPDF = async () => {
    const cardsToExport = printCards.length > 0 ? printCards : cards;
    if (cardsToExport.length === 0) return;
    setIsExporting(true);
    try {
      await generatePDF(pages, scaleX, scaleY, paperFormat, foilMode, includeCardBack);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = () => {
    const cardsToExport = printCards.length > 0 ? printCards : cards;
    if (cardsToExport.length === 0) return;
    setIsExporting(true);
    try {
      generateSVG(pages, paperFormat);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAdminLogin = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminLoggedIn(true);
      setIsLoginModalOpen(false);
      return true;
    }
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
  };

  const handleAddCard = async (card: CardImage, imageData?: string) => {
    await addCard(card, imageData);
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<CardImage>) => {
    await updateCard(cardId, updates);
  };

  const handleRemoveCard = async (cardId: string) => {
    await removeCard(cardId);
    // Remove from wishlist if it was there
    setWishlistCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleWatermarkChange = async (field: 'opacity' | 'scale' | 'show', value: number | boolean) => {
    try {
      if (field === 'opacity') {
        await onWatermarkOpacityChange(value as number);
      } else if (field === 'scale') {
        await onWatermarkScaleChange(value as number);
      } else if (field === 'show') {
        await onWatermarkVisibilityChange(value as boolean);
      }
    } catch (err) {
      console.error('Failed to update watermark settings:', err);
    }
  };

  // Wishlist handlers
  const handleAddToWishlist = (card: CardImage) => {
    setWishlistCards(prev => {
      const exists = prev.find(c => c.id === card.id);
      if (exists) return prev.filter(c => c.id !== card.id);
      return [...prev, card];
    });
  };

  const handleRemoveFromWishlist = (cardId: string) => {
    setWishlistCards(prev => prev.filter(c => c.id !== cardId));
  };

  const handleCopyWishlist = () => {
    const text = wishlistCards
      .map(c => c.nickname ? `${c.name} [${c.nickname}]` : c.name)
      .join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleDownloadWishlist = () => {
    const text = wishlistCards
      .map(c => c.nickname ? `${c.name} [${c.nickname}]` : c.name)
      .join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    element.setAttribute('download', 'mtg-proxy-labs-listado.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClearWishlist = () => {
    if (confirm('¿Vaciar el listado completo?')) {
      setWishlistCards([]);
    }
  };

  // Sort cards by color identity following MTG rules:
  // 1. Monocolor (W, U, B, R, G) in WUBRG order
  // 2. Two-color (Allied & Enemy) normalized to WUBRG, sorted lexicographically
  // 3. Three-color (Shards) normalized to WUBRG, sorted by sequence
  // 4. Four-color (sorted by WUBRG sequence)
  // 5. Five-color (all together)
  // 6. Colorless (last)
  const sortCardsByColor = (cardsToSort: CardImage[], filterColors?: CardColor[]): CardImage[] => {
    const colorSequence = ['W', 'U', 'B', 'R', 'G'];

    const getColorSortKey = (colors: CardColor[] | undefined): [number, string] => {
      if (!colors || colors.length === 0) {
        // Colorless/Artifacts: sort LAST
        return [999, 'zzz'];  // Use high number and late string to ensure it sorts last
      }

      // Check if colorless (C)
      if (colors.length === 1 && colors[0] === 'C') {
        return [999, 'zzz'];  // Colorless sort last
      }

      const colorCount = colors.length;

      if (colorCount === 1) {
        // Monocolor: sort by WUBRG order (0-4), skipping M (multicolor label) and C (colorless)
        const colorIndex = colorSequence.indexOf(colors[0]);
        return [colorIndex, String(colorIndex).padStart(2, '0')];
      }

      // For multicolor (2-5 colors), normalize to WUBRG order
      const normalizedColors = [...colors].sort((c1, c2) => {
        return colorSequence.indexOf(c1) - colorSequence.indexOf(c2);
      });

      const colorKey = normalizedColors.join('');

      if (colorCount === 2) {
        // Two-color: category 10 + key
        return [10, colorKey];
      }

      if (colorCount === 3) {
        // Three-color: category 20 + key
        return [20, colorKey];
      }

      if (colorCount === 4) {
        // Four-color: category 30 + key
        return [30, colorKey];
      }

      // Five-color: category 40
      return [40, colorKey];
    };

    return [...cardsToSort].sort((a, b) => {
      // When filter is active, prioritize by match type and selected color
      if (filterColors && filterColors.length > 0) {
        const aHasFilterColor = a.colors && filterColors.some(c => a.colors?.includes(c));
        const bHasFilterColor = b.colors && filterColors.some(c => b.colors?.includes(c));
        const aIsColorless = !a.colors || a.colors.length === 0 || (a.colors.length === 1 && a.colors[0] === 'C');
        const bIsColorless = !b.colors || b.colors.length === 0 || (b.colors.length === 1 && b.colors[0] === 'C');

        // Priority: has filter color > colorless > (shouldn't happen with current filter)
        if (aHasFilterColor !== bHasFilterColor) {
          return aHasFilterColor ? -1 : 1;
        }

        // Within each category, sort normally
      }

      const [aCategorySort, aColorKey] = getColorSortKey(a.colors);
      const [bCategorySort, bColorKey] = getColorSortKey(b.colors);

      // First sort by category (mono, 2-color, 3-color, etc., then colorless last)
      if (aCategorySort !== bCategorySort) {
        return aCategorySort - bCategorySort;
      }

      // Then by color combination
      if (aColorKey !== bColorKey) {
        return aColorKey.localeCompare(bColorKey);
      }

      // Finally by name alphabetically
      return a.name.localeCompare(b.name);
    });
  };

  // Filter logic
  const filteredGalleryCards = useMemo(() => {
    const filtered = cards.filter(card => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          card.name.toLowerCase().includes(query) ||
          card.nickname?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Color filter: show cards that match selected colors OR colorless cards
      if (selectedColors.length > 0) {
        const hasSelectedColor = card.colors && selectedColors.some(c => card.colors?.includes(c));
        const isColorless = !card.colors || card.colors.length === 0 || (card.colors.length === 1 && card.colors[0] === 'C');
        if (!hasSelectedColor && !isColorless) {
          return false;
        }
      }

      // Tags filter
      if (selectedTags.length > 0) {
        if (!card.tags || !selectedTags.some(t => card.tags?.includes(t))) {
          return false;
        }
      }

      // Foil filter
      if (onlyFoil && !card.isFoil) return false;

      return true;
    });

    // Sort by color identity (with optional color filter priority)
    return sortCardsByColor(filtered, selectedColors.length > 0 ? selectedColors : undefined);
  }, [cards, searchQuery, selectedColors, selectedTags, onlyFoil]);

  const handleColorToggle = (color: CardColor) => {
    setSelectedColors(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedColors([]);
    setSelectedTags([]);
    setOnlyFoil(false);
  };

  // Print Workflow Handlers
  const handleSelectManualCards = async () => {
    try {
      // Open file picker dialog
      const fileList = await openFilePickerDialog();
      if (!fileList || fileList.length === 0) return;

      // Convert FileList to array and process
      const files = Array.from(fileList);
      const { cards, errors, skipped } = await processMultipleImageFiles(
        files,
        printCards.length,
        true // Apply black corner processing
      );

      // Store validation result and pending cards
      setFileValidationResult({
        success: cards.length,
        errors,
        skipped
      });
      setPendingCardsToAdd(cards);
      setShowFileValidation(true);
    } catch (err) {
      console.error('File picker error:', err);
    }
  };

  const handleSelectFolder = () => {
    setShowFolderSearch(true);
  };

  const handleFolderSearch = async (cardNames: string[], folderPath: string) => {
    setIsFolderSearching(true);
    try {
      const dirHandle = (window as any).__selectedDirHandle;

      if (!dirHandle) {
        throw new Error('No se seleccionó carpeta válida');
      }

      // Progress callback from search
      const onSearchProgress = (current: number, total: number) => {
        // Update progress in modal: 0-90% during search, then 100% at end
        const progressPercent = (current / total) * 90;
        (window as any).__updateSearchProgress?.(progressPercent, `Procesando: ${current} de ${total} cartas`);
      };

      const result = await folderSearchCards(cardNames, dirHandle, onSearchProgress);

      // Show search summary
      setSearchSummary(result);
      setShowSearchSummary(true);
      setShowFolderSearch(false);
    } catch (err) {
      console.error('Folder search error:', err);
    } finally {
      setIsFolderSearching(false);
    }
  };

  const handleAcceptSearchResults = () => {
    if (searchSummary && searchSummary.found && searchSummary.found.length > 0) {
      // Add found cards to printCards and initialize order
      const newCards = [...printCards, ...searchSummary.found];
      setPrintCards(newCards);
      setPrintCardsOrder(Array.from({ length: newCards.length }, (_, i) => i));
      setShowSearchSummary(false);
      setSearchSummary(null);
    }
  };

  const handleCancelSearchResults = () => {
    setShowSearchSummary(false);
    setSearchSummary(null);
  };

  const handleUpdateCardOrder = (newOrder: number[]) => {
    setPrintCardsOrder(newOrder);
  };

  const handleDuplicateCard = (cardId: string) => {
    const cardIndex = printCards.findIndex(c => c.id === cardId);
    if (cardIndex !== -1 && printCards.length < 45) {
      const cardToDuplicate = printCards[cardIndex];
      const newCard: CardImage = {
        ...cardToDuplicate,
        id: uuidv4() // Generate new ID for duplicate
      };
      const newCards = [...printCards, newCard];
      const newOrder = [...printCardsOrder, printCards.length];
      setPrintCards(newCards);
      setPrintCardsOrder(newOrder);
    }
  };

  const handleDeleteCard = (cardId: string) => {
    const indexToRemove = printCards.findIndex(c => c.id === cardId);
    if (indexToRemove !== -1) {
      const newCards = printCards.filter(c => c.id !== cardId);
      const newOrder = printCardsOrder
        .filter(idx => idx !== indexToRemove)
        .map(idx => idx > indexToRemove ? idx - 1 : idx);
      setPrintCards(newCards);
      setPrintCardsOrder(newOrder.length > 0 ? newOrder : []);
    }
  };

  const handleConfirmFileValidation = () => {
    if (pendingCardsToAdd.length > 0) {
      // Add pending cards to print workflow
      const newCards = [...printCards, ...pendingCardsToAdd];
      const newOrder = Array.from({ length: newCards.length }, (_, i) => i);
      setPrintCards(newCards);
      setPrintCardsOrder(newOrder);

      // Clear validation state
      setShowFileValidation(false);
      setFileValidationResult(null);
      setPendingCardsToAdd([]);
    }
  };

  const handleCloseFileValidation = () => {
    setShowFileValidation(false);
    setFileValidationResult(null);
    setPendingCardsToAdd([]);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-black via-black to-blue-900/20 border-b border-blue-500/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Logo + Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">▶</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">MTG Proxy Labs</h1>
                <p className="text-xs text-blue-300 font-semibold">Art Gallery</p>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center bg-slate-900/50 border border-blue-500/20 rounded-lg p-1 gap-1">
              <button
                onClick={() => setActiveTab('gallery')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  activeTab === 'gallery'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Galería
              </button>
              <button
                onClick={() => setActiveTab('print')}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                  activeTab === 'print'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Impresión
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors border border-amber-500/30"
              >
                <Lock size={16} />
                <span className="hidden sm:inline">Admin</span>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div className="space-y-8">
            {cards.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-slate-900/50 to-blue-900/20 rounded-2xl border border-blue-500/20 px-6">
                <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                  <Layout className="text-blue-400" size={32} />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Galería de Arte</h2>
                <p className="text-slate-400 max-w-md mx-auto mb-8 text-sm sm:text-base">
                  Accede como Admin para subir tus mejores cartas de MTG. Crea una galería personalizada con marcas de agua.
                </p>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-lg transition-all shadow-lg shadow-amber-500/30 active:scale-95"
                >
                  <Lock size={20} />
                  Entrar como Admin
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Filter Toggle Button */}
                <button
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-900/50 border border-blue-500/20 rounded-lg hover:bg-slate-900/70 transition-all hover:border-blue-500/40"
                >
                  <span className="text-sm font-semibold text-slate-300">
                    {isFiltersOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-blue-400 transition-transform duration-300 ${
                      isFiltersOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Gallery Filters - Collapsible */}
                {isFiltersOpen && (
                  <GalleryFilters
                    cards={cards}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    selectedColors={selectedColors}
                    onColorToggle={handleColorToggle}
                    selectedTags={selectedTags}
                    onTagToggle={handleTagToggle}
                    onClearFilters={handleClearFilters}
                    onlyFoil={onlyFoil}
                    onFoilToggle={() => setOnlyFoil(prev => !prev)}
                  />
                )}

                {/* Gallery Info */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Tu Galería</h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {filteredGalleryCards.length} {filteredGalleryCards.length === 1 ? 'carta' : 'cartas'} de {cards.length}
                  </p>
                </div>

                {/* Gallery Grid - 3x3 Album View */}
                {filteredGalleryCards.length === 0 ? (
                  <div className="text-center py-12 bg-slate-900/30 rounded-xl border border-blue-500/20">
                    <p className="text-slate-400">No hay cartas que coincidan con los filtros</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                    {filteredGalleryCards.map((card) => (
                      <div key={card.id}>
                        <div
                          className="relative w-full aspect-[63/88] rounded-lg overflow-hidden bg-black border border-blue-500/20"
                        >
                          <GalleryCard
                            card={card}
                            onClick={() => {
                              setZoomedCard(card);
                              setIsZoomOpen(true);
                            }}
                            showWatermark={showWatermark}
                            watermarkOpacity={watermarkOpacity}
                            watermarkScale={watermarkScale}
                          />
                        </div>
                        <div className="mt-2 px-2">
                          {card.nickname && (
                            <p className="text-sm font-semibold text-amber-300 truncate">{card.nickname}</p>
                          )}
                          <p className={`${card.nickname ? 'text-xs' : 'text-sm'} font-semibold text-white truncate`}>{card.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Print Tab */}
        {activeTab === 'print' && (
          <div className="space-y-6 sm:space-y-8">
            <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/20 rounded-xl border border-blue-500/20 p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-black text-white mb-6">Mesa de Corte e Impresión</h2>

              {cards.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-400 mb-4">Sube cartas primero desde la Galería</p>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    Ir a Galería
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Paper Format - Mobile Optimized */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Formato de Papel</p>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {[
                        { key: 'a4', label: 'A4', dims: '210×297mm' },
                        { key: 'letter', label: 'Carta', dims: '215.9×279.4mm' },
                        { key: 'legal', label: 'Oficio', dims: '21.5×33cm' }
                      ].map((fmt) => (
                        <button
                          key={fmt.key}
                          onClick={() => setPaperFormat(fmt.key as PaperFormat)}
                          className={`p-2 sm:p-3 rounded-lg border-2 transition-all text-xs sm:text-sm font-semibold ${
                            paperFormat === fmt.key
                              ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                              : 'border-slate-600 bg-slate-900/50 text-slate-300 hover:border-blue-500/50'
                          }`}
                        >
                          <p className="font-bold">{fmt.label}</p>
                          <p className="text-[10px] sm:text-xs text-slate-400 mt-1">{fmt.dims}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Processing Options - Mobile Optimized */}
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Procesamiento</p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/30 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={fixRoundedCorners}
                          onChange={(e) => toggleFixCorners(e.target.checked)}
                          className="w-4 h-4 rounded accent-blue-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-300">Fondo negro en esquinas</p>
                          <p className="text-xs text-slate-500">Rellena esquinas redondeadas para corte limpio</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/30 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={foilMode}
                          onChange={(e) => toggleFoilMode(e.target.checked)}
                          className="w-4 h-4 rounded accent-blue-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-300">Modo Holográfico (Foil)</p>
                          <p className="text-xs text-slate-500">Optimiza transparencias para papel foil</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/30 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={includeCardBack}
                          onChange={(e) => setIncludeCardBack(e.target.checked)}
                          className="w-4 h-4 rounded accent-blue-500"
                        />
                        <div>
                          <p className="text-sm font-semibold text-slate-300">Incluir Reverso de Carta</p>
                          <p className="text-xs text-slate-500">Agrega páginas de reverso para impresión doble cara</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Foil Mode Options - Collapsible */}
                  {foilMode && (
                    <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-slate-300">Nivel de Negro Profundo</label>
                          <span className="text-xs font-mono bg-blue-600/30 text-blue-300 px-2 py-1 rounded">{deepBlackLevel}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="70"
                          step="5"
                          value={deepBlackLevel}
                          onChange={(e) => updateDeepBlack(Number(e.target.value))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">Mayor valor = negros más saturados</p>
                      </div>

                      <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={boostContrast}
                          onChange={(e) => toggleContrast(e.target.checked)}
                          className="w-4 h-4 rounded accent-blue-500"
                        />
                        <span className="text-sm font-semibold text-slate-300">Aumentar Contraste</span>
                      </label>
                    </div>
                  )}

                  {/* Compensation Options - Collapsible */}
                  <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-500/30 space-y-4">
                    <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:border-amber-500/50 transition-all">
                      <input
                        type="checkbox"
                        checked={useCompensation}
                        onChange={(e) => setUseCompensation(e.target.checked)}
                        className="w-4 h-4 rounded accent-amber-500"
                      />
                      <div>
                        <p className="text-sm font-semibold text-slate-300">Compensación de Impresión</p>
                        <p className="text-xs text-slate-500">Ajusta para diferencias de escalado de impresora</p>
                      </div>
                    </label>

                    {useCompensation && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-300 block mb-2">Preset</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setCompensationPreset('epson_l3250')}
                              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                                compensationPreset === 'epson_l3250'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              Epson L3250
                            </button>
                            <button
                              onClick={() => setCompensationPreset('custom')}
                              className={`p-2 rounded-lg text-xs font-semibold transition-all ${
                                compensationPreset === 'custom'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              }`}
                            >
                              Personalizado
                            </button>
                          </div>
                        </div>

                        {compensationPreset === 'custom' && (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-slate-300 block mb-2">
                                Ancho medido (mm): {measuredWidth.toFixed(1)}
                              </label>
                              <input
                                type="range"
                                min="50"
                                max="70"
                                step="0.5"
                                value={measuredWidth}
                                onChange={(e) => setMeasuredWidth(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-300 block mb-2">
                                Alto medido (mm): {measuredHeight.toFixed(1)}
                              </label>
                              <input
                                type="range"
                                min="75"
                                max="100"
                                step="0.5"
                                value={measuredHeight}
                                onChange={(e) => setMeasuredHeight(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Export Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting || (printCards.length === 0 && cards.length === 0)}
                      className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      <FileText size={18} />
                      {isExporting ? 'Generando...' : 'Exportar PDF'}
                    </button>
                    <button
                      onClick={handleExportSVG}
                      disabled={isExporting || (printCards.length === 0 && cards.length === 0)}
                      className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-lg transition-all shadow-lg shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      <Layout size={18} />
                      {isExporting ? 'Generando...' : 'Exportar SVG'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Print Card Selector - New Workflow */}
            {cards.length > 0 && (
              <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/20 rounded-xl border border-blue-500/20 p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Nuevo Flujo de Selección</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Cartas en flujo: {printCards.length} / 45
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPrintWorkflowInfo(true)}
                    className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                    title="Ver guía del flujo de impresión"
                  >
                    <Info size={20} />
                  </button>
                  {printCards.length > 0 && (
                    <button
                      onClick={() => setShowSheetPreview(true)}
                      className="px-3 py-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      Ver Hojas
                    </button>
                  )}
                </div>
                <PrintCardSelector
                  onSelectManual={handleSelectManualCards}
                  onSelectFolder={handleSelectFolder}
                  isLoading={false}
                />
              </div>
            )}

          </div>
        )}
      </main>

      {/* Listing Drawer */}
      <ListingDrawer
        isOpen={isListingOpen}
        onClose={() => setIsListingOpen(false)}
        cards={filteredCards}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleAdminLogin}
      />

      {/* Admin Panel */}
      {isAdminLoggedIn && (
        <AdminPanel
          cards={cards}
          onAddCard={handleAddCard}
          onUpdateCard={handleUpdateCard}
          onRemoveCard={handleRemoveCard}
          watermarkOpacity={watermarkOpacity}
          watermarkScale={watermarkScale}
          showWatermark={showWatermark}
          onWatermarkChange={handleWatermarkChange}
          onClose={handleAdminLogout}
        />
      )}

      {/* Card Zoom Modal */}
      <CardZoomModal
        card={zoomedCard}
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        onAddToList={handleAddToWishlist}
        watermarkOpacity={watermarkOpacity}
        watermarkScale={watermarkScale}
        showWatermark={showWatermark}
        isInList={zoomedCard ? wishlistCards.some(c => c.id === zoomedCard.id) : false}
      />

      {/* Wishlist Cart */}
      <WishlistCart
        cards={wishlistCards}
        isOpen={isWishlistOpen}
        onToggle={() => setIsWishlistOpen(!isWishlistOpen)}
        onRemoveCard={handleRemoveFromWishlist}
        onCopyList={handleCopyWishlist}
        onDownloadList={handleDownloadWishlist}
      />

      {/* Print Workflow Modals */}
      <FolderSearchModal
        isVisible={showFolderSearch}
        onClose={() => setShowFolderSearch(false)}
        onSearch={handleFolderSearch}
        isSearching={isFolderSearching}
      />

      <FileValidationModal
        result={fileValidationResult}
        isVisible={showFileValidation}
        onClose={handleCloseFileValidation}
        onConfirm={handleConfirmFileValidation}
      />

      <SearchSummaryModal
        searchResult={searchSummary || { processed: 0, found: [], notFound: [], conflicts: {} }}
        onAccept={handleAcceptSearchResults}
        onCancel={handleCancelSearchResults}
        isVisible={showSearchSummary}
      />

      <CardManagerPopup
        cards={printCards}
        cardsOrder={printCardsOrder}
        onUpdateOrder={handleUpdateCardOrder}
        onDuplicate={handleDuplicateCard}
        onDelete={handleDeleteCard}
        onClose={() => setShowCardManager(false)}
        isVisible={showCardManager}
      />

      <SheetPreviewModal
        cards={printCards}
        cardsOrder={printCardsOrder}
        onEditOrder={() => {
          setShowSheetPreview(false);
          setShowCardManager(true);
        }}
        onExportPDF={() => {
          if (printCards.length > 0) {
            handleExportPDF();
          }
        }}
        onClose={() => setShowSheetPreview(false)}
        isVisible={showSheetPreview}
        includeCardBack={includeCardBack}
      />

      <PrintWorkflowInfo
        isVisible={showPrintWorkflowInfo}
        onClose={() => setShowPrintWorkflowInfo(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-950/80 border-t border-blue-500/20 mt-auto py-4 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Elaborado por Walter Pacora Rodriguez (108763) • MTG Proxy Labs © 2026 • v2.1
        </p>
      </footer>
    </div>
  );
};

export default App;
