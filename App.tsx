
import React, { useState, useCallback, useMemo } from 'react';
import { Upload, FileText, Scissors, Printer, Trash2, Layout, SlidersHorizontal, Info, FileSpreadsheet, Square, Sparkles, SunMedium } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { CardImage, PageLayout } from './types';
import { GRID, MM_TO_PX, PaperFormat, PAPER_SIZES, getMargins } from './constants';
import CardPreview from './components/CardPreview';
import { generatePDF } from './services/pdfGenerator';
import { generateSVG } from './services/svgGenerator';
import { processCardImageWithBlackCorners, ImageProcessOptions } from './services/imageProcessor';

const App: React.FC = () => {
  const [cards, setCards] = useState<CardImage[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [paperFormat, setPaperFormat] = useState<PaperFormat>('a4');
  const [fixRoundedCorners, setFixRoundedCorners] = useState(true);

  // Foil / Holographic Mode State
  const [foilMode, setFoilMode] = useState(false);
  const [deepBlackLevel, setDeepBlackLevel] = useState<number>(35); // 0 (off) to 70
  const [boostContrast, setBoostContrast] = useState(true);

  // Printer Bleed & Scaling Compensation State (Opción 2)
  const [useCompensation, setUseCompensation] = useState(false);
  const [compensationPreset, setCompensationPreset] = useState<'epson_l3250' | 'custom'>('epson_l3250');
  const [measuredWidth, setMeasuredWidth] = useState<number>(61.0); // Measured printed width in mm
  const [measuredHeight, setMeasuredHeight] = useState<number>(84.0); // Measured printed height in mm
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Compensation scaling factors
  // Fine-tuned calibration: Printed output was missing 0.5mm in width (62.5mm measured) and 1.0mm in height (87.0mm measured).
  // Target = (63.0, 88.0).
  // New scaleX = 1.01666 * (63.0 / 62.5) = 1.02479 (+2.48%) -> PDF width ~ 64.56mm
  // New scaleY = 1.01308 * (88.0 / 87.0) = 1.02473 (+2.47%) -> PDF height ~ 90.18mm
  const scaleX = useMemo(() => {
    if (!useCompensation) return 1.0;
    if (compensationPreset === 'epson_l3250') return (63 / 61.0) * (63 / 64.0) * (63.0 / 62.5); // ~1.02479 (+2.48%)
    return 63 / (measuredWidth || 63);
  }, [useCompensation, compensationPreset, measuredWidth]);

  const scaleY = useMemo(() => {
    if (!useCompensation) return 1.0;
    if (compensationPreset === 'epson_l3250') return (88 / 84.0) * (88 / 91.0) * (88.0 / 87.0); // ~1.02473 (+2.47%)
    return 88 / (measuredHeight || 88);
  }, [useCompensation, compensationPreset, measuredHeight]);

  const currentProcessOptions = useMemo<ImageProcessOptions>(() => ({
    fixWhiteCorners: fixRoundedCorners,
    foilMode: foilMode,
    deepBlackThreshold: foilMode ? deepBlackLevel : 0,
    boostContrast: foilMode && boostContrast
  }), [fixRoundedCorners, foilMode, deepBlackLevel, boostContrast]);

  const processSingleUrl = useCallback(async (sourceUrl: string, opts: ImageProcessOptions) => {
    return await processCardImageWithBlackCorners(sourceUrl, opts);
  }, []);

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
          name: file.name,
          dataUrl: processedDataUrl,
          originalDataUrl: rawDataUrl,
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
  }, [currentProcessOptions]);

  // Re-process all cards when processing settings change
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
  };

  const clearAll = () => {
    if (confirm('¿Seguro que quieres borrar todas las cartas?')) {
      setCards([]);
    }
  };

  // Group cards into pages of 9
  const pages: PageLayout[] = useMemo(() => {
    const result: PageLayout[] = [];
    const pageSize = GRID.cols * GRID.rows;
    
    for (let i = 0; i < cards.length; i += pageSize) {
      const pageCards = cards.slice(i, i + pageSize);
      // Pad with nulls to fill the 3x3 grid if needed
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
  }, [cards]);

  const handleExportPDF = async () => {
    if (cards.length === 0) return;
    setIsExporting(true);
    try {
      await generatePDF(pages, scaleX, scaleY, paperFormat, foilMode);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSVG = () => {
    if (cards.length === 0) return;
    generateSVG(pages, paperFormat);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Printer className="text-white" size={20} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">ProxyMaster <span className="text-indigo-600">{paperFormat === 'a4' ? 'A4' : paperFormat === 'letter' ? 'Carta' : 'Oficio'}</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
              onClick={clearAll}
              disabled={cards.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-30"
            >
              <Trash2 size={16} />
              Limpiar
            </button>
            
            <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors cursor-pointer shadow-sm">
              <Upload size={16} />
              Subir Cartas
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Intro Section */}
        {cards.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm mb-10 px-6">
            <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Layout className="text-slate-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Prepara tu impresión profesional</h2>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Sube tus imágenes de proxies y generaremos automáticamente una cuadrícula 3x3 en tamaño A4, Carta u Oficio con líneas de corte visibles de borde a borde.
            </p>

            {/* Paper selector in intro */}
            <div className="inline-flex flex-wrap items-center justify-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 mb-4 gap-1">
              <button
                type="button"
                onClick={() => setPaperFormat('a4')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  paperFormat === 'a4'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Formato A4</span>
                <span className="text-[10px] font-normal text-slate-400">(210 × 297 mm)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat('letter')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  paperFormat === 'letter'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Formato Carta</span>
                <span className="text-[10px] font-normal text-slate-400">(215.9 × 279.4 mm)</span>
              </button>
              <button
                type="button"
                onClick={() => setPaperFormat('legal')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  paperFormat === 'legal'
                    ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Formato Oficio (Perú)</span>
                <span className="text-[10px] font-normal text-slate-400">(21.5 × 33 cm)</span>
              </button>
            </div>

            {/* Quick helper for black corners and Foil */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6 text-xs text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={fixRoundedCorners}
                  onChange={(e) => toggleFixCorners(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium text-slate-700">Fondo negro para esquinas redondeadas</span>
              </label>

              <label className={`flex items-center gap-2 cursor-pointer px-3.5 py-1.5 rounded-lg border transition-all select-none ${
                foilMode ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium'
              }`}>
                <input
                  type="checkbox"
                  checked={foilMode}
                  onChange={(e) => toggleFoilMode(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Sparkles size={14} className={foilMode ? 'text-amber-500' : 'text-slate-400'} />
                <span>Modo Papel Holográfico / Foil (PNG Transparente)</span>
              </label>
            </div>

            <div>
              <label className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-100 scale-105 active:scale-95">
                <Upload size={20} />
                Empezar ahora
                <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>
        )}

        {/* Action Bar */}
        {cards.length > 0 && (
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-4 mb-10">
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="bg-slate-100 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 uppercase">
                {cards.length} {cards.length === 1 ? 'Carta' : 'Cartas'}
              </div>
              <div className="bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-bold text-indigo-600 uppercase">
                {pages.length} {pages.length === 1 ? 'Página' : 'Páginas'}
              </div>

              {/* Botón / Selector de Formato de Papel A4 / Carta / Oficio */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaperFormat('a4')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    paperFormat === 'a4'
                      ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Formato internacional A4 (210 x 297 mm)"
                >
                  <span>A4</span>
                  <span className="text-[10px] font-normal text-slate-400">210×297</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperFormat('letter')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    paperFormat === 'letter'
                      ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Formato estándar Carta / Letter (215.9 x 279.4 mm / 8.5 x 11 in)"
                >
                  <span>Carta</span>
                  <span className="text-[10px] font-normal text-slate-400">215.9×279.4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaperFormat('legal')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    paperFormat === 'legal'
                      ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Formato Oficio Perú (21.5 x 33 cm / 8.5 x 13 in / 215 x 330 mm)"
                >
                  <span>Oficio (Perú)</span>
                  <span className="text-[10px] font-normal text-slate-400">21.5×33cm</span>
                </button>
              </div>

              {/* Botón de Fondo Negro en Esquinas */}
              <button
                type="button"
                onClick={() => toggleFixCorners(!fixRoundedCorners)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  fixRoundedCorners
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
                title="Rellena esquinas blancas o transparentes con negro para facilitar el corte recto de proxies"
              >
                <Square size={13} className={fixRoundedCorners ? 'fill-white' : ''} />
                <span>Fondo negro esquinas</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${fixRoundedCorners ? 'bg-slate-800 text-emerald-400' : 'bg-slate-100 text-slate-400'}`}>
                  {fixRoundedCorners ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Botón Modo Papel Holográfico / Foil */}
              <button
                type="button"
                onClick={() => toggleFoilMode(!foilMode)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  foilMode
                    ? 'bg-gradient-to-r from-amber-500 to-indigo-600 text-white border-transparent shadow-md shadow-indigo-200 ring-2 ring-indigo-400/50'
                    : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50/50'
                }`}
                title="Activa el modo para papel foil / holográfico: respeta transparencias de PNGs y optimiza la saturación de negros para que no brille donde no debe"
              >
                <Sparkles size={14} className={foilMode ? 'text-amber-200 animate-pulse' : 'text-indigo-600'} />
                <span>Modo Foil Holográfico</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${foilMode ? 'bg-black/30 text-amber-200' : 'bg-indigo-100 text-indigo-700'}`}>
                  {foilMode ? 'ACTIVO' : 'OFF'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={handleExportSVG}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg transition-all text-sm"
              >
                <Scissors size={18} />
                Exportar SVG ({paperFormat === 'a4' ? 'A4' : paperFormat === 'letter' ? 'Carta' : 'Oficio'})
              </button>
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2.5 text-white font-semibold rounded-lg transition-all shadow-md disabled:opacity-50 text-sm ${
                  foilMode 
                    ? 'bg-gradient-to-r from-indigo-700 to-slate-900 hover:from-indigo-800 hover:to-black shadow-indigo-200' 
                    : 'bg-slate-900 hover:bg-slate-800 shadow-slate-200'
                }`}
              >
                {isExporting ? 'Generando...' : (
                  <>
                    <FileText size={18} />
                    <span>Exportar PDF {foilMode ? 'Foil (Transparencias)' : `(${paperFormat === 'a4' ? 'A4' : paperFormat === 'letter' ? 'Carta' : 'Oficio'})`}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Panel Especial de Ajustes para Papel Foil / Holográfico */}
        {cards.length > 0 && foilMode && (
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 rounded-xl text-white p-6 shadow-xl mb-10 border border-indigo-500/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/50 pb-4 mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-amber-400/20 text-amber-300 p-2.5 rounded-xl border border-amber-300/30">
                  <Sparkles size={22} className="animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    Optimizador de Impresión en Papel Holográfico / Foil
                    <span className="text-[11px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Foil Activo
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200/80 mt-0.5">
                    El PDF exportará canales de transparencia PNG directos sin fondos opacos y aplicará procesado de negros puros.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Opción 1: Negro Puro / Deep Black */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <SunMedium size={16} className="text-amber-400" />
                      <span>Intensidad de Negros Puros (Deep Black)</span>
                    </label>
                    <span className="text-xs font-mono font-bold bg-indigo-500/30 text-amber-300 px-2 py-0.5 rounded border border-indigo-400/30">
                      {deepBlackLevel > 0 ? `Nivel ${deepBlackLevel}` : 'Desactivado'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    fuerza a que los grises oscuros y bordes se conviertan en <strong className="text-amber-200">#000000 100% puro</strong>. Esto deposita la máxima densidad de tinta en la impresora para bloquear por completo el brillo holográfico en los textos y bordes de la carta.
                  </p>
                  <input
                    type="range"
                    min={0}
                    max={65}
                    step={5}
                    value={deepBlackLevel}
                    onChange={(e) => updateDeepBlack(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                    <span>Sin tocar (0)</span>
                    <span>Recomendado Foil (35)</span>
                    <span>Negro Ultra Intenso (65)</span>
                  </div>
                </div>
              </div>

              {/* Opción 2: Realce de Contraste para Foil */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4.5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-bold text-white flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-300" />
                      <span>Curva de Contraste Dinámico (+15%)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleContrast(!boostContrast)}
                      className={`text-xs font-bold px-2.5 py-1 rounded transition-colors ${
                        boostContrast
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {boostContrast ? 'ACTIVADO' : 'DESACTIVADO'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Aumenta la separación entre las zonas claras (donde la tinta es transparente y brilla el foil) y las sombras oscuras para que el efecto metálico del papel holográfico tenga más relieve visual tridimensional.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-[11px] text-amber-200/90 bg-amber-500/10 p-2.5 rounded-lg">
                  <Info size={15} className="shrink-0 text-amber-300" />
                  <span>Las áreas transparentes (fondo ajedrezado) quedarán 100% expuestas al brillo holográfico.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel de Calibración / Compensación de Impresora (Opción 2) */}
        {cards.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                    Calibración de Impresión y Compensación de Margen
                    <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">Activo</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Corrige la reducción automática de tamaño que aplican impresoras como la Epson EcoTank L3250 al imprimir con márgenes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna izquierda: Selección de modo */}
              <div className="lg:col-span-5 space-y-3">
                <label className="text-sm font-semibold text-slate-700 block">Modo de Compensación:</label>
                
                <div className="space-y-2">
                  <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${!useCompensation ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200' : 'hover:bg-slate-50 border-slate-200'}`}>
                    <input 
                      type="radio" 
                      name="compensation" 
                      checked={!useCompensation} 
                      onChange={() => setUseCompensation(false)} 
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-semibold text-sm text-slate-800 block">Sin compensación (Tamaño Real)</span>
                      <span className="text-xs text-slate-500">Para impresoras configuradas con "Impresión sin bordes" (escala 100% exacta).</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${useCompensation && compensationPreset === 'epson_l3250' ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200' : 'hover:bg-slate-50 border-slate-200'}`}>
                    <input 
                      type="radio" 
                      name="compensation" 
                      checked={useCompensation && compensationPreset === 'epson_l3250'} 
                      onChange={() => {
                        setUseCompensation(true);
                        setCompensationPreset('epson_l3250');
                        setMeasuredWidth(61.0);
                        setMeasuredHeight(84.0);
                      }} 
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-semibold text-sm text-slate-800 block">Preset Epson EcoTank L3250 (Calibrado con Medición Real)</span>
                      <span className="text-xs text-slate-500">Compensa el encogimiento del driver para que el corte físico resulte en 63.0 × 88.0 mm exactos.</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${useCompensation && compensationPreset === 'custom' ? 'bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200' : 'hover:bg-slate-50 border-slate-200'}`}>
                    <input 
                      type="radio" 
                      name="compensation" 
                      checked={useCompensation && compensationPreset === 'custom'} 
                      onChange={() => {
                        setUseCompensation(true);
                        setCompensationPreset('custom');
                      }} 
                      className="mt-1 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="font-semibold text-sm text-slate-800 block">Calibración Manual (Medida con Regla)</span>
                      <span className="text-xs text-slate-500">Mide el resultado de una prueba anterior en mm y calcula tu propia escala exacta.</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Columna derecha: Detalles de medidas y previsualización matemática */}
              <div className="lg:col-span-7 bg-slate-50 rounded-xl p-5 border border-slate-200/60 flex flex-col justify-between">
                {useCompensation ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <SlidersHorizontal size={16} className="text-indigo-600" />
                        Ajuste Matemático Activo
                      </h4>
                      <span className="text-[10px] uppercase tracking-wider bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-md">
                        {compensationPreset === 'epson_l3250' ? 'Preset L3250' : 'Personalizado'}
                      </span>
                    </div>

                    {compensationPreset === 'custom' ? (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Imprime un PDF de prueba sin compensación. Mide con una regla el ancho y alto físico que resultó en el papel de una sola carta e ingrésalo aquí:
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Ancho obtenido en papel:</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                min="50" 
                                max="70" 
                                step="0.1"
                                value={measuredWidth} 
                                onChange={(e) => setMeasuredWidth(parseFloat(e.target.value) || 63)} 
                                className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-medium">mm</span>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">Tamaño deseado: 63 mm</span>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Alto obtenido en papel:</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                min="70" 
                                max="100" 
                                step="0.1"
                                value={measuredHeight} 
                                onChange={(e) => setMeasuredHeight(parseFloat(e.target.value) || 88)} 
                                className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="absolute right-3 top-1.5 text-xs text-slate-400 font-medium">mm</span>
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">Tamaño deseado: 88 mm</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">
                          Microcalibrado para compensar el encogimiento del driver y obtener exactamente <strong>63.0 × 88.0 mm</strong> (6.3 × 8.8 cm).
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Se ajusta el render en el PDF a <strong>x1.0248 (+2.48%)</strong> horizontal y <strong>x1.0247 (+2.47%)</strong> vertical para compensar los 0.5mm y 1.0mm faltantes.
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          Al recortar por las líneas rojas en el papel impreso, el tamaño físico de la carta coincidirá al 100% con un sleeve o carta oficial de MTG.
                        </p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-200/60 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Multiplicador de escala horizontal (X):</span>
                        <span className="font-mono font-bold text-slate-700">x{scaleX.toFixed(4)} ({scaleX >= 1 ? '+' : ''}{((scaleX - 1) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Multiplicador de escala vertical (Y):</span>
                        <span className="font-mono font-bold text-slate-700">x{scaleY.toFixed(4)} ({scaleY >= 1 ? '+' : ''}{((scaleY - 1) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="font-semibold text-slate-700">Tamaño del render en el archivo PDF exportado:</span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {(63 * scaleX).toFixed(1)} x {(88 * scaleY).toFixed(1)} mm
                        </span>
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex gap-2.5">
                      <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        <strong>¿Y para cortar?</strong> Las guías de corte en el PDF también se escalan para coincidir exactamente. El archivo SVG de corte permanece con medidas estándar porque las cartas resultantes en papel físico ya tendrán el tamaño estándar.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center py-6 px-4 text-slate-400">
                    <Printer size={32} className="mb-2 text-slate-300" />
                    <span className="font-bold text-sm text-slate-600">Compensación Desactivada (Escala 100%)</span>
                    <p className="text-xs mt-1 max-w-sm text-slate-500 leading-relaxed">
                      El PDF se generará al tamaño físico exacto de 63x88mm. Úsalo si tu impresora está configurada en modo "Tamaño Real / 100%" (sin ajustar página) o con "Impresión sin bordes" activa.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gestor de Cartas Subidas (Eliminación Individual) */}
        {cards.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-10 overflow-hidden">
            <button 
              onClick={() => setIsManagerOpen(prev => !prev)}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50/50 hover:bg-slate-50/80 transition-colors border-b border-slate-100"
            >
              <div className="flex items-center gap-2">
                <Layout size={18} className="text-indigo-600" />
                <span className="font-bold text-slate-800 text-sm md:text-base">
                  Administrador de Cartas Subidas ({cards.length})
                </span>
                <span className="text-xs bg-slate-200 text-slate-700 font-medium px-2 py-0.5 rounded-full">
                  Hacer clic para {isManagerOpen ? 'contraer' : 'expandir'}
                </span>
              </div>
              <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                {isManagerOpen ? 'Ocultar Lista' : 'Mostrar Lista'}
              </span>
            </button>

            {isManagerOpen && (
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {cards.map((card, idx) => {
                    const pageNum = Math.floor(idx / 9) + 1;
                    const posNum = (idx % 9) + 1;
                    return (
                      <div 
                        key={card.id} 
                        className="flex items-center gap-3 p-2.5 border border-slate-200 rounded-lg hover:border-slate-300 bg-slate-50/40 transition-all group"
                      >
                        <div className="w-12 h-16 rounded overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative">
                          <img src={card.dataUrl} alt={card.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p 
                            className="text-xs font-semibold text-slate-800 truncate" 
                            title={card.name}
                          >
                            {card.name}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Pág. {pageNum} • Pos. {posNum}
                          </p>
                        </div>
                        <button 
                          onClick={() => removeCard(card.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
                          title="Eliminar esta carta"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Paged Previews */}
        <div className="space-y-20">
          {pages.map((page) => (
            <div key={page.pageNumber} className="relative">
              <div className="absolute -top-6 left-0 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <span>Hoja {PAPER_SIZES[paperFormat].name}</span>
                <span>•</span>
                <span>Página {page.pageNumber}</span>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl mx-auto w-fit">
                 <div 
                  className="grid grid-cols-3"
                  style={{ gap: `${GRID.spacing * MM_TO_PX}px` }} 
                 >
                  {page.cards.map((card, idx) => (
                    <CardPreview 
                      key={card?.id || `empty-${page.pageNumber}-${idx}`} 
                      card={card} 
                      onRemove={card ? () => removeCard(card.id) : undefined}
                      foilMode={foilMode}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer Info */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t h-12 flex items-center justify-center text-[10px] text-slate-500 font-medium uppercase tracking-wider z-20 px-4 text-center">
        Papel {PAPER_SIZES[paperFormat].name} • Cartas MTG Estándar (63×88 mm) • Guías de corte completas (Rojas de borde a borde)
      </footer>
    </div>
  );
};

export default App;
