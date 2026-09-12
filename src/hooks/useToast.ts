import { useCallback, useMemo } from 'react';
import { useUIStore } from '../store/uiStore';

export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);
  const removeToast = useUIStore((state) => state.removeToast);

  const success = useCallback((message: string, title?: string) => addToast({ type: 'success', message, title }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ type: 'error', message, title }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ type: 'warning', message, title }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ type: 'info', message, title }), [addToast]);

  return useMemo(() => ({
    removeToast,
    success,
    error,
    warning,
    info,
  }), [removeToast, success, error, warning, info]);
};

export default useToast;
