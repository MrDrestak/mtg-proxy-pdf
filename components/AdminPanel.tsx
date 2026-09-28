import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import { CardImage } from '../types';
import { processImage } from '../imageProcessor';
import CardPreview from './CardPreview';

interface AdminPanelProps {
  cards: CardImage[];
  onAddCard: (card: CardImage) => void;
  onRemoveCard: (cardId: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<CardImage>) => void;
  watermarkOpacity: number;
  watermarkScale: number;
  showWatermark: boolean;
  onWatermarkChange: (field: 'opacity' | 'scale' | 'show', value: number | boolean) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  cards,
  onAddCard,
  onRemoveCard,
  onUpdateCard,
  watermarkOpacity,
  watermarkScale,
  showWatermark,
  onWatermarkChange,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const dataUrl = await processImage(file);
        const newCard: CardImage = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name.replace(/\.[^/.]+$/, ''),
          dataUrl,
          createdAt: new Date(),
        };
        onAddCard(newCard);
        setUploadProgress(((i + 1) / totalFiles) * 100);
      } catch (error) {
        console.error('Error processing image:', error);
      }
    }

    setIsUploading(false);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEditingNickname = (cardId: string, currentNickname: string) => {
    setEditingCardId(cardId);
    setEditNickname(currentNickname || '');
  };

  const saveNicknameEdit = (cardId: string) => {
    onUpdateCard(cardId, { nickname: editNickname });
    setEditingCardId(null);
    setEditNickname('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-blue-500/20 bg-slate-950/80 flex-shrink-0">
        <h2 className="text-xl font-black text-white">Panel de Administración</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={24} className="text-slate-300" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Upload Section */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-500/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload size={20} className="text-blue-400" />
              Cargar Nuevas Cartas
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Upload size={18} />
              {isUploading ? `Cargando... ${Math.round(uploadProgress)}%` : 'Seleccionar Imágenes'}
            </button>
          </div>

          {/* Watermark Calibration Section */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-500/20 p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Eye size={20} className="text-amber-400" />
              Calibración de Marca de Agua
            </h3>

            <div className="space-y-6">
              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <div>
                  <p className="text-white font-semibold">Mostrar Marca de Agua</p>
                  <p className="text-slate-400 text-sm">Activar/desactivar protección visual</p>
                </div>
                <button
                  onClick={() => onWatermarkChange('show', !showWatermark)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                    showWatermark ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      showWatermark ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Opacity Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white font-semibold">Opacidad</label>
                  <span className="text-blue-400 font-bold">{watermarkOpacity}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="85"
                  value={watermarkOpacity}
                  onChange={(e) => onWatermarkChange('opacity', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-slate-400 text-xs mt-2">Rango: 10% - 85%</p>
              </div>

              {/* Scale Slider */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white font-semibold">Escala</label>
                  <span className="text-blue-400 font-bold">{watermarkScale}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="150"
                  value={watermarkScale}
                  onChange={(e) => onWatermarkChange('scale', parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <p className="text-slate-400 text-xs mt-2">Rango: 60% - 150%</p>
              </div>
            </div>
          </div>

          {/* Cards Management Section */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-500/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Gestionar Cartas ({cards.length})
            </h3>

            {cards.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay cartas cargadas</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden hover:border-blue-500/50 transition-all"
                  >
                    {/* Card Preview */}
                    <div className="aspect-[63/88] bg-black">
                      <CardPreview
                        card={card}
                        foilMode={false}
                        showWatermark={showWatermark}
                        watermarkOpacity={watermarkOpacity}
                        watermarkScale={watermarkScale}
                      />
                    </div>

                    {/* Card Info */}
                    <div className="p-3 space-y-3 border-t border-slate-700/50">
                      <p className="text-white text-sm font-semibold truncate">{card.name}</p>

                      {/* Nickname Edit */}
                      {editingCardId === card.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            placeholder="Nickname"
                            className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => saveNicknameEdit(card.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors"
                          >
                            Guardar
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="text-amber-300 text-xs flex-1 truncate">
                            {card.nickname || 'Sin nickname'}
                          </p>
                          <button
                            onClick={() => startEditingNickname(card.id, card.nickname || '')}
                            className="p-1 hover:bg-slate-700 rounded transition-colors"
                          >
                            <Edit2 size={14} className="text-slate-400" />
                          </button>
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={() => onRemoveCard(card.id)}
                        className="w-full px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold rounded flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 size={14} />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
