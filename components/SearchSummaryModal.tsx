import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { SearchResult } from '../types';

interface SearchSummaryModalProps {
  searchResult: SearchResult;
  onAccept: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

const SearchSummaryModal: React.FC<SearchSummaryModalProps> = ({
  searchResult,
  onAccept,
  onCancel,
  isVisible
}) => {
  if (!isVisible) return null;

  const conflictCount = Object.keys(searchResult.conflicts).length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-96 overflow-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Resumen de Búsqueda</h2>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
            <div className="text-2xl font-bold text-gray-700">
              {searchResult.processed}
            </div>
            <span className="text-sm text-gray-600">Nombres procesados</span>
          </div>

          <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg">
            <CheckCircle className="text-green-600" size={20} />
            <div>
              <div className="text-2xl font-bold text-green-700">
                {searchResult.found.length}
              </div>
              <span className="text-sm text-green-600">Encontradas</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 bg-red-100 rounded-lg">
            <XCircle className="text-red-600" size={20} />
            <div>
              <div className="text-2xl font-bold text-red-700">
                {searchResult.notFound.length}
              </div>
              <span className="text-sm text-red-600">No encontradas</span>
            </div>
          </div>
        </div>

        {/* Conflicts Warning */}
        {conflictCount > 0 && (
          <div className="mb-6 p-4 bg-amber-100 border border-amber-400 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">
                  ⚠️ {conflictCount} carta(s) con múltiples ubicaciones
                </h3>
                <div className="space-y-2 text-sm text-amber-800 max-h-32 overflow-y-auto">
                  {Object.entries(searchResult.conflicts).map(([cardName, paths]) => (
                    <div key={cardName}>
                      <strong>{cardName}</strong>
                      <ul className="ml-4 mt-1 space-y-0.5">
                        {paths.map((path, idx) => (
                          <li key={idx} className="text-amber-700 text-xs font-mono">
                            {idx + 1}. {path}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-amber-700 italic border-t border-amber-300 pt-2">
                  Resuelve la duplicidad en la carpeta de origen. Estas cartas NO se procesarán.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Not Found List */}
        {searchResult.notFound.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <XCircle size={18} className="text-red-600" />
              Cartas no encontradas ({searchResult.notFound.length})
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg max-h-24 overflow-y-auto">
              <ul className="space-y-1 text-sm text-gray-700">
                {searchResult.notFound.map((cardName, idx) => (
                  <li key={idx}>• {cardName}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onAccept}
            disabled={searchResult.found.length === 0}
            className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <CheckCircle size={18} />
            Aceptar ({searchResult.found.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchSummaryModal;
