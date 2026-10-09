import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2, FileText } from 'lucide-react';
import { CardImage } from '../types';

interface SheetPreviewModalProps {
  cards: CardImage[];
  cardsOrder: number[];
  onEditOrder: () => void;
  onExportPDF?: () => void;
  onClose: () => void;
  isVisible: boolean;
  includeCardBack?: boolean;
}

const SheetPreviewModal: React.FC<SheetPreviewModalProps> = ({
  cards,
  cardsOrder,
  onEditOrder,
  onExportPDF,
  onClose,
  isVisible,
  includeCardBack = false
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isVisible) return null;

  const cardsPerSheet = 9;
  const orderedCards = cardsOrder.map(idx => cards[idx]).filter(Boolean);
  const totalSheets = Math.ceil(orderedCards.length / cardsPerSheet);
  // If includeCardBack is enabled, double the total sheets (1 front + 1 back per sheet)
  const totalPDFPages = includeCardBack ? totalSheets * 2 : totalSheets;
  const currentSheetCards = orderedCards.slice(
    currentPage * cardsPerSheet,
    (currentPage + 1) * cardsPerSheet
  );

  // Pad with empty slots to always show 9 positions
  while (currentSheetCards.length < cardsPerSheet) {
    currentSheetCards.push(null as any);
  }

  const handlePrevPage = () => {
    setCurrentPage(Math.max(0, currentPage - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalSheets - 1, currentPage + 1));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vista Previa de Hojas</h2>
            <p className="text-sm text-gray-600 mt-1">
              {orderedCards.length} cartas en {totalSheets} {totalSheets === 1 ? 'hoja' : 'hojas'}
              {includeCardBack && (
                <span className="ml-2 text-blue-600 font-semibold">
                  → {totalPDFPages} páginas PDF (frente + reverso)
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Sheet Grid 3x3 */}
          <div className="mb-8">
            <div className="inline-block border-4 border-gray-800 p-4 bg-white">
              <div className="grid grid-cols-3 gap-3 bg-gray-100 p-3">
                {currentSheetCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="aspect-[3/4] bg-white rounded border border-gray-300 overflow-hidden group relative shadow"
                  >
                    {card ? (
                      <>
                        <img
                          src={card.dataUrl}
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                        {/* Name tooltip on hover */}
                        <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-start p-2">
                          <p className="text-white text-xs font-semibold">
                            {card.name}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                        <span className="text-xs">Vacío</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Navigation and Controls */}
          <div className="flex flex-col gap-6">
            {/* Sheet Navigation */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="text-center min-w-48">
                <p className="text-lg font-semibold text-gray-900">
                  Hoja {currentPage + 1} de {totalSheets}
                </p>
                <p className="text-xs text-gray-500">
                  Cartas: {currentPage * cardsPerSheet + 1} - {Math.min((currentPage + 1) * cardsPerSheet, orderedCards.length)}
                </p>
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalSheets - 1}
                className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={onEditOrder}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Edit2 size={18} />
                Editar Orden
              </button>
              {onExportPDF && (
                <button
                  onClick={onExportPDF}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  <FileText size={18} />
                  Exportar PDF
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetPreviewModal;
