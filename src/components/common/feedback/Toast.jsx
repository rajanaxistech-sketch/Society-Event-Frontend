import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { cn } from "../../../utils/cn";

const ToastContext = createContext(null);

let toastIdCounter = 0;

const variantClasses = {
  success: {
    container: "bg-emerald-900/90 text-white border-emerald-700/50",
    icon: (
      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  error: {
    container: "bg-rose-900/90 text-white border-rose-700/50",
    icon: (
      <svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    container: "bg-amber-950/90 text-white border-amber-700/50",
    icon: (
      <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    container: "bg-gray-900/95 text-white border-gray-700/50",
    icon: (
      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function ToastProvider({ children, position = "top-right" }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (options) => {
      const id = ++toastIdCounter;
      const toastItem = {
        id,
        duration: 4000,
        variant: "info",
        ...options,
      };

      setToasts((prev) => [...prev, toastItem]);

      if (toastItem.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, toastItem.duration);
      }

      return id;
    },
    [removeToast]
  );

  const toastMethods = useMemo(
    () => ({
      show: (msg, opts) => addToast(typeof msg === "string" ? { message: msg, ...opts } : msg),
      success: (msg, opts) =>
        addToast({ message: msg, variant: "success", title: "Success", ...opts }),
      error: (msg, opts) =>
        addToast({ message: msg, variant: "error", title: "Error", ...opts }),
      warning: (msg, opts) =>
        addToast({ message: msg, variant: "warning", title: "Warning", ...opts }),
      info: (msg, opts) =>
        addToast({ message: msg, variant: "info", title: "Notice", ...opts }),
      dismiss: removeToast,
    }),
    [addToast, removeToast]
  );

  const positionClasses = {
    "top-right": "top-4 right-4 items-end",
    "top-left": "top-4 left-4 items-start",
    "bottom-right": "bottom-4 right-4 items-end",
    "bottom-left": "bottom-4 left-4 items-start",
    "top-center": "top-4 left-1/2 -translate-x-1/2 items-center",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
  };

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}

      {/* Floating toast notification portal */}
      <div
        aria-live="polite"
        className={cn(
          "fixed z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-4",
          positionClasses[position] || positionClasses["top-right"]
        )}
      >
        {toasts.map((item) => {
          const cfg = variantClasses[item.variant] || variantClasses.info;

          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                "pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl backdrop-blur-md border",
                "transition-all duration-300 transform translate-y-0 w-full animate-in fade-in slide-in-from-top-2",
                cfg.container
              )}
            >
              <div className="shrink-0 pt-0.5">{item.icon || cfg.icon}</div>

              <div className="flex-1 min-w-0">
                {item.title && (
                  <h5 className="text-sm font-semibold leading-tight mb-0.5">{item.title}</h5>
                )}
                <p className="text-xs opacity-90 leading-normal">{item.message}</p>
              </div>

              <button
                type="button"
                aria-label="Dismiss toast"
                onClick={() => removeToast(item.id)}
                className="p-1 -mr-1 -mt-1 text-white/60 hover:text-white rounded-md transition hover:bg-white/10 shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return safe fallback in case components are rendered without provider
    return {
      show: (msg) => console.log("[Toast]", msg),
      success: (msg) => console.log("[Toast Success]", msg),
      error: (msg) => console.error("[Toast Error]", msg),
      warning: (msg) => console.warn("[Toast Warning]", msg),
      info: (msg) => console.info("[Toast Info]", msg),
      dismiss: () => {},
    };
  }
  return context;
}

export default ToastProvider;
