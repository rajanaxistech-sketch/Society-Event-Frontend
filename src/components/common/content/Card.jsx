import React from "react";
import { cn } from "../../../utils/cn";

const paddingClasses = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const shadowClasses = {
  none: "shadow-none",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
};

export function Card({
  title,
  subtitle,
  headerAction,
  footer,
  hoverable = false,
  bordered = true,
  shadow = "sm",
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
        "rounded-2xl bg-white text-gray-900 overflow-hidden transition-all duration-200",
        bordered && "border border-gray-200",
        shadowClasses[shadow] || shadowClasses.sm,
        hoverable && "hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300 cursor-pointer",
        className
      )}
      {...props}
    >
      {hasHeader && (
        <div
          className={cn(
            "flex items-start justify-between border-b border-gray-100",
            paddingClasses[padding] || paddingClasses.md,
            headerClassName
          )}
        >
          <div className="flex flex-col gap-0.5">
            {title && (
              <h3 className="text-base font-semibold text-gray-900 leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 leading-normal">{subtitle}</p>
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
            "border-t border-gray-100 bg-gray-50/50 flex items-center justify-between",
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
