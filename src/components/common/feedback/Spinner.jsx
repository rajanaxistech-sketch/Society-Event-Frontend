import React from "react";
import { cn } from "../../../utils/cn";

const sizeClasses = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const colorClasses = {
  primary: "text-blue-600",
  white: "text-white",
  gray: "text-gray-500",
  success: "text-emerald-600",
  danger: "text-rose-600",
  warning: "text-amber-500",
};

export function Spinner({
  size = "md",
  color = "primary",
  label,
  className = "",
  ...props
}) {
  return (
    <div
      role="status"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      <svg
        className={cn(
          "animate-spin shrink-0",
          sizeClasses[size] || sizeClasses.md,
          colorClasses[color] || color
        )}
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
      {label && <span className="text-sm font-medium text-gray-600">{label}</span>}
      <span className="sr-only">{label || "Loading..."}</span>
    </div>
  );
}

/**
 * Full-container or overlay Loader primitive
 */
export function Loader({
  message = "Loading...",
  fullscreen = false,
  className = "",
  ...props
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 p-8",
        fullscreen
          ? "fixed inset-0 z-50 bg-white/80 backdrop-blur-sm"
          : "w-full h-full min-h-[160px]",
        className
      )}
      {...props}
    >
      <Spinner size="lg" color="primary" />
      {message && <p className="text-sm font-medium text-gray-600">{message}</p>}
    </div>
  );
}

export default Spinner;
