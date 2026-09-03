import React, { useState } from "react";
import { cn } from "../../../utils/cn";

const variantConfig = {
  success: {
    wrapper: "bg-emerald-50 border-emerald-200 text-emerald-900",
    iconColor: "text-emerald-500",
    titleColor: "text-emerald-900",
    closeHover: "hover:bg-emerald-100 text-emerald-600",
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  error: {
    wrapper: "bg-rose-50 border-rose-200 text-rose-900",
    iconColor: "text-rose-500",
    titleColor: "text-rose-900",
    closeHover: "hover:bg-rose-100 text-rose-600",
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    wrapper: "bg-amber-50 border-amber-200 text-amber-900",
    iconColor: "text-amber-500",
    titleColor: "text-amber-900",
    closeHover: "hover:bg-amber-100 text-amber-700",
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  info: {
    wrapper: "bg-blue-50 border-blue-200 text-blue-900",
    iconColor: "text-blue-500",
    titleColor: "text-blue-900",
    closeHover: "hover:bg-blue-100 text-blue-600",
    defaultIcon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

export function Alert({
  variant = "info",
  title,
  description,
  children,
  closable = false,
  onClose,
  icon,
  action,
  className = "",
  ...props
}) {
  const [closed, setClosed] = useState(false);
  const cfg = variantConfig[variant] || variantConfig.info;

  if (closed) return null;

  const handleClose = (e) => {
    setClosed(true);
    onClose?.(e);
  };

  const renderedIcon = icon !== undefined ? icon : cfg.defaultIcon;

  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl border transition-all duration-150",
        cfg.wrapper,
        className
      )}
      {...props}
    >
      {renderedIcon && (
        <div className={cn("shrink-0 pt-0.5", cfg.iconColor)}>{renderedIcon}</div>
      )}

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className={cn("text-sm font-semibold leading-tight", cfg.titleColor)}>
            {title}
          </h4>
        )}
        {(description || children) && (
          <div className={cn("text-sm leading-relaxed", title && "mt-1 opacity-90")}>
            {description || children}
          </div>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>

      {closable && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={handleClose}
          className={cn(
            "p-1 -mr-1 -mt-1 rounded-lg transition-colors cursor-pointer shrink-0",
            cfg.closeHover
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default Alert;
