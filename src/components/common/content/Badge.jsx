import React from "react";
import { cn } from "../../../utils/cn";

const variantClasses = {
  primary: "bg-brand-50 text-brand-700 border border-brand-200/80 font-semibold",
  secondary: "bg-slate-100 text-slate-700 border border-slate-200",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold",
  danger: "bg-rose-50 text-rose-700 border border-rose-200 font-semibold",
  warning: "bg-amber-50 text-amber-800 border border-amber-200 font-semibold",
  info: "bg-sky-50 text-sky-700 border border-sky-200 font-semibold",
  navy: "bg-navy-900 text-white border border-navy-800 font-semibold",
  sky: "bg-sky-50 text-sky-700 border border-sky-200 font-semibold",
  outline: "bg-transparent text-navy-700 border border-slate-300",
};

const dotColorClasses = {
  primary: "bg-brand-600",
  secondary: "bg-slate-500",
  success: "bg-emerald-500",
  danger: "bg-rose-500",
  warning: "bg-amber-500",
  info: "bg-sky-500",
  navy: "bg-white",
  sky: "bg-sky-500",
  outline: "bg-slate-400",
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
