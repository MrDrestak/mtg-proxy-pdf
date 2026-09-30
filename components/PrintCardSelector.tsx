import React, { useState } from 'react';
import { Hand, Folder, Loader } from 'lucide-react';

interface PrintCardSelectorProps {
  onSelectManual: () => Promise<void>;
  onSelectFolder: () => void;
  isLoading?: boolean;
}

const PrintCardSelector: React.FC<PrintCardSelectorProps> = ({
  onSelectManual,
  onSelectFolder,
  isLoading = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleManualClick = async () => {
    setIsProcessing(true);
    try {
      await onSelectManual();
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = isLoading || isProcessing;

  return (
    <div className="flex gap-3 flex-wrap">
      <button
        onClick={handleManualClick}
        disabled={isDisabled}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <Loader size={18} className="animate-spin" />
        ) : (
          <Hand size={18} />
        )}
        {isProcessing ? 'Procesando...' : 'Seleccionar Imágenes'}
      </button>
      <button
        onClick={onSelectFolder}
        disabled={isDisabled}
        className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Folder size={18} />
        Buscar en Carpeta
      </button>
    </div>
  );
};

export default PrintCardSelector;
