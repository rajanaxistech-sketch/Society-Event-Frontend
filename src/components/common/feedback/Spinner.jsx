import React from "react";
import { cn } from "../../../utils/cn";
import societyLogo from "../../../assets/society-logo.png";

const containerSizes = {
  xs: "w-8 h-8",
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  xl: "w-32 h-32",
};

const ringStrokeWidths = {
  xs: 6,
  sm: 5,
  md: 4.5,
  lg: 4,
  xl: 3.5,
};

const labelSizes = {
  xs: "text-[10px]",
  sm: "text-[11px]",
  md: "text-xs",
  lg: "text-[13px]",
  xl: "text-sm",
};

export function Spinner({
  size = "md",
  label,
  className = "",
  ...props
}) {
  return (
    <div
      role="status"
      aria-label={label || "Loading..."}
      className={cn("inline-flex flex-col items-center justify-center gap-3", className)}
      {...props}
    >
      {/* Circular Rotating Loader with Center Logo */}
      <div className={cn("relative flex items-center justify-center shrink-0", containerSizes[size] || containerSizes.md)}>
        {/* Soft Ambient Background Pulse Ring */}
        <div className="absolute inset-1 rounded-full bg-indigo-500/10 animate-ping opacity-25 pointer-events-none" />

        {/* Subtle Static Track Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 text-indigo-100"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            stroke="currentColor"
            strokeWidth={ringStrokeWidths[size] || 4}
            fill="transparent"
            r="44"
            cx="50"
            cy="50"
          />
        </svg>

        {/* Primary Circular Spinning Arc */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin text-indigo-600"
          viewBox="0 0 100 100"
          style={{ animationDuration: "1.2s" }}
          aria-hidden="true"
        >
          <circle
            stroke="currentColor"
            strokeWidth={ringStrokeWidths[size] || 4}
            strokeDasharray="276"
            strokeDashoffset="180"
            strokeLinecap="round"
            fill="transparent"
            r="44"
            cx="50"
            cy="50"
          />
        </svg>

        {/* Secondary Counter-rotating Subtle Accent Arc */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin text-purple-500/70"
          viewBox="0 0 100 100"
          style={{ animationDuration: "2.2s", animationDirection: "reverse" }}
          aria-hidden="true"
        >
          <circle
            stroke="currentColor"
            strokeWidth={(ringStrokeWidths[size] || 4) - 1}
            strokeDasharray="276"
            strokeDashoffset="230"
            strokeLinecap="round"
            fill="transparent"
            r="44"
            cx="50"
            cy="50"
          />
        </svg>

        {/* Centered Circular Society Event Management Logo */}
        <div className="relative z-10 w-[70%] h-[70%] rounded-full overflow-hidden bg-white shadow-xs p-1 flex items-center justify-center border border-slate-100">
          <img
            src={societyLogo}
            alt="Society Event Management"
            className="w-full h-full object-contain select-none pointer-events-none"
            loading="eager"
          />
        </div>
      </div>

      {label && (
        <span
          className={cn(
            "font-medium text-slate-600 text-center tracking-tight animate-pulse select-none",
            labelSizes[size] || labelSizes.md
          )}
        >
          {label}
        </span>
      )}
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
      <Spinner size="lg" label={message} />
    </div>
  );
}

export default Spinner;
