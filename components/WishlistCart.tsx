import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { CardImage } from '../types';

interface WishlistCartProps {
  cards: CardImage[];
  isOpen: boolean;
  onToggle: () => void;
  onRemoveCard: (cardId: string) => void;
  onCopyList: () => void;
  onDownloadList: () => void;
}

const WishlistCart: React.FC<WishlistCartProps> = ({
  cards,
  isOpen,
  onToggle,
  onRemoveCard,
  onCopyList,
  onDownloadList
}) => {
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={onToggle}
        className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-30 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-full shadow-2xl transition-all hover:scale-110 active:scale-95"
      >
        <CheckCircle2 size={20} />
        <span className="hidden sm:inline">Mi Listado</span>
        <span className="flex items-center justify-center w-6 h-6 bg-red-600 rounded-full text-xs font-black">
          {cards.length}
        </span>
      </button>

      {/* Panel Desplegable */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onToggle}
          />

          {/* Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black via-slate-900 to-slate-800 rounded-t-2xl border-t border-l border-r border-blue-500/30 shadow-2xl max-h-[70vh] sm:max-h-[60vh] overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-xs rounded-t-2xl">
              <h3 className="text-lg sm:text-xl font-black text-white">
                Mi Listado ({cards.length})
              </h3>
              <button
                onClick={onToggle}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={24} className="text-slate-300" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {cards.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 size={32} className="text-slate-400 mx-auto mb-3 opacity-50" />
                  <p className="text-slate-400">Tu listado está vacío</p>
                  <p className="text-xs text-slate-500 mt-1">Haz clic en las cartas para añadirlas</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-start justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{card.name}</p>
                        {card.nickname && (
                          <p className="text-xs text-amber-300 truncate">{card.nickname}</p>
                        )}
                      </div>
                      <button
                        onClick={() => onRemoveCard(card.id)}
                        className="p-1 ml-2 hover:bg-red-900/50 text-red-400 hover:text-red-300 rounded transition-colors flex-shrink-0"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            {cards.length > 0 && (
              <div className="sticky bottom-0 flex gap-2 p-4 sm:p-6 bg-slate-950/80 border-t border-blue-500/20 backdrop-blur-xs">
                <button
                  onClick={onCopyList}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm"
                >
                  Copiar Listado
                </button>
                <button
                  onClick={onDownloadList}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all text-sm"
                >
                  Descargar TXT
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default WishlistCart;
