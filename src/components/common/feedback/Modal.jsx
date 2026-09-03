import React, { useEffect, useId, useCallback } from "react";
import { cn } from "../../../utils/cn";

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[95vw] min-h-[90vh]",
};

export function Modal({
  open = false,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = "",
  contentClassName = "",
  ...props
}) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descId = `${generatedId}-desc`;

  const handleKeyDown = useCallback(
    (e) => {
      if (closeOnEsc && e.key === "Escape" && open) {
        onClose?.();
      }
    },
    [closeOnEsc, open, onClose]
  );

  // Prevent background body scrolling when modal is open and handle ESC key
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      {...props}
    >
      {/* Backdrop overlay */}
      <div
        aria-hidden="true"
        onClick={closeOnOverlayClick ? onClose : undefined}
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Dialog container */}
      <div
        className={cn(
          "relative w-full bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100",
          "transform transition-all duration-200 z-10 my-8 flex flex-col",
          sizeClasses[size] || sizeClasses.md,
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between p-5 sm:p-6 border-b border-gray-100">
            <div>
              {title && (
                <h3 id={titleId} className="text-lg font-bold text-gray-900 leading-snug">
                  {title}
                </h3>
              )}
              {description && (
                <p id={descId} className="mt-1 text-sm text-gray-500">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                aria-label="Close dialog"
                onClick={onClose}
                className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Modal body */}
        <div className={cn("p-5 sm:p-6 flex-1 overflow-y-auto", contentClassName)}>
          {children}
        </div>

        {/* Modal footer */}
        {footer && (
          <div className="p-4 sm:p-5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export const Dialog = Modal;

export default Modal;
