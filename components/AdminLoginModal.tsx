import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (password: string) => boolean;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Simulate brief delay for UX feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    if (onLogin(password)) {
      setPassword('');
      setIsSubmitting(false);
    } else {
      setError('Contraseña incorrecta');
      setPassword('');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm transition-opacity" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-b from-slate-900 to-black border border-blue-500/30 rounded-xl shadow-2xl max-w-md w-full p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 rounded-lg">
              <Lock size={24} className="text-white" />
            </div>
          </div>

          <h2 className="text-xl font-black text-white text-center mb-2">
            Acceso de Administrador
          </h2>
          <p className="text-slate-400 text-sm text-center mb-6">
            Ingresa la contraseña para acceder a las herramientas de administración
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/30 transition-all"
                disabled={isSubmitting}
                autoFocus
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || password.length === 0}
              className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-700 disabled:to-slate-800 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Lock size={16} />
              {isSubmitting ? 'Verificando...' : 'Ingresar'}
            </button>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={handleClose}
              className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-all"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
          </form>

          {/* Footer */}
          <p className="text-xs text-slate-500 text-center mt-6">
            Solo administradores autorizados
          </p>
        </div>
      </div>
    </>
  );
};

export default AdminLoginModal;
