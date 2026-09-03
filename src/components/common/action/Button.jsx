import React from "react";
import { cn } from "../../../utils/cn";

const variantClasses = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-soft hover:shadow-md focus-visible:ring-brand-500 font-semibold",
  secondary: "bg-slate-100 text-navy-800 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 focus-visible:ring-slate-400 font-medium",
  sky: "bg-sky-500 text-white hover:bg-sky-600 active:bg-sky-700 shadow-soft focus-visible:ring-sky-400 font-semibold",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-soft focus-visible:ring-emerald-500 font-semibold",
  danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-soft focus-visible:ring-rose-500 font-semibold",
  warning: "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-soft focus-visible:ring-amber-400 font-semibold",
  navy: "bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 shadow-soft focus-visible:ring-navy-600 font-semibold",
  ghost: "bg-transparent text-navy-700 hover:bg-brand-50 hover:text-brand-700 active:bg-brand-100 focus-visible:ring-brand-400 font-medium",
  outline: "bg-white text-brand-700 border border-brand-300 hover:bg-brand-50 hover:border-brand-400 active:bg-brand-100 focus-visible:ring-brand-500 font-semibold",
  link: "bg-transparent text-brand-600 hover:text-brand-800 hover:underline p-0 h-auto focus-visible:ring-brand-500 font-medium",
};

const sizeClasses = {
  xs: "text-xs px-2.5 py-1 rounded-card-sm gap-1.5",
  sm: "text-xs px-3 py-1.5 rounded-card-sm gap-1.5 font-medium",
  md: "text-sm px-4 py-2 rounded-card-sm gap-2 font-medium",
  lg: "text-base px-5 py-2.5 rounded-card gap-2.5 font-semibold",
  xl: "text-lg px-6 py-3.5 rounded-card-lg gap-3 font-bold",
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
