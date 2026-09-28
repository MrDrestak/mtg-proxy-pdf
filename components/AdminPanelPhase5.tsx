import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Edit2, Save, AlertCircle } from 'lucide-react';
import { CardImage, CardColor, MTG_COLORS } from '../types';
import CardPreview from './CardPreview';

interface AdminPanelPhase5Props {
  cards: CardImage[];
  onAddCard: (card: CardImage) => void;
  onRemoveCard: (cardId: string) => void;
  onUpdateCard: (cardId: string, updates: Partial<CardImage>) => void;
  watermarkOpacity: number;
  watermarkScale: number;
  showWatermark: boolean;
  onWatermarkChange: (field: 'opacity' | 'scale' | 'show', value: number | boolean) => void;
  onClose: () => void;
  isLoading?: boolean;
  firebaseEnabled?: boolean;
}

interface EditingCard {
  id: string;
  name: string;
  nickname: string;
  colors: CardColor[];
  tags: string[];
  notes: string;
}

const AdminPanelPhase5: React.FC<AdminPanelPhase5Props> = ({
  cards,
  onAddCard,
  onRemoveCard,
  onUpdateCard,
  watermarkOpacity,
  watermarkScale,
  showWatermark,
  onWatermarkChange,
  onClose,
  isLoading = false,
  firebaseEnabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [editingCard, setEditingCard] = useState<EditingCard | null>(null);
  const [newTag, setNewTag] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    setIsUploading(true);
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const newCard: CardImage = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name.replace(/\.[^/.]+$/, ''),
            dataUrl,
            originalDataUrl: dataUrl,
            type: file.type,
            colors: [],
            tags: [],
            createdAt: new Date()
          };
          onAddCard(newCard);
          setUploadProgress(((i + 1) / totalFiles) * 100);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError(`Error processing ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setIsUploading(false);
    setTimeout(() => setUploadProgress(0), 1000);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startEditingCard = (card: CardImage) => {
    setEditingCard({
      id: card.id,
      name: card.name,
      nickname: card.nickname || '',
      colors: card.colors || [],
      tags: card.tags || [],
      notes: card.notes || ''
    });
  };

  const saveCardEdits = (cardId: string) => {
    if (!editingCard || editingCard.id !== cardId) return;

    onUpdateCard(cardId, {
      name: editingCard.name,
      nickname: editingCard.nickname,
      colors: editingCard.colors,
      tags: editingCard.tags,
      notes: editingCard.notes
    });

    setEditingCard(null);
  };

  const toggleColor = (color: CardColor) => {
    if (!editingCard) return;
    setEditingCard(prev =>
      prev ? {
        ...prev,
        colors: prev.colors.includes(color)
          ? prev.colors.filter(c => c !== color)
          : [...prev.colors, color]
      } : null
    );
  };

  const addTag = () => {
    if (!editingCard || !newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (!editingCard.tags.includes(tag)) {
      setEditingCard(prev =>
        prev ? { ...prev, tags: [...prev.tags, tag] } : null
      );
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    if (!editingCard) return;
    setEditingCard(prev =>
      prev ? { ...prev, tags: prev.tags.filter(t => t !== tag) } : null
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-blue-500/20 bg-slate-950/80 flex-shrink-0">
        <h2 className="text-lg sm:text-xl font-black text-white">Panel de Administración</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={24} className="text-slate-300" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
          {/* Firebase Status */}
          {!firebaseEnabled && (
            <div className="bg-amber-900/30 border border-amber-500/50 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-300">Firebase no configurado</p>
                <p className="text-xs text-amber-200/70 mt-1">
                  Los cambios se guardarán localmente. Configure variables de entorno de Firebase para persistencia en la nube.
                </p>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-500/20 p-4 sm:p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload size={20} className="text-blue-400" />
              Cargar Nuevas Cartas
            </h3>

            <div className="space-y-4">
              <label className="flex flex-col items-center justify-center p-6 sm:p-8 border-2 border-dashed border-blue-500/30 rounded-lg cursor-pointer hover:border-blue-500/60 transition-colors">
                <Upload size={32} className="text-blue-400 mb-2" />
                <span className="text-sm sm:text-base font-semibold text-white">Seleccionar imágenes</span>
                <span className="text-xs sm:text-sm text-slate-400 mt-1">o arrastra aquí</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-slate-800 rounded-lg overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {error && (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 text-sm text-red-300">
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              Cartas Cargadas ({cards.length})
            </h3>

            {cards.length === 0 ? (
              <div className="text-center py-8 bg-slate-900/30 rounded-lg border border-slate-700/50">
                <p className="text-slate-400">No hay cartas cargadas</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden hover:border-blue-500/50 transition-all"
                  >
                    {editingCard?.id === card.id ? (
                      // Edit Mode
                      <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
                        {/* Name */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Nombre</label>
                          <input
                            type="text"
                            value={editingCard.name}
                            onChange={(e) => setEditingCard({ ...editingCard, name: e.target.value })}
                            className="w-full mt-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-white"
                          />
                        </div>

                        {/* Nickname */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Apodo</label>
                          <input
                            type="text"
                            value={editingCard.nickname}
                            onChange={(e) => setEditingCard({ ...editingCard, nickname: e.target.value })}
                            placeholder="Opcional"
                            className="w-full mt-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-sm text-white placeholder-slate-500"
                          />
                        </div>

                        {/* Colors */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Identidad de Color</label>
                          <div className="flex flex-wrap gap-1">
                            {(Object.keys(MTG_COLORS) as CardColor[]).map((color) => (
                              <button
                                key={color}
                                onClick={() => toggleColor(color)}
                                className={`w-6 h-6 rounded-full border-2 transition-all ${
                                  editingCard.colors.includes(color)
                                    ? 'border-blue-500 shadow-lg shadow-blue-500/50'
                                    : 'border-slate-600'
                                }`}
                                style={{ backgroundColor: MTG_COLORS[color].color }}
                                title={MTG_COLORS[color].label}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Categorías</label>
                          <div className="flex gap-1 mb-2 flex-wrap">
                            {editingCard.tags.map((tag) => (
                              <button
                                key={tag}
                                onClick={() => removeTag(tag)}
                                className="px-2 py-0.5 bg-blue-600/30 border border-blue-500/50 text-blue-300 text-xs rounded-full flex items-center gap-1 hover:bg-blue-600/50"
                              >
                                #{tag}
                                <X size={12} />
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && addTag()}
                              placeholder="Nuevo..."
                              className="flex-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500"
                            />
                            <button
                              onClick={addTag}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="text-xs font-bold text-slate-400 uppercase">Notas</label>
                          <textarea
                            value={editingCard.notes}
                            onChange={(e) => setEditingCard({ ...editingCard, notes: e.target.value })}
                            placeholder="Opcional"
                            className="w-full mt-1 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-white placeholder-slate-500 resize-none h-20"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => saveCardEdits(card.id)}
                            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors"
                          >
                            <Save size={14} />
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingCard(null)}
                            className="flex-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Preview Mode
                      <div className="space-y-2">
                        <div className="aspect-square bg-black overflow-hidden">
                          <CardPreview
                            card={card}
                            showWatermark={showWatermark}
                            watermarkOpacity={watermarkOpacity}
                            watermarkScale={watermarkScale}
                          />
                        </div>
                        <div className="px-2 py-2 space-y-1">
                          <p className="text-xs font-semibold text-white truncate">{card.name}</p>
                          {card.nickname && (
                            <p className="text-xs text-amber-300 truncate">{card.nickname}</p>
                          )}
                          {card.colors && card.colors.length > 0 && (
                            <div className="flex gap-1">
                              {card.colors.map((color) => (
                                <div
                                  key={color}
                                  className="w-3 h-3 rounded-full border border-slate-600"
                                  style={{ backgroundColor: MTG_COLORS[color].color }}
                                />
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => startEditingCard(card)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-600/50 hover:bg-blue-600 text-blue-300 hover:text-white text-xs rounded transition-colors"
                            >
                              <Edit2 size={12} />
                              Editar
                            </button>
                            <button
                              onClick={() => onRemoveCard(card.id)}
                              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-900/50 hover:bg-red-900 text-red-300 hover:text-red-200 text-xs rounded transition-colors"
                            >
                              <Trash2 size={12} />
                              Borrar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Watermark Settings */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-500/20 p-4 sm:p-6">
            <h3 className="text-lg font-bold text-white mb-4">Configuración de Marca de Agua</h3>

            <div className="space-y-4">
              {/* Show Watermark Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-white">Mostrar marca de agua</label>
                <button
                  onClick={() => onWatermarkChange('show', !showWatermark)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showWatermark ? 'bg-blue-600' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showWatermark ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {showWatermark && (
                <>
                  {/* Opacity */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-white">Opacidad</label>
                      <span className="text-xs text-slate-400">{watermarkOpacity}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="85"
                      value={watermarkOpacity}
                      onChange={(e) => onWatermarkChange('opacity', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Scale */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-white">Escala</label>
                      <span className="text-xs text-slate-400">{watermarkScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="60"
                      max="150"
                      value={watermarkScale}
                      onChange={(e) => onWatermarkChange('scale', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPhase5;
