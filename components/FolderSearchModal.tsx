import React, { useState } from 'react';
import { Folder, Loader, AlertCircle } from 'lucide-react';

interface FolderSearchModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSearch: (cardNames: string[], folderPath: string) => Promise<void>;
  isSearching?: boolean;
}

const FolderSearchModal: React.FC<FolderSearchModalProps> = ({
  isVisible,
  onClose,
  onSearch,
  isSearching = false
}) => {
  const [step, setStep] = useState<'folder' | 'names' | 'searching'>('folder');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [cardNames, setCardNames] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [searchProgress, setSearchProgress] = useState<number>(0);
  const [searchStatus, setSearchStatus] = useState<string>('');

  if (!isVisible) return null;

  const handleSelectFolder = async () => {
    try {
      // Use the File System Access API to pick a folder
      const dirHandle = await (window as any).showDirectoryPicker?.();

      if (dirHandle) {
        // Get the folder name for display
        const folderName = dirHandle.name;
        setSelectedFolder(folderName);
        setError('');
        // Store the handle for later use in the search
        (window as any).__selectedDirHandle = dirHandle;
      }
    } catch (err) {
      if ((err as any).name === 'AbortError') {
        // User cancelled the picker
        setError('');
      } else {
        setError('No se pudo acceder al selector de carpetas. Asegúrate de que estés usando un navegador compatible.');
      }
    }
  };

  const handleNextStep = () => {
    if (!selectedFolder.trim()) {
      setError('Por favor selecciona una carpeta');
      return;
    }
    setError('');
    setStep('names');
  };

  const handleSearch = async () => {
    const names = cardNames
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (names.length === 0) {
      setError('Ingresa al menos un nombre de carta');
      return;
    }

    try {
      // Move to searching step and show progress
      setStep('searching');
      setSearchProgress(0);
      setSearchStatus('Iniciando búsqueda...');

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setSearchProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 30;
        });
      }, 500);

      await onSearch(names, selectedFolder);

      clearInterval(progressInterval);
      setSearchProgress(100);
      setSearchStatus('¡Búsqueda completada!');

      // Close modal after search completes
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (err) {
      setError(`Error en búsqueda: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setStep('names');
    }
  };

  const handleClose = () => {
    setStep('folder');
    setSelectedFolder('');
    setCardNames('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Búsqueda en Carpeta</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-6">
          <div
            className={`flex-1 h-2 rounded-full transition-colors ${
              step === 'folder' || step === 'names' ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
          <div
            className={`flex-1 h-2 rounded-full transition-colors ${
              step === 'names' ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {step === 'folder' ? (
            // Step 1: Folder Selection
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Paso 1: Selecciona una carpeta</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Se buscará recursivamente en esta carpeta y sus subcarpetas por archivos de imagen que coincidan con los nombres de cartas.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Folder size={40} className="mx-auto text-gray-400 mb-3" />
                <button
                  onClick={handleSelectFolder}
                  className="text-blue-600 hover:text-blue-700 font-semibold underline"
                >
                  Haz clic para seleccionar carpeta
                </button>
                <p className="text-xs text-gray-500 mt-2">O arrastra una carpeta aquí</p>
              </div>

              {selectedFolder && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm font-semibold text-green-900">Carpeta seleccionada:</p>
                  <p className="text-xs text-green-700 mt-1 break-all font-mono">{selectedFolder}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-900">
                  💡 <strong>Tip:</strong> Organiza tus imágenes de cartas con nombres exactos (ej: "Bolt.jpg", "Counterspell.png") para búsquedas rápidas.
                </p>
              </div>
            </div>
          ) : step === 'searching' ? (
            // Step 3: Progress
            <div className="space-y-6 flex flex-col items-center justify-center h-full">
              <div className="text-center">
                <Loader size={48} className="text-blue-600 animate-spin mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Buscando cartas...</h3>
                <p className="text-sm text-gray-600">{searchStatus}</p>
              </div>

              <div className="w-full max-w-sm">
                <div className="mb-2 flex justify-between items-center">
                  <p className="text-xs text-gray-600">Progreso de búsqueda</p>
                  <p className="text-xs font-semibold text-blue-600">{Math.round(searchProgress)}%</p>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300 rounded-full"
                    style={{ width: `${Math.min(searchProgress, 100)}%` }}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Por favor espera mientras se buscan las imágenes en la carpeta...
              </p>
            </div>
          ) : (
            // Step 2: Card Names Input
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Paso 2: Ingresa nombres de cartas</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Un nombre de carta por línea. Se buscarán en la carpeta: <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{selectedFolder}</span>
                </p>
              </div>

              <textarea
                value={cardNames}
                onChange={(e) => setCardNames(e.target.value)}
                placeholder="Bolt
Counterspell
Lightning Strike
Snapcaster Mage
..."
                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-400"
              />

              <div className="text-xs text-gray-500">
                {cardNames.split('\n').filter(line => line.trim().length > 0).length} nombre(s) ingresado(s)
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        {step !== 'searching' && (
          <div className="flex gap-3 justify-end mt-6">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
            >
              Cancelar
            </button>

            {step === 'folder' ? (
              <button
                onClick={handleNextStep}
                disabled={!selectedFolder.trim()}
                className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                Siguiente
              </button>
            ) : (
              <>
                <button
                  onClick={() => setStep('folder')}
                  className="px-6 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
                >
                  Atrás
                </button>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-2 text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader size={18} className="animate-spin" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Folder size={18} />
                      Buscar Cartas
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FolderSearchModal;
