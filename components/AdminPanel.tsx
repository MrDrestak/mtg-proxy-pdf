import React, { useState, useRef, useMemo } from 'react';
import { X, Upload, Trash2, Edit2, Eye, EyeOff, Tag, Plus, Settings } from 'lucide-react';
import { CardImage, CardColor } from '../types';
import { fileToDataUrl } from '../services/imageProcessor';
import CardPreview from './CardPreview';

const MANA_COLORS: { value: CardColor; label: string; color: string }[] = [
  { value: 'white', label: 'Blanco', color: 'bg-yellow-100' },
  { value: 'blue', label: 'Azul', color: 'bg-blue-500' },
  { value: 'black', label: 'Negro', color: 'bg-slate-800' },
  { value: 'red', label: 'Rojo', color: 'bg-red-600' },
  { value: 'green', label: 'Verde', color: 'bg-green-600' },
  { value: 'multicolor', label: 'Multicolor', color: 'bg-gradient-to-r from-yellow-400 via-red-500 to-green-500' },
  { value: 'colorless', label: 'Incoloro', color: 'bg-gray-400' },
];

interface AdminPanelProps {
  cards: CardImage[];
  onAddCard: (card: CardImage) => Promise<void>;
  onRemoveCard: (cardId: string) => Promise<void>;
  onUpdateCard: (cardId: string, updates: Partial<CardImage>) => Promise<void>;
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
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // Form states for card metadata
  const [formName, setFormName] = useState('');
  const [formNickname, setFormNickname] = useState('');
  const [formColors, setFormColors] = useState<CardColor[]>([]);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagManager, setShowTagManager] = useState(false);

  // Extract all existing tags from cards
  const existingTags = useMemo(() => {
    const tags = new Set<string>();
    cards.forEach(card => {
      card.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [cards]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[AdminPanel] handleFileSelect triggered');
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

          // Firebase save is async
          setUploadStatus(`Guardando en Firebase: ${file.name.substring(0, 20)}...`);
          console.log(`[AdminPanel] Uploading to Firebase: ${file.name}`);
          await onAddCard(newCard);
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

  const startEditingNickname = (cardId: string, currentNickname: string) => {
    setEditingCardId(cardId);
    setEditNickname(currentNickname || '');
  };

  const saveNicknameEdit = async (cardId: string) => {
    await onUpdateCard(cardId, { nickname: editNickname });
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

          {/* 2. Card Metadata Form Section */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-500/20 p-6">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Edit2 size={20} className="text-purple-400" />
              Información de la Carta
            </h3>

            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="text-white text-sm font-semibold block mb-2">Nombre (opcional)</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Nombre personalizado de la carta"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
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

              {/* Tags Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white text-sm font-semibold flex items-center gap-2">
                    <Tag size={16} />
                    Etiquetas
                  </label>
                  <button
                    onClick={() => setShowTagManager(!showTagManager)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Settings size={14} />
                    Gestor
                  </button>
                </div>

                {/* Tag Selection */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {existingTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() =>
                        setFormTags(prev =>
                          prev.includes(tag)
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        formTags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {/* Add New Tag */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Nueva etiqueta..."
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
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
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Tag Manager Panel */}
              {showTagManager && (
                <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 space-y-3">
                  <h4 className="text-white font-semibold text-sm">Gestor de Etiquetas</h4>
                  <div className="flex flex-wrap gap-2">
                    {existingTags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center gap-2 px-3 py-1 bg-slate-700 rounded-full text-sm"
                      >
                        <span className="text-white">{tag}</span>
                        <button
                          onClick={() => {
                            // Remove tag from all cards
                            cards.forEach(card => {
                              if (card.tags?.includes(tag)) {
                                onUpdateCard(card.id, {
                                  tags: card.tags.filter(t => t !== tag)
                                }).catch(err => console.error('Error removing tag:', err));
                              }
                            });
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. Upload Section */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-500/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Upload size={20} className="text-blue-400" />
              Cargar Imágenes
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

          {/* 4. Cards Management Section */}
          <div className="bg-slate-900/50 rounded-xl border border-blue-500/20 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Eye size={20} className="text-green-400" />
              Cartas Cargadas ({cards.length})
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
                            onClick={() => saveNicknameEdit(card.id).catch(err => console.error('Error saving nickname:', err))}
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
                        onClick={() => onRemoveCard(card.id).catch(err => console.error('Error removing card:', err))}
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
