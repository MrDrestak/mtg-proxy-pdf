
import React from 'react';
import { Trash2 } from 'lucide-react';
import { CARD, MM_TO_PX } from '../constants';
import { CardImage } from '../types';

interface CardPreviewProps {
  card: CardImage | null;
  onRemove?: () => void;
  foilMode?: boolean;
}

const CardPreview: React.FC<CardPreviewProps> = ({ card, onRemove, foilMode = false }) => {
  const width = CARD.width * MM_TO_PX;
  const height = CARD.height * MM_TO_PX;

  return (
    <div 
      className={`group relative flex items-center justify-center overflow-hidden transition-all duration-200 ${
        card 
          ? foilMode
            ? 'bg-[repeating-conic-gradient(#cbd5e1_0%_25%,#f1f5f9_0%_50%)] bg-[length:12px_12px] border border-indigo-400/60 shadow-xs'
            : 'bg-black border border-slate-700/60 shadow-xs' 
          : 'border-2 border-dashed border-slate-200 bg-slate-50 hover:border-slate-300'
      }`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {card ? (
        <>
          <img src={card.dataUrl} alt={card.name} className="w-full h-full object-cover select-none" />
          {foilMode && (
            <div className="absolute bottom-1 left-1 pointer-events-none bg-indigo-900/80 text-amber-300 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 backdrop-blur-xs">
              <span>✦</span>
              <span>FOIL</span>
            </div>
          )}
          {onRemove && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-red-600 text-white rounded-full transition-all duration-200 shadow-md backdrop-blur-xs flex items-center justify-center pointer-events-auto"
              title="Eliminar carta"
            >
              <Trash2 size={14} />
            </button>
          )}
        </>
      ) : (
        <span className="text-slate-300 text-xs font-medium uppercase tracking-wider">Empty Slot</span>
      )}
    </div>
  );
};

export default CardPreview;
