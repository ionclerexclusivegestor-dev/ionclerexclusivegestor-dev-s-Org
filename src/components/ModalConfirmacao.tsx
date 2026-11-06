import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ModalConfirmacaoProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  isDestructive?: boolean;
}

export const ModalConfirmacao: React.FC<ModalConfirmacaoProps> = ({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  isDestructive = true,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`border rounded-2xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Sutil detalhe vermelho no topo */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-rose-700" />

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isDestructive
                ? isDark
                  ? 'bg-red-950/60 text-red-500 border-red-900/50'
                  : 'bg-red-50 text-red-600 border-red-200'
                : isDark
                ? 'bg-zinc-900 text-zinc-300 border-zinc-800'
                : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{titulo}</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
          {mensagem}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
              isDark
                ? 'border-zinc-800 bg-zinc-900/80 hover:bg-zinc-850 text-zinc-300'
                : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all shadow-md cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 shadow-red-900/40 border border-red-500'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            }`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
};
