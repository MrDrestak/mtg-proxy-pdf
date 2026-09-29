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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-900 to-black border border-blue-500/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-blue-500/20 bg-slate-950/80 backdrop-blur-xs">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white">{card.name}</h3>
              {card.nickname && (
                <p className="text-sm text-amber-300 font-semibold">{card.nickname}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X size={24} className="text-slate-300" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-6">
            {/* Card Preview - Responsive & Centered */}
            <div className="flex justify-center items-center w-full">
              <div
                className="rounded-xl overflow-hidden shadow-2xl"
                style={{
                  width: 'min(280px, 80vw)',
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

            {/* Card Details */}
            {((card.colors && card.colors.length > 0) || (card.tags && card.tags.length > 0) || card.notes) && (
              <div className="space-y-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                {/* Mana Colors */}
                {card.colors && card.colors.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Identidad de Color</p>
                    <div className="flex flex-wrap gap-3">
                      {card.colors.map((color) => (
                        <div
                          key={color}
                          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-blue-500/40 shadow-lg hover:shadow-xl hover:scale-110 transition-transform"
                          title={getColorLabel(color)}
                          style={{ backgroundColor: getColorHex(color) }}
                        >
                          {color}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {card.tags && card.tags.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Categorías</p>
                    <div className="flex flex-wrap gap-2">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-blue-600/20 border border-blue-500/50 text-blue-300 text-xs font-semibold rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {card.notes && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Notas</p>
                    <p className="text-sm text-slate-300 italic">{card.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onAddToList(card);
                  onClose();
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                  isInList
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isInList ? (
                  <>
                    <Copy size={16} />
                    En Listado
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Añadir a Listado
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
              >
                Cerrar
              </button>
            </div>
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
