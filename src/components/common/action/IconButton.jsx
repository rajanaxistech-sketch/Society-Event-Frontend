import React from "react";
import { cn } from "../../../utils/cn";

const variantClasses = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm focus-visible:ring-blue-500",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 border border-gray-300 focus-visible:ring-gray-400",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm focus-visible:ring-emerald-500",
  danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-500",
  warning: "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm focus-visible:ring-amber-400",
  info: "bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800 shadow-sm focus-visible:ring-cyan-500",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 focus-visible:ring-gray-400",
  outline: "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400",
};

const sizeClasses = {
  xs: "w-7 h-7 text-xs rounded-md",
  sm: "w-8 h-8 text-sm rounded-md",
  md: "w-10 h-10 text-base rounded-lg",
  lg: "w-12 h-12 text-lg rounded-xl",
  xl: "w-14 h-14 text-xl rounded-xl",
};

export const IconButton = React.forwardRef(function IconButton(
  {
    icon,
    "aria-label": ariaLabel,
    title,
    variant = "ghost",
    size = "md",
    disabled = false,
    loading = false,
    className = "",
    onClick,
    ...props
  },
  ref
) {
  const label = ariaLabel || title || "icon button";
  const isInteractive = !disabled && !loading;

  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={title || ariaLabel}
      disabled={!isInteractive}
      aria-disabled={!isInteractive}
      aria-busy={loading}
      onClick={isInteractive ? onClick : undefined}
      className={cn(
        "inline-flex items-center justify-center transition-colors duration-150 shrink-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variantClasses[variant] || variantClasses.ghost,
        sizeClasses[size] || sizeClasses.md,
        !isInteractive && "opacity-50 cursor-not-allowed pointer-events-none shadow-none",
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        icon
      )}
    </button>
  );
});

export default IconButton;
