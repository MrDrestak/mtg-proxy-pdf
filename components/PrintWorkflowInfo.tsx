import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

interface PrintWorkflowInfoProps {
  isVisible: boolean;
  onClose: () => void;
}

const PrintWorkflowInfo: React.FC<PrintWorkflowInfoProps> = ({
  isVisible,
  onClose
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Flujo de Impresión</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 text-gray-700">
          <section>
            <h3 className="text-lg font-bold text-gray-900 mb-2">📋 Modo 1: Seleccionar Imágenes</h3>
            <p className="mb-3">Elige archivos de imagen desde tu computadora:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Haz clic en <strong>"Seleccionar Imágenes"</strong></li>
              <li>Se abrirá un diálogo para seleccionar múltiples archivos (JPG, PNG, GIF, WebP)</li>
              <li>Máximo 10MB por imagen, máximo 45 cartas total</li>
              <li>Las imágenes se procesan automáticamente (relleno de esquinas negras, escalada a calidad máxima)</li>
              <li>Revisa los resultados y haz clic <strong>"Añadir"</strong> para incluirlas</li>
            </ol>
          </section>

          <section className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">🔍 Modo 2: Buscar en Carpeta</h3>
            <p className="mb-3">Busca automáticamente cartas en una carpeta por nombre:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Haz clic en <strong>"Buscar en Carpeta"</strong></li>
              <li>Selecciona una carpeta (se buscará recursivamente en subcarpetas)</li>
              <li>Ingresa nombres de cartas, uno por línea (ej: "Bolt", "Counterspell")</li>
              <li>El sistema busca archivos coincidentes sin importar mayúsculas/minúsculas</li>
              <li>Si encuentra duplicados (2+ archivos con el mismo nombre), muestra advertencia</li>
              <li>Revisa el resumen y haz clic <strong>"Aceptar"</strong></li>
            </ol>
          </section>

          <section className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">🎴 Gestor de Cartas</h3>
            <p className="mb-3">Una vez añadidas cartas, úsalo para reordenar y gestionar:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Vista Lista:</strong> Arrastra cartas para reordenar, duplica con copiar, elimina con ❌</li>
              <li><strong>Vista Grid:</strong> Ve 9 cartas en grid de 3x3, navega con ◀▶</li>
              <li>Cada carta muestra posición actual (ej: "Pos: 1 / 45")</li>
              <li>Máximo 45 cartas (5 hojas × 9 cartas)</li>
            </ul>
          </section>

          <section className="border-t pt-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">📄 Vista Previa de Hojas</h3>
            <p className="mb-3">Visualiza cómo se imprimirán tus cartas:</p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Muestra grid 3x3 de la hoja actual</li>
              <li>Navega entre hojas con ◀ Anterior y Siguiente ▶</li>
              <li>Haz clic en una carta para ver su nombre</li>
              <li>Usa <strong>"Editar Orden"</strong> para volver al Gestor</li>
              <li>Usa <strong>"Exportar PDF"</strong> para generar el archivo de impresión</li>
            </ul>
          </section>

          <section className="border-t pt-4 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-blue-900 mb-2">💡 Tips</h3>
            <ul className="list-disc list-inside space-y-2 text-sm text-blue-800">
              <li>Los conflictos (2+ archivos con mismo nombre) se reportan pero NO se procesan</li>
              <li>Resuelve conflictos renombrando archivos en tu carpeta</li>
              <li>Las cartas no encontradas aparecen en el resumen para referencia</li>
              <li>El PDF se genera con márgenes de corte en rojo y líneas de separación grises</li>
              <li>Máxima resolución: 1200px para calidad de impresión profesional</li>
              <li>Sube imágenes de alta calidad (10MB máximo) para resultados óptimos en pintura</li>
            </ul>
          </section>

          <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg text-xs text-gray-600">
            <p>
              <strong>Versión:</strong> 1.1 • <strong>Límites:</strong> 45 cartas, 10MB/imagen, JPG/PNG/GIF/WebP • <strong>Resolución:</strong> Máxima calidad para impresión
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintWorkflowInfo;
