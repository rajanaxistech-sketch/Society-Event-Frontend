import React from "react";
import { cn } from "../../../utils/cn";

const variantClasses = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm focus-visible:ring-blue-500",
  secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 border border-gray-300 focus-visible:ring-gray-400",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm focus-visible:ring-emerald-500",
  danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-rose-500",
  warning: "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm focus-visible:ring-amber-400",
  info: "bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800 shadow-sm focus-visible:ring-cyan-500",
  ghost: "bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus-visible:ring-gray-400",
  outline: "bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50 active:bg-blue-100 focus-visible:ring-blue-500",
  link: "bg-transparent text-blue-600 hover:underline p-0 h-auto focus-visible:ring-blue-500",
};

const sizeClasses = {
  xs: "text-xs px-2.5 py-1 rounded-md gap-1.5",
  sm: "text-sm px-3 py-1.5 rounded-md gap-1.5",
  md: "text-sm px-4 py-2 rounded-lg gap-2 font-medium",
  lg: "text-base px-5 py-2.5 rounded-lg gap-2.5 font-medium",
  xl: "text-lg px-6 py-3.5 rounded-xl gap-3 font-semibold",
};

export const Button = React.forwardRef(function Button(
  {
    children,
    type = "button",
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    fullWidth = false,
    leftIcon = null,
    rightIcon = null,
    className = "",
    onClick,
    ...props
  },
  ref
) {
  const isInteractive = !disabled && !loading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={!isInteractive}
      aria-disabled={!isInteractive}
      aria-busy={loading}
      onClick={isInteractive ? onClick : undefined}
      className={cn(
        "inline-flex items-center justify-center transition-all duration-150 select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        fullWidth && "w-full",
        !isInteractive && "opacity-60 cursor-not-allowed pointer-events-none shadow-none",
        className
      )}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 h-4 w-4 text-current"
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
        leftIcon && <span className="inline-flex shrink-0 items-center">{leftIcon}</span>
      )}

      {children && <span>{children}</span>}

      {!loading && rightIcon && (
        <span className="inline-flex shrink-0 items-center">{rightIcon}</span>
      )}
    </button>
  );
});

export default Button;
