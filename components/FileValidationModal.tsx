import React from 'react';
import { AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface FileValidationResult {
  success: number;
  errors: string[];
  skipped: number;
}

interface FileValidationModalProps {
  result: FileValidationResult | null;
  isVisible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const FileValidationModal: React.FC<FileValidationModalProps> = ({
  result,
  isVisible,
  onClose,
  onConfirm
}) => {
  if (!isVisible || !result) return null;

  const hasErrors = result.errors.length > 0 || result.skipped > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          {result.success > 0 && !hasErrors ? (
            <>
              <CheckCircle className="text-green-600" size={28} />
              <h2 className="text-xl font-bold text-gray-900">¡Éxito!</h2>
            </>
          ) : hasErrors ? (
            <>
              <AlertTriangle className="text-amber-600" size={28} />
              <h2 className="text-xl font-bold text-gray-900">Procesamiento Parcial</h2>
            </>
          ) : (
            <>
              <XCircle className="text-red-600" size={28} />
              <h2 className="text-xl font-bold text-gray-900">Error</h2>
            </>
          )}
        </div>

        {/* Success count */}
        {result.success > 0 && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              <div>
                <p className="font-semibold text-green-900">
                  {result.success} {result.success === 1 ? 'carta' : 'cartas'} procesadas
                </p>
                <p className="text-sm text-green-700">Listas para añadir a la mesa de impresión</p>
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {result.errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-start gap-2 mb-2">
              <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-red-900">
                  {result.errors.length} {result.errors.length === 1 ? 'error' : 'errores'}
                </p>
              </div>
            </div>
            <ul className="space-y-1 ml-7 text-sm text-red-700 max-h-32 overflow-y-auto">
              {result.errors.map((error, idx) => (
                <li key={idx}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Skipped */}
        {result.skipped > 0 && (
          <div className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-amber-600" size={20} />
              <div>
                <p className="font-semibold text-amber-900">
                  {result.skipped} {result.skipped === 1 ? 'archivo' : 'archivos'} no procesados
                </p>
                <p className="text-sm text-amber-700">Se alcanzó el límite de 45 cartas</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end mt-8">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
          >
            Cancelar
          </button>
          {result.success > 0 && (
            <button
              onClick={onConfirm}
              className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Añadir ({result.success})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileValidationModal;
