import React, { useState, useMemo } from 'react';
import { X, Copy, Download } from 'lucide-react';
import { CardImage } from '../types';

interface ListingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cards: CardImage[];
}

const ListingDrawer: React.FC<ListingDrawerProps> = ({ isOpen, onClose, cards }) => {
  const [copied, setCopied] = useState(false);

  // Format listing: "Nombre [Nickname]"
  const listingText = useMemo(() => {
    return cards
      .map(card => {
        const name = card.name || 'Unknown';
        const nickname = card.nickname ? ` [${card.nickname}]` : '';
        return `${name}${nickname}`;
      })
      .join('\n');
  }, [cards]);

  const handleCopy = () => {
    navigator.clipboard.writeText(listingText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(listingText)}`);
    element.setAttribute('download', 'mtg-proxy-labs-listado.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-gradient-to-b from-slate-900 to-black border-l border-blue-500/30 shadow-2xl z-50 transition-transform duration-300 overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-500/20 bg-slate-950/80 flex-shrink-0">
          <h2 className="text-lg font-black text-white">Listado Rápido</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cards.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">No hay cartas en tu galería</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-400 uppercase font-bold tracking-widest mb-4">
                {cards.length} {cards.length === 1 ? 'Carta' : 'Cartas'}
              </p>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 max-h-96 overflow-y-auto">
                <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap break-words leading-relaxed">
                  {listingText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {cards.length > 0 && (
          <div className="flex gap-2 p-4 bg-slate-950/80 border-t border-blue-500/20 flex-shrink-0">
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Copy size={16} />
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-sm transition-all"
            >
              <Download size={16} />
              Descargar
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default ListingDrawer;
