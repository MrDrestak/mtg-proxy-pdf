import React, { useState } from 'react';
import { GripVertical, Copy, Trash2, Grid3x3, List } from 'lucide-react';
import { CardImage } from '../types';

interface CardManagerPopupProps {
  cards: CardImage[];
  cardsOrder: number[];
  onUpdateOrder: (newOrder: number[]) => void;
  onDuplicate: (cardId: string) => void;
  onDelete: (cardId: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

type ViewMode = 'list' | 'grid';

const CardManagerPopup: React.FC<CardManagerPopupProps> = ({
  cards,
  cardsOrder,
  onUpdateOrder,
  onDuplicate,
  onDelete,
  onClose,
  isVisible
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [gridPage, setGridPage] = useState(0);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [dragOverItem, setDragOverItem] = useState<number | null>(null);

  if (!isVisible) return null;

  const orderedCards = cardsOrder.map(idx => cards[idx]).filter(Boolean);
  const cardsPerPage = 9;
  const totalPages = Math.ceil(orderedCards.length / cardsPerPage);
  const currentPageCards = orderedCards.slice(
    gridPage * cardsPerPage,
    (gridPage + 1) * cardsPerPage
  );

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedItem === null || draggedItem === targetIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newOrder = [...cardsOrder];
    const draggedCardIdx = newOrder[draggedItem];
    newOrder.splice(draggedItem, 1);
    newOrder.splice(targetIndex, 0, draggedCardIdx);

    onUpdateOrder(newOrder);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDuplicate = (cardId: string) => {
    onDuplicate(cardId);
  };

  const handleDelete = (cardId: string) => {
    onDelete(cardId);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="border-b p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Gestor de Cartas</h2>
            <p className="text-sm text-gray-500 mt-1">{orderedCards.length} cartas en el flujo</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setViewMode('list');
                setGridPage(0);
              }}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Vista Lista"
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              title="Vista Grid"
            >
              <Grid3x3 size={20} />
            </button>
            <button
              onClick={onClose}
              className="ml-4 px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {orderedCards.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No hay cartas para gestionar</p>
            </div>
          ) : viewMode === 'list' ? (
            // LIST VIEW with drag-drop
            <div className="space-y-2">
              {orderedCards.map((card, index) => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(index)}
                  className={`flex items-center gap-4 p-4 bg-gray-50 rounded-lg border-2 transition-all cursor-move ${
                    draggedItem === index
                      ? 'opacity-50 border-blue-500 bg-blue-50'
                      : dragOverItem === index
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <GripVertical size={20} className="text-gray-400 flex-shrink-0" />

                  <img
                    src={card.dataUrl}
                    alt={card.name}
                    className="w-12 h-16 object-cover rounded border border-gray-300"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{card.name}</p>
                    <p className="text-sm text-gray-500">
                      Pos: {index + 1} / {orderedCards.length}
                    </p>
                    {card.sourcePath && (
                      <p className="text-xs text-gray-400 truncate">{card.sourcePath}</p>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDuplicate(card.id)}
                      title="Duplicar carta"
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(card.id)}
                      title="Eliminar carta"
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // GRID VIEW with pagination
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                {currentPageCards.map((card, idx) => (
                  <div
                    key={card?.id || `empty-${idx}`}
                    className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors group"
                  >
                    {card ? (
                      <>
                        <img
                          src={card.dataUrl}
                          alt={card.name}
                          className="w-24 h-32 object-cover rounded border border-gray-300"
                        />
                        <div className="text-xs font-semibold text-gray-700 text-center truncate w-full">
                          {card.name}
                        </div>
                        <div className="text-xs text-gray-500 text-center">
                          Pos: {gridPage * cardsPerPage + idx + 1}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDuplicate(card.id)}
                            title="Duplicar"
                            className="p-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(card.id)}
                            title="Eliminar"
                            className="p-1 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="w-24 h-32 flex items-center justify-center text-gray-400">
                        <span className="text-xs">Vacío</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Grid Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-4">
                  <button
                    onClick={() => setGridPage(Math.max(0, gridPage - 1))}
                    disabled={gridPage === 0}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  >
                    ◀ Anterior
                  </button>
                  <span className="text-sm font-semibold text-gray-700">
                    Hoja {gridPage + 1} de {totalPages}
                  </span>
                  <button
                    onClick={() => setGridPage(Math.min(totalPages - 1, gridPage + 1))}
                    disabled={gridPage === totalPages - 1}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors"
                  >
                    Siguiente ▶
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CardManagerPopup;
