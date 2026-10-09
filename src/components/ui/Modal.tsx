import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  isLoading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm sm:max-w-md',
    md: 'max-w-md sm:max-w-lg',
    lg: 'max-w-lg sm:max-w-xl md:max-w-2xl',
    xl: 'max-w-xl sm:max-w-2xl md:max-w-3xl',
    '2xl': 'max-w-2xl sm:max-w-3xl md:max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Box */}
      <div
        className={clsx(
          'relative w-full bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-[90vh]',
          sizeClasses[size]
        )}
      >
        {/* Top Loading Progress Line */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden z-20">
            <div className="h-full bg-indigo-600 animate-pulse w-full" />
          </div>
        )}

        {/* Header */}
        {(title || description) && (
          <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-slate-50/80 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
            <div className="min-w-0 flex-1">
              {typeof title === 'string' ? (
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">{title}</h3>
              ) : (
                title
              )}
              {description && (
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed p-1 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="px-3 py-3 sm:px-5 sm:py-4 overflow-y-auto flex-1 overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-3 py-2.5 sm:px-5 sm:py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;


