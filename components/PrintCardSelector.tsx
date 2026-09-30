import React from 'react';
import { Hand, Folder } from 'lucide-react';

interface PrintCardSelectorProps {
  onSelectManual: () => void;
  onSelectFolder: () => void;
  isLoading?: boolean;
}

const PrintCardSelector: React.FC<PrintCardSelectorProps> = ({
  onSelectManual,
  onSelectFolder,
  isLoading = false
}) => {
  return (
    <div className="flex gap-3">
      <button
        onClick={onSelectManual}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Hand size={18} />
        Seleccionar Imágenes
      </button>
      <button
        onClick={onSelectFolder}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Folder size={18} />
        Buscar en Carpeta
      </button>
    </div>
  );
};

export default PrintCardSelector;
