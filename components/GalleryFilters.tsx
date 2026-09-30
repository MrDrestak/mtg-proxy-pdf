import React, { useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { CardImage, CardColor, MTG_COLORS } from '../types';

interface GalleryFiltersProps {
  cards: CardImage[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedColors: CardColor[];
  onColorToggle: (color: CardColor) => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearFilters: () => void;
  onlyFoil: boolean;
  onFoilToggle: () => void;
}

const GalleryFilters: React.FC<GalleryFiltersProps> = ({
  cards,
  searchQuery,
  onSearchChange,
  selectedColors,
  onColorToggle,
  selectedTags,
  onTagToggle,
  onClearFilters,
  onlyFoil,
  onFoilToggle
}) => {
  // Get all available tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    cards.forEach(card => {
      card.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [cards]);

  // Count cards by color
  const colorCounts = useMemo(() => {
    const counts: Record<CardColor, number> = {
      'W': 0, 'U': 0, 'B': 0, 'R': 0, 'G': 0, 'M': 0, 'C': 0
    };
    cards.forEach(card => {
      card.colors?.forEach(color => counts[color]++);
    });
    return counts;
  }, [cards]);

  const foilCount = useMemo(() => cards.filter(c => c.isFoil).length, [cards]);

  const hasActiveFilters = searchQuery || selectedColors.length > 0 || selectedTags.length > 0 || onlyFoil;

  return (
    <div className="space-y-4 p-4 sm:p-6 bg-slate-900/50 rounded-xl border border-blue-500/20">
      {/* Search */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
          Búsqueda
        </label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, nickname..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
        </div>
      </div>

      {/* Mana Colors */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
          Identidad de Color
        </label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MTG_COLORS) as CardColor[]).map((color) => (
            <button
              key={color}
              onClick={() => onColorToggle(color)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm transition-all border-2 ${
                selectedColors.includes(color)
                  ? 'border-blue-500 bg-blue-500/30 text-blue-300 shadow-lg shadow-blue-500/20'
                  : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-blue-500/50'
              }`}
              title={MTG_COLORS[color].label}
            >
              <span
                className="w-5 h-5 rounded-full border border-current"
                style={{ backgroundColor: MTG_COLORS[color].color }}
              />
              <span>{color}</span>
              <span className="text-xs opacity-70">({colorCounts[color]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Foil */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
          Acabado
        </label>
        <button
          onClick={onFoilToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm transition-all border-2 ${
            onlyFoil
              ? 'border-fuchsia-400 bg-fuchsia-500/30 text-fuchsia-200 shadow-lg shadow-fuchsia-500/20'
              : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-fuchsia-400/50'
          }`}
        >
          <span>✦</span>
          <span>Solo Foil</span>
          <span className="text-xs opacity-70">({foilCount})</span>
        </button>
      </div>

      {/* Tags */}
      {allTags.length > 0 && (
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Categorías
          </label>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const tagCount = cards.filter(c => c.tags?.includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => onTagToggle(tag)}
                  className={`px-3 py-1.5 rounded-full font-semibold text-sm transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-amber-600 text-white border-2 border-amber-500 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 border-2 border-slate-700 hover:border-amber-500/50'
                  }`}
                >
                  #{tag} <span className="text-xs opacity-70">({tagCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold transition-all text-sm border border-slate-700/50"
        >
          <X size={16} />
          Limpiar Filtros
        </button>
      )}
    </div>
  );
};

export default GalleryFilters;
