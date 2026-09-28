import React, { useState, useCallback, useMemo } from 'react';
import { Upload, Trash2, Layout, Info, FileText, List } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { CardImage, PageLayout } from './types';
import { GRID, MM_TO_PX, PaperFormat, PAPER_SIZES } from './constants';
import CardPreview from './components/CardPreview';
import ListingDrawer from './components/ListingDrawer';
import { generatePDF } from './services/pdfGenerator';
import { processCardImageWithBlackCorners, ImageProcessOptions } from './services/imageProcessor';

const App: React.FC = () => {
  const [cards, setCards] = useState<CardImage[]>([]);
  const [activeTab, setActiveTab] = useState<'gallery' | 'print'>('gallery');
  const [isExporting, setIsExporting] = useState(false);
  const [paperFormat, setPaperFormat] = useState<PaperFormat>('a4');
  const [fixRoundedCorners, setFixRoundedCorners] = useState(true);
  const [foilMode, setFoilMode] = useState(false);
  const [deepBlackLevel, setDeepBlackLevel] = useState<number>(35);
  const [boostContrast, setBoostContrast] = useState(true);
  const [useCompensation, setUseCompensation] = useState(false);
  const [compensationPreset, setCompensationPreset] = useState<'epson_l3250' | 'custom'>('epson_l3250');
  const [measuredWidth, setMeasuredWidth] = useState<number>(61.0);
  const [measuredHeight, setMeasuredHeight] = useState<number>(84.0);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isListingOpen, setIsListingOpen] = useState(false);
  const [watermarkOpacity, setWatermarkOpacity] = useState(35);
  const [watermarkScale, setWatermarkScale] = useState(100);
  const [showWatermark, setShowWatermark] = useState(true);
  const [filterMode, setFilterMode] = useState<'all' | 'new'>('all');

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

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawDataUrl = event.target?.result as string;
        const processedDataUrl = await processCardImageWithBlackCorners(rawDataUrl, currentProcessOptions);

        setCards(prev => [...prev, {
          id: uuidv4(),
          name: file.name.replace(/\.[^.]+$/, ''),
          dataUrl: processedDataUrl,
          originalDataUrl: rawDataUrl,
          type: file.type,
          createdAt: new Date()
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, [currentProcessOptions]);

  const applyProcessSettings = async (newOpts: Partial<ImageProcessOptions>) => {
    const effectiveOpts: ImageProcessOptions = {
      ...currentProcessOptions,
      ...newOpts
    };

    if (cards.length === 0) return;

    const updatedCards = await Promise.all(
      cards.map(async (card) => {
        const sourceUrl = card.originalDataUrl || card.dataUrl;
        const newUrl = await processCardImageWithBlackCorners(sourceUrl, effectiveOpts);
        return {
          ...card,
          dataUrl: newUrl,
          originalDataUrl: sourceUrl
        };
      })
    );
    setCards(updatedCards);
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

  const removeCard = (id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
    if (selectedCardId === id) setSelectedCardId(null);
  };

  const clearAll = () => {
    if (confirm('¿Seguro que quieres borrar todas las cartas?')) {
      setCards([]);
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

    for (let i = 0; i < filteredCards.length; i += pageSize) {
      const pageCards = filteredCards.slice(i, i + pageSize);
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
  }, [filteredCards]);

  const handleExportPDF = async () => {
    if (cards.length === 0) return;
    setIsExporting(true);
    try {
      await generatePDF(pages, scaleX, scaleY, paperFormat, foilMode);
    } finally {
      setIsExporting(false);
    }
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
                onClick={clearAll}
                disabled={cards.length === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed border border-red-500/30"
              >
                <Trash2 size={16} />
                <span className="hidden sm:inline">Limpiar</span>
              </button>

              <label className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-lg shadow-blue-500/20">
                <Upload size={16} />
                <span className="hidden sm:inline">Subir</span>
                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
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
                  Sube tus mejores cartas de MTG y crea una galería personalizada. Protégelas con marcas de agua y comparte tu colección.
                </p>
                <label className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-500/30 active:scale-95">
                  <Upload size={20} />
                  Empezar ahora
                  <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white">Tu Galería</h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      {filteredCards.length} {filteredCards.length === 1 ? 'carta' : 'cartas'}
                      {filterMode === 'new' && ' (últimas 24h)'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    {/* Filter */}
                    <div className="flex items-center bg-slate-900/50 border border-blue-500/20 rounded-lg p-1">
                      <button
                        onClick={() => setFilterMode('all')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
                          filterMode === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Todas
                      </button>
                      <button
                        onClick={() => setFilterMode('new')}
                        className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${
                          filterMode === 'new'
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Recientes
                      </button>
                    </div>

                    {/* Listing Drawer */}
                    <button
                      onClick={() => setIsListingOpen(!isListingOpen)}
                      className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 hover:bg-slate-800 border border-blue-500/20 text-slate-300 hover:text-white rounded-lg transition-all text-sm font-semibold"
                    >
                      <List size={16} />
                      <span className="hidden sm:inline">Listado</span>
                    </button>
                  </div>
                </div>

                {/* Gallery Grid - 3x3 Album View */}
                {pages.map((page) => (
                  <div key={page.pageNumber} className="mb-12">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                      Página {page.pageNumber}
                    </h3>
                    <div className="bg-white/5 border border-blue-500/20 rounded-xl p-6 sm:p-8">
                      <div
                        className="grid grid-cols-3 gap-4 sm:gap-6 auto-fit max-w-2xl mx-auto"
                        style={{ gap: `${GRID.spacing * MM_TO_PX}px` }}
                      >
                        {page.cards.map((card, idx) => (
                          <div
                            key={card?.id || `empty-${page.pageNumber}-${idx}`}
                            onClick={() => card && setSelectedCardId(card.id)}
                            className="cursor-pointer transition-transform hover:scale-105"
                          >
                            <CardPreview
                              card={card}
                              onRemove={card ? () => removeCard(card.id) : undefined}
                              foilMode={foilMode}
                              showWatermark={showWatermark}
                              watermarkOpacity={watermarkOpacity}
                              watermarkScale={watermarkScale}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Print Tab */}
        {activeTab === 'print' && (
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-900/50 to-blue-900/20 rounded-xl border border-blue-500/20 p-6">
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
                  {/* Paper Format */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {['a4', 'letter', 'legal'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => setPaperFormat(fmt as PaperFormat)}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                          paperFormat === fmt
                            ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                            : 'border-slate-600 bg-slate-900/50 text-slate-300 hover:border-blue-500/50'
                        }`}
                      >
                        {fmt === 'a4' && 'A4 (210×297mm)'}
                        {fmt === 'letter' && 'Carta (215.9×279.4mm)'}
                        {fmt === 'legal' && 'Oficio (21.5×33cm)'}
                      </button>
                    ))}
                  </div>

                  {/* Processing Options */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/30 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={fixRoundedCorners}
                        onChange={(e) => toggleFixCorners(e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      <span className="text-sm font-semibold text-slate-300">Fondo negro en esquinas</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:border-blue-500/30 cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={foilMode}
                        onChange={(e) => toggleFoilMode(e.target.checked)}
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      <span className="text-sm font-semibold text-slate-300">Modo Holográfico (Foil)</span>
                    </label>
                  </div>

                  {/* Watermark Controls */}
                  <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-blue-500/20">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-300">
                        <input
                          type="checkbox"
                          checked={showWatermark}
                          onChange={(e) => setShowWatermark(e.target.checked)}
                          className="w-4 h-4 rounded accent-blue-500"
                        />
                        Mostrar Marca de Agua
                      </label>
                    </div>

                    {showWatermark && (
                      <div className="space-y-3">
                        {/* Opacity Control */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-400">Opacidad</label>
                            <span className="text-xs font-mono bg-blue-600/30 text-blue-300 px-2 py-1 rounded">
                              {watermarkOpacity}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="85"
                            step="5"
                            value={watermarkOpacity}
                            onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>10%</span>
                            <span>85%</span>
                          </div>
                        </div>

                        {/* Scale Control */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-400">Escala</label>
                            <span className="text-xs font-mono bg-blue-600/30 text-blue-300 px-2 py-1 rounded">
                              {watermarkScale}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="60"
                            max="150"
                            step="10"
                            value={watermarkScale}
                            onChange={(e) => setWatermarkScale(Number(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                            <span>60%</span>
                            <span>150%</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Export Button */}
                  <button
                    onClick={handleExportPDF}
                    disabled={isExporting || cards.length === 0}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileText size={18} />
                    {isExporting ? 'Generando PDF...' : 'Exportar PDF'}
                  </button>
                </div>
              )}
            </div>

            {/* Card Manager */}
            {cards.length > 0 && (
              <div className="bg-white/5 border border-blue-500/20 rounded-xl overflow-hidden">
                <button
                  onClick={() => setIsManagerOpen(!isManagerOpen)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-slate-900/50 hover:bg-slate-900/70 transition-colors border-b border-blue-500/20"
                >
                  <span className="font-bold text-white">Administrador ({cards.length})</span>
                  <span className="text-xs text-blue-400">{isManagerOpen ? 'Ocultar' : 'Mostrar'}</span>
                </button>

                {isManagerOpen && (
                  <div className="p-4 max-h-96 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {cards.map((card) => (
                        <div
                          key={card.id}
                          className="relative group cursor-pointer"
                          onClick={() => setSelectedCardId(card.id)}
                        >
                          <div className="w-full aspect-[9/12] rounded-lg overflow-hidden bg-slate-800 border border-slate-700 hover:border-blue-500/50">
                            <img src={card.dataUrl} alt={card.name} className="w-full h-full object-cover" />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeCard(card.id);
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={14} className="text-white" />
                          </button>
                          <p className="text-xs mt-2 text-slate-300 font-semibold truncate">{card.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Footer */}
      <footer className="bg-slate-950/80 border-t border-blue-500/20 mt-auto py-4 text-center">
        <p className="text-xs text-slate-400 font-medium">
          Elaborado por Walter Pacora Rodriguez (108763) • MTG Proxy Labs © 2026
        </p>
      </footer>
    </div>
  );
};

export default App;
