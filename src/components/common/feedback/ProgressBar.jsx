import React from "react";
import { cn } from "../../../utils/cn";

const variantClasses = {
  primary: "bg-blue-600",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-rose-500",
  info: "bg-cyan-500",
};

const sizeClasses = {
  xs: "h-1",
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export function ProgressBar({
  value = 0,
  max = 100,
  variant = "primary",
  size = "md",
  showLabel = false,
  label,
  striped = false,
  animated = false,
  className = "",
  ...props
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn("w-full flex flex-col gap-1.5", className)} {...props}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center text-xs font-medium text-gray-700">
          <span>{label}</span>
          {showLabel && <span>{Math.round(percentage)}%</span>}
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          "w-full overflow-hidden rounded-full bg-gray-200",
          sizeClasses[size] || sizeClasses.md
        )}
      >
        <div
          style={{ width: `${percentage}%` }}
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            variantClasses[variant] || variantClasses.primary,
            striped && "bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:24px_24px]",
            animated && "animate-pulse"
          )}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
