import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title?: string;
  message: string;
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success', title?: string) {
  if (toastListener) {
    toastListener({
      id: Math.random().toString(36).substring(2, 9),
      type,
      title,
      message,
    });
  }
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (newToast) => {
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    return () => {
      toastListener = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            toast.type === 'success'
              ? 'bg-zinc-950/95 border-emerald-800/60 text-zinc-100 shadow-emerald-950/30'
              : toast.type === 'error'
              ? 'bg-zinc-950/95 border-red-800/70 text-zinc-100 shadow-red-950/40'
              : 'bg-zinc-950/95 border-zinc-800 text-zinc-100'
          }`}
        >
          {toast.type === 'success' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 text-sm">
            {toast.title && <div className="font-semibold text-white mb-0.5">{toast.title}</div>}
            <div className="text-zinc-300 leading-relaxed">{toast.message}</div>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 p-1"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
