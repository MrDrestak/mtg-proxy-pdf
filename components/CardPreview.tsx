
import React, { useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { CARD, MM_TO_PX } from '../constants';
import { CardImage } from '../types';
import WatermarkStamp from './WatermarkStamp';

interface CardPreviewProps {
  card: CardImage | null;
  onRemove?: () => void;
  foilMode?: boolean;
  showWatermark?: boolean;
  watermarkOpacity?: number;
  watermarkScale?: number;
  fillContainer?: boolean;
}

const CardPreview: React.FC<CardPreviewProps> = ({
  card,
  onRemove,
  foilMode = false,
  showWatermark = true,
  watermarkOpacity = 35,
  watermarkScale = 100,
  fillContainer = false
}) => {
  const width = CARD.width * MM_TO_PX;
  const height = CARD.height * MM_TO_PX;
  const cardRef = useRef<HTMLDivElement>(null);

  // Bloquear clic derecho y drag
  const handleContextMenu = (e: React.MouseEvent) => {
    if (card) e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (card) e.preventDefault();
  };

  return (
    <div
      ref={cardRef}
      className={`group relative flex items-center justify-center overflow-hidden transition-all duration-200 rounded-lg ${
        card
          ? card.isFoil
            ? 'border border-blue-500/40 shadow-xl'
            : foilMode
            ? 'bg-[repeating-conic-gradient(#cbd5e1_0%_25%,#f1f5f9_0%_50%)] bg-[length:12px_12px] border border-blue-400/60 shadow-xl'
            : 'bg-black border border-slate-700/60 shadow-xl hover:shadow-blue-500/30'
          : 'border-2 border-dashed border-slate-600 bg-slate-950 hover:border-blue-500/50'
      }`}
      style={{
        ...(card?.isFoil && {
          background: [
            'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.45) 32%, transparent 44%, rgba(255,255,255,0.3) 62%, transparent 74%)',
            'linear-gradient(135deg, #ff5ecb 0%, #7a5cff 18%, #2ec5ff 36%, #35f2b0 54%, #ffe45c 72%, #ff7a5c 88%, #ff5ecb 100%)'
          ].join(', ')
        }),
        ...(fillContainer ? { width: '100%', aspectRatio: '63 / 88' } : { width: `${width}px`, height: `${height}px` })
      }}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
    >
      {card ? (
        <>
          <img
            src={card.dataUrl}
            alt={card.name}
            className="w-full h-full object-cover select-none pointer-events-none"
            draggable={false}
          />

          {/* Watermark Overlay */}
          {showWatermark && (
            <WatermarkStamp opacity={watermarkOpacity} scale={watermarkScale} />
          )}

          {/* Delete Button */}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-red-600 text-white rounded-full transition-all duration-200 shadow-md backdrop-blur-xs flex items-center justify-center pointer-events-auto opacity-0 group-hover:opacity-100"
              title="Eliminar carta"
            >
              <Trash2 size={14} />
            </button>
          )}

          {(foilMode || card.isFoil) && (
            <div className="absolute bottom-1 left-1 pointer-events-none bg-blue-900/80 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 backdrop-blur-xs">
              <span>✦</span>
              <span>FOIL</span>
            </div>
          )}
        </>
      ) : (
        <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">Slot Vacío</span>
      )}
    </div>
  );
};

export default CardPreview;
