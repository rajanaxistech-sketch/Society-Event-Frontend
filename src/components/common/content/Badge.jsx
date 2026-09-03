import React from "react";
import { cn } from "../../../utils/cn";

const variantClasses = {
  primary: "bg-blue-50 text-blue-700 border border-blue-200",
  secondary: "bg-gray-100 text-gray-700 border border-gray-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  danger: "bg-rose-50 text-rose-700 border border-rose-200",
  warning: "bg-amber-50 text-amber-800 border border-amber-200",
  info: "bg-cyan-50 text-cyan-700 border border-cyan-200",
  outline: "bg-transparent text-gray-700 border border-gray-300",
};

const dotColorClasses = {
  primary: "bg-blue-600",
  secondary: "bg-gray-500",
  success: "bg-emerald-600",
  danger: "bg-rose-600",
  warning: "bg-amber-600",
  info: "bg-cyan-600",
  outline: "bg-gray-400",
};

const sizeClasses = {
  sm: "text-[10px] px-2 py-0.5 gap-1",
  md: "text-xs px-2.5 py-1 gap-1.5 font-medium",
  lg: "text-sm px-3 py-1.5 gap-2 font-medium",
};

export function Badge({
  variant = "primary",
  size = "md",
  dot = false,
  rounded = true,
  children,
  className = "",
  ...props
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center select-none font-medium leading-none whitespace-nowrap",
        rounded ? "rounded-full" : "rounded-md",
        variantClasses[variant] || variantClasses.primary,
        sizeClasses[size] || sizeClasses.md,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full shrink-0",
            dotColorClasses[variant] || dotColorClasses.primary
          )}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </span>
  );
}

export default Badge;
