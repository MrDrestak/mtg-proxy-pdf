import React from 'react';
import { X, Plus, Copy } from 'lucide-react';
import { CardImage } from '../types';
import CardPreview from './CardPreview';

interface CardZoomModalProps {
  card: CardImage | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToList: (card: CardImage) => void;
  watermarkOpacity: number;
  watermarkScale: number;
  showWatermark: boolean;
  isInList: boolean;
}

const CardZoomModal: React.FC<CardZoomModalProps> = ({
  card,
  isOpen,
  onClose,
  onAddToList,
  watermarkOpacity,
  watermarkScale,
  showWatermark,
  isInList
}) => {
  if (!isOpen || !card) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-gradient-to-b from-slate-900 to-black border border-blue-500/30 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-xs flex-shrink-0">
            <div className="min-w-0">
              <h3 className="text-base sm:text-xl font-black text-white truncate">{card.name}</h3>
              {card.nickname && (
                <p className="text-xs sm:text-sm text-amber-300 font-semibold truncate">{card.nickname}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0 ml-2"
            >
              <X size={20} className="text-slate-300" />
            </button>
          </div>

          {/* Content - No scroll, compressed */}
          <div className="flex-1 overflow-hidden p-2 sm:p-3 space-y-1.5 flex flex-col items-center justify-center">
            {/* Card Preview - Responsive & Centered - Constrained height */}
            <div className="flex justify-center items-center w-full flex-shrink-0">
              <div
                className="rounded-lg overflow-hidden shadow-xl"
                style={{
                  width: 'min(220px, 70vw)',
                  aspectRatio: '63 / 88'
                }}
              >
                <CardPreview
                  card={card}
                  showWatermark={showWatermark}
                  watermarkOpacity={watermarkOpacity}
                  watermarkScale={watermarkScale}
                />
              </div>
            </div>

            {/* Card Details - Compact & Non-scrolling */}
            {((card.colors && card.colors.length > 0) || (card.tags && card.tags.length > 0) || card.notes) && (
              <div className="space-y-1.5 p-2 bg-slate-900/50 rounded-lg border border-slate-700/50 flex-shrink-0">
                {/* Mana Colors - Inline & Compact */}
                {card.colors && card.colors.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">Color:</p>
                    <div className="flex gap-1">
                      {card.colors.map((color) => (
                        <div
                          key={color}
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs border border-blue-500/40 shadow-sm"
                          title={getColorLabel(color)}
                          style={{ backgroundColor: getColorHex(color) }}
                        >
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags - Inline & Compact */}
                {card.tags && card.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">Tags:</p>
                    <div className="flex flex-wrap gap-1">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 bg-blue-600/20 border border-blue-500/50 text-blue-300 text-xs font-semibold rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {card.notes && (
                  <p className="text-xs text-slate-400 italic line-clamp-1">{card.notes}</p>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons - Always Visible Footer */}
          <div className="flex gap-2 p-2 sm:p-3 bg-slate-950/80 border-t border-blue-500/20 backdrop-blur-xs flex-shrink-0">
            <button
              onClick={() => {
                onAddToList(card);
                onClose();
              }}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg font-semibold transition-all text-xs sm:text-sm ${
                isInList
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isInList ? (
                <>
                  <Copy size={12} />
                  En Listado
                </>
              ) : (
                <>
                  <Plus size={12} />
                  Añadir
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all text-xs sm:text-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

function getColorHex(color: string): string {
  const colors: Record<string, string> = {
    'W': '#F0E6D2',
    'U': '#0E68AB',
    'B': '#150B00',
    'R': '#D3291C',
    'G': '#00733E',
    'M': '#9D7C3E',
    'C': '#B0B0B0'
  };
  return colors[color] || '#666';
}

function getColorLabel(color: string): string {
  const labels: Record<string, string> = {
    'W': 'Blanco',
    'U': 'Azul',
    'B': 'Negro',
    'R': 'Rojo',
    'G': 'Verde',
    'M': 'Multicolor',
    'C': 'Incoloro'
  };
  return labels[color] || color;
}

export default CardZoomModal;
