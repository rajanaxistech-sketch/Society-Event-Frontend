import React from 'react';
import { useUIStore } from '../../store/uiStore';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts);
  const removeToast = useUIStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  const typeConfig = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />,
      border: 'border-emerald-200 bg-white shadow-emerald-50',
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />,
      border: 'border-rose-200 bg-white shadow-rose-50',
    },
    warning: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />,
      border: 'border-amber-200 bg-white shadow-amber-50',
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-600 shrink-0" />,
      border: 'border-blue-200 bg-white shadow-blue-50',
    },
  };

  return (
    <div className="fixed top-4 inset-x-3 sm:inset-x-auto sm:right-5 sm:w-80 sm:max-w-sm z-50 flex flex-col gap-2.5 pointer-events-none">
      {toasts.map((toast) => {
        const config = typeConfig[toast.type];
        return (
          <div
            key={toast.id}
            className={clsx(
              'pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg transition-all animate-in slide-in-from-top-4 duration-200',
              config.border
            )}
          >
            {config.icon}
            <div className="flex-1 text-xs">
              {toast.title && <h5 className="font-semibold text-slate-900 mb-0.5">{toast.title}</h5>}
              <p className="text-slate-600 leading-relaxed">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
