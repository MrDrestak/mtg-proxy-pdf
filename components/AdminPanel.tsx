import React, { useState, useRef, useMemo } from 'react';
import { X, Upload, Trash2, Edit2, Eye, EyeOff, Tag, Plus, Settings } from 'lucide-react';
import { CardImage, CardColor } from '../types';
import { fileToDataUrl } from '../services/imageProcessor';
import CardPreview from './CardPreview';

const MANA_COLORS: { value: CardColor; label: string; color: string }[] = [
  { value: 'W', label: 'Blanco', color: 'bg-yellow-100' },
  { value: 'U', label: 'Azul', color: 'bg-blue-500' },
  { value: 'B', label: 'Negro', color: 'bg-slate-800' },
  { value: 'R', label: 'Rojo', color: 'bg-red-600' },
  { value: 'G', label: 'Verde', color: 'bg-green-600' },
  { value: 'C', label: 'Incoloro', color: 'bg-gray-400' },
];

interface AdminPanelProps {
  cards: CardImage[];
  onAddCard: (card: CardImage, imageData?: string) => Promise<void>;
  onUpdateCard: (cardId: string, updates: Partial<CardImage>) => Promise<void>;
  onRemoveCard?: (cardId: string) => Promise<void>;
  watermarkOpacity: number;
  watermarkScale: number;
  showWatermark: boolean;
  onWatermarkChange: (field: 'opacity' | 'scale' | 'show', value: number | boolean) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({
  cards,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  watermarkOpacity,
  watermarkScale,
  showWatermark,
  onWatermarkChange,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editNickname, setEditNickname] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Form states for card metadata
  const [formName, setFormName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formColors, setFormColors] = useState<CardColor[]>([]);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagManager, setShowTagManager] = useState(false);

  // Extract all existing tags from cards, with default "Anime" tag
  const existingTags = useMemo(() => {
    const tags = new Set<string>();
    tags.add('Anime'); // Default tag
    cards.forEach(card => {
      card.tags?.forEach(tag => tags.add(tag));
    });
    const result = Array.from(tags).sort();
    return result;
  }, [cards]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[AdminPanel] handleFileSelect triggered');
    console.log('[AdminPanel] Current form state:', {
      name: formName,
      nickname: formNickname,
      colors: formColors,
      tags: formTags
    });
    const files = Array.from(e.target.files || []);
    console.log('[AdminPanel] Files selected:', files.length);

    if (files.length === 0) {
      console.warn('[AdminPanel] No files selected');
      return;
    }

    setIsUploading(true);
    setUploadStatus('');
    const totalFiles = files.length;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`[AdminPanel] Processing file ${i + 1}/${totalFiles}:`, file.name);

