import React from "react";
import { cn } from "../../../utils/cn";

const paddingClasses = {
  none: "p-0",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

const shadowClasses = {
  none: "shadow-none",
  sm: "shadow-soft",
  md: "shadow-card",
  lg: "shadow-card-hover",
};

export function Card({
  title,
  subtitle,
  headerAction,
  footer,
  hoverable = false,
  bordered = true,
  shadow = "md",
  padding = "md",
  children,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  ...props
}) {
  const hasHeader = title || subtitle || headerAction;

  return (
    <div
      className={cn(
        "rounded-card bg-white text-navy-900 overflow-hidden transition-all duration-200",
        bordered && "border border-slate-200/80",
        shadowClasses[shadow] || shadowClasses.md,
        hoverable && "hover:shadow-card-hover hover:-translate-y-0.5 hover:border-brand-200 cursor-pointer",
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex items-start justify-between border-b border-slate-100",
            paddingClasses[padding] || paddingClasses.md,
            headerClassName
          )}
        >
          <div className="flex flex-col gap-0.5">
            {title && (
              <h3 className="text-base font-bold text-navy-900 leading-tight tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-navy-500 leading-normal mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="flex items-center gap-2 shrink-0">{headerAction}</div>
          )}
        </div>
      )}

      {children && (
        <div
          className={cn(
            paddingClasses[padding] || paddingClasses.md,
            bodyClassName
          )}
        >
          {children}
        </div>
      )}

      {footer && (
        <div
          className={cn(
            "border-t border-slate-100 bg-slate-50/60 flex items-center justify-between",
            paddingClasses[padding] || paddingClasses.md,
            footerClassName
          )}
        >
          {footer}
        </div>
      )}
    </div>
  );
}

export default Card;

