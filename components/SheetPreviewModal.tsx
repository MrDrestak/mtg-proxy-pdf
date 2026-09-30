import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { CardImage } from '../types';

interface SheetPreviewModalProps {
  cards: CardImage[];
  cardsOrder: number[];
  onEditOrder: () => void;
  onClose: () => void;
  isVisible: boolean;
}

const SheetPreviewModal: React.FC<SheetPreviewModalProps> = ({
  cards,
  cardsOrder,
  onEditOrder,
  onClose,
  isVisible
}) => {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isVisible) return null;

  const cardsPerSheet = 9;
  const orderedCards = cardsOrder.map(idx => cards[idx]).filter(Boolean);
  const totalSheets = Math.ceil(orderedCards.length / cardsPerSheet);
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-gray-900">Vista Previa de Hojas</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Sheet Grid 3x3 */}
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-4 bg-white p-4 rounded-lg border-2 border-gray-300">
              {currentSheetCards.map((card, idx) => (
                <div
                  key={idx}
                  className="aspect-[3/4] bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden group relative"
                >
                  {card ? (
                    <>
                      <img
                        src={card.dataUrl}
                        alt={card.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Name tooltip on hover */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white text-xs font-semibold text-center px-2">
                          {card.name}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <span className="text-xs">Vacío</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Navigation and Controls */}
          <div className="flex flex-col gap-4">
            {/* Sheet Navigation */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 0}
                className="p-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={24} />
              </button>

              <div className="text-center min-w-32">
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

            {/* Edit Button */}
            <div className="flex justify-center">
              <button
                onClick={onEditOrder}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Edit2 size={18} />
                Editar Orden
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SheetPreviewModal;