        try {
          setUploadStatus(`Procesando ${i + 1}/${totalFiles}: ${file.name.substring(0, 20)}...`);
          const dataUrl = await fileToDataUrl(file);
          console.log(`[AdminPanel] File converted to dataUrl: ${file.name}`);

          // Use form metadata if provided, else use filename
          const cardName = formName || file.name.replace(/\.[^/.]+$/, '');

          const newCard: CardImage = {
            id: Math.random().toString(36).substr(2, 9),
            name: cardName,
            nickname: formNickname || undefined,
            dataUrl,
            colors: formColors.length > 0 ? formColors : undefined,
            tags: formTags.length > 0 ? formTags : undefined,
            createdAt: new Date(),
          };
          setUploadProgress(((i + 0.5) / totalFiles) * 100);

          // Supabase save is async
          setUploadStatus(`Guardando en Supabase: ${file.name.substring(0, 20)}...`);
          console.log(`[AdminPanel] Uploading to Supabase: ${file.name}`);
          // Pass dataUrl as second argument for Firebase Storage upload
          await onAddCard(newCard, dataUrl);
          console.log(`[AdminPanel] Successfully uploaded: ${file.name}`);

          setUploadProgress(((i + 1) / totalFiles) * 100);
        } catch (error) {
          console.error(`[AdminPanel] Error processing file ${file.name}:`, error);
          setUploadStatus(`Error: ${file.name} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setIsUploading(false);
      setUploadStatus('¡Carga completada!');
      console.log('[AdminPanel] Upload complete');

      // Keep progress at 100% for 2 seconds, then reset
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStatus('');
      }, 2000);

      // Reset form
      setFormName('');
      setFormNickname('');
      setFormColors([]);
      setFormTags([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[AdminPanel] Unexpected error in handleFileSelect:', error);
      setIsUploading(false);
      setUploadStatus(`Error inesperado: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  };

  const startEditingCard = (card: CardImage) => {
    setEditingCardId(card.id);
    setEditNickname(card.nickname || '');
    setEditTags(card.tags || []);
  };

  const saveCardEdit = async (cardId: string) => {
    await onUpdateCard(cardId, {
      nickname: editNickname || undefined,
      tags: editTags
    });
    setEditingCardId(null);
    setEditNickname('');
    setEditTags([]);
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
          {/* 1. Watermark Calibration Section - PRIMERO */}
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

          {/* 2. Card Info + Upload (UNIFIED) */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-500/20 p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Edit2 size={20} className="text-purple-400" />
              Card Info
            </h3>

            <div className="space-y-4">
              {/* Info: Name & Mana are permanent */}
              <p className="text-xs text-slate-400 bg-slate-800/50 p-2 rounded">
                💡 <strong>Nombre</strong> y <strong>Color de Maná</strong> son permanentes. Si cometes un error, debes borrar y volver a cargar la carta.
              </p>
              {/* Name Input - Required */}
              <div>
                <label className="text-white text-sm font-semibold block mb-2">Nombre <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nombre de la carta (requerido)"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                  required
                />
              </div>

              {/* Nickname Input */}
              <div>
                <label className="text-white text-sm font-semibold block mb-2">Apodo (opcional)</label>
                <input
                  type="text"
                  value={formNickname}
                  onChange={(e) => setFormNickname(e.target.value)}
                  placeholder="Apodo o variante"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>

              {/* Mana Color Selection */}
              <div>
                <label className="text-white text-sm font-semibold block mb-3">Color de Maná</label>
                <div className="flex flex-wrap gap-2">
                  {MANA_COLORS.map((mana) => (
                    <button
                      key={mana.value}
                      onClick={() =>
                        setFormColors(prev =>
                          prev.includes(mana.value)
                            ? prev.filter(c => c !== mana.value)
                            : [...prev, mana.value]
                        )
                      }
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-semibold ${
                        formColors.includes(mana.value)
                          ? `border-blue-500 ${mana.color} bg-opacity-50`
                          : `border-slate-600 bg-slate-800 text-slate-300 hover:border-blue-500/50`
                      }`}
                    >
                      {mana.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags Selection - Dropdown + Add Button */}
              <div className="space-y-3">
                <label className="text-white text-sm font-semibold flex items-center gap-2">
                  <Tag size={16} />
                  Etiquetas
                </label>

                {/* Tags Dropdown List */}
                <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {existingTags.length === 0 ? (
                    <p className="text-slate-400 text-xs">No hay etiquetas. Crea una nueva.</p>
                  ) : (
                    <div className="space-y-2">
                      {existingTags.map((tag) => (
                        <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-slate-600 p-1 rounded transition-colors">
                          <input
                            type="checkbox"
                            checked={formTags.includes(tag)}
                            onChange={(e) => {
                              setFormTags(prev =>
                                e.target.checked
                                  ? [...prev, tag]
                                  : prev.filter(t => t !== tag)
                              );
                            }}
                            className="w-4 h-4 rounded accent-blue-500 cursor-pointer"
                          />
                          <span className="text-white text-sm">{tag}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Tags Display */}
                {formTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formTags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Add New Tag */}
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Nueva etiqueta..."
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newTagInput.trim()) {
                        setFormTags(prev => [...new Set([...prev, newTagInput.trim()])]);
                        setNewTagInput('');
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newTagInput.trim()) {
                        setFormTags(prev => [...new Set([...prev, newTagInput.trim()])]);
                        setNewTagInput('');
                      }
                    }}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1 font-semibold text-sm"
                  >
                    <Plus size={16} />
                    Agregar
                  </button>
                  <button
                    onClick={() => setShowTagManager(true)}
                    className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1 font-semibold text-sm"
                  >
                    <Settings size={16} />
                    Editar Etiquetas
                  </button>
                </div>
              </div>


              {/* File Upload Section - INTEGRATED */}
              <div className="pt-4 border-t border-slate-700/50">
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

                {/* Progress Bar */}
                {isUploading && (
                  <div className="mt-4 space-y-2">
                    <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden border border-blue-500/30">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    {uploadStatus && (
                      <p className="text-xs text-blue-300 text-center">{uploadStatus}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Info Text */}
              {!isUploading && (
                <p className="text-xs text-slate-400 text-center">
                  Los campos se reinician después de cada carga
                </p>
              )}
            </div>
          </div>

          {/* 3. Cards Management Section */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-500/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Eye size={20} className="text-green-400" />
              Cartas Cargadas ({cards.length})
            </h3>

            {cards.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No hay cartas cargadas</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:max-w-6xl">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="relative bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden hover:border-blue-500/50 transition-all flex flex-col h-full group"
                  >
                    {/* Card Preview - fills available space */}
                    <div className="aspect-[63/88] bg-black flex-shrink-0 overflow-hidden">
                      <CardPreview
                        card={card}
                        foilMode={false}
                        showWatermark={showWatermark}
                        watermarkOpacity={watermarkOpacity}
                        watermarkScale={watermarkScale}
                        fillContainer={true}
                      />
                    </div>

                    {/* Card Info */}
                    <div className="p-2 space-y-1 border-t border-slate-700/50 flex-1 overflow-hidden flex flex-col">
                      {/* Nickname - Displayed First and Larger */}
                      {card.nickname && (
                        <div className="mb-1">
                          <p className="text-amber-300 text-sm font-semibold truncate">{card.nickname}</p>
                        </div>
                      )}

                      {/* Name - Read Only */}
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Nombre (no editable)</p>
                        <p className={`${card.nickname ? 'text-xs' : 'text-sm'} text-white font-semibold truncate`}>{card.name}</p>
                      </div>

                      {editingCardId === card.id ? (
                        <div className="space-y-3">
                          {/* Edit Nickname */}
                          <div>
                            <label className="text-xs text-slate-400 block mb-1">Apodo</label>
                            <input
                              type="text"
                              value={editNickname}
                              onChange={(e) => setEditNickname(e.target.value)}
                              placeholder="Apodo (opcional)"
                              className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                              autoFocus
                            />
                          </div>

                          {/* Edit Tags - Dropdown */}
                          <div>
                            <label className="text-xs text-slate-400 block mb-2">Etiquetas</label>
                            <div className="bg-slate-600 border border-slate-500 rounded p-2 max-h-24 overflow-y-auto space-y-1">
                              {existingTags.map((tag) => (
                                <label key={tag} className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 p-1 rounded text-xs">
                                  <input
                                    type="checkbox"
                                    checked={editTags.includes(tag)}
                                    onChange={(e) => {
                                      setEditTags(prev =>
                                        e.target.checked
                                          ? [...prev, tag]
                                          : prev.filter(t => t !== tag)
                                      );
                                    }}
                                    className="w-3 h-3 rounded accent-blue-500 cursor-pointer"
                                  />
                                  <span className="text-slate-200">{tag}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {/* Save Button */}
                          <button
                            onClick={() => saveCardEdit(card.id).catch(err => console.error('Error saving card:', err))}
                            className="w-full px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition-colors"
                          >
                            Guardar Cambios
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 flex flex-col h-full">
                          {/* Display Nickname - Already shown above, skip here */}

                          {/* Display Tags */}
                          {card.tags && card.tags.length > 0 && (
                            <div className="flex flex-wrap gap-0.5">
                              {card.tags.map((tag) => (
                                <span key={tag} className="px-1.5 py-0.5 bg-blue-600/60 text-blue-100 text-[10px] rounded-full truncate">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Edit Button Section */}
                          <div className="mt-auto pt-2 border-t border-slate-700/30 space-y-1.5">
                            <button
                              onClick={() => startEditingCard(card)}
                              className="w-full px-2 py-1.5 bg-blue-600/40 hover:bg-blue-600/60 text-blue-300 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors"
                            >
                              <Edit2 size={12} />
                              Editar
                            </button>
                            {onRemoveCard && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar "${card.name}"?`)) {
                                    onRemoveCard(card.id).catch(err => console.error('Error removing card:', err));
                                  }
                                }}
                                className="w-full px-2 py-1.5 bg-red-600/40 hover:bg-red-600/60 text-red-300 text-xs font-semibold rounded flex items-center justify-center gap-1 transition-colors"
                              >
                                <Trash2 size={12} />
                                Eliminar
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tag Manager Modal */}
      {showTagManager && (
        <>
          <div className="fixed inset-0 bg-black/80 z-40" onClick={() => setShowTagManager(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl shadow-2xl max-w-md w-full max-h-[70vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 flex items-center justify-between px-6 py-4 border-b border-blue-500/20 bg-slate-950/80">
                <h3 className="text-lg font-black text-white">Editar Etiquetas</h3>
                <button
                  onClick={() => setShowTagManager(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-300" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {existingTags.length === 0 ? (
                  <p className="text-slate-400 text-center py-6">No hay etiquetas para editar</p>
                ) : (
                  <div className="space-y-2">
                    {existingTags.map((tag) => (
                      <div key={tag} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-all">
                        <span className="text-white font-semibold text-sm">{tag}</span>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar etiqueta "${tag}"?`)) {
                              // Remove tag from all cards
                              cards.forEach(card => {
                                if (card.tags?.includes(tag)) {
                                  const updatedTags = card.tags.filter(t => t !== tag);
                                  onUpdateCard(card.id, { tags: updatedTags }).catch(err => console.error('Error updating card:', err));
                                }
                              });
                            }
                          }}
                          className="p-1.5 bg-red-600/40 hover:bg-red-600/60 text-red-300 rounded transition-colors"
                          title="Eliminar etiqueta"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 flex gap-2 p-6 bg-slate-950/80 border-t border-blue-500/20">
                <button
                  onClick={() => setShowTagManager(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;
