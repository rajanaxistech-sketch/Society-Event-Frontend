import React from "react";
import { cn } from "../../../utils/cn";

const variantClasses = {
  primary: "text-blue-600 hover:text-blue-700",
  secondary: "text-gray-600 hover:text-gray-900",
  danger: "text-rose-600 hover:text-rose-700",
  muted: "text-gray-500 hover:text-gray-700",
  white: "text-white hover:text-gray-200",
};

const underlineClasses = {
  always: "underline underline-offset-4",
  hover: "hover:underline hover:underline-offset-4",
  none: "no-underline",
};

export const Link = React.forwardRef(function Link(
  {
    href = "#",
    external = false,
    variant = "primary",
    underline = "hover",
    leftIcon = null,
    rightIcon = null,
    children,
    className = "",
    target,
    rel,
    ...props
  },
  ref
) {
  const isExternal = external || href.startsWith("http://") || href.startsWith("https://");
  const computedRel = isExternal ? rel || "noopener noreferrer" : rel;
  const computedTarget = isExternal ? target || "_blank" : target;

  return (
    <a
      ref={ref}
      href={href}
      target={computedTarget}
      rel={computedRel}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium transition-colors duration-150 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm",
        variantClasses[variant] || variantClasses.primary,
        underlineClasses[underline] || underlineClasses.hover,
        className
      )}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
      {isExternal && !rightIcon && (
        <svg
          className="w-3.5 h-3.5 ml-0.5 opacity-70"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      )}
    </a>
  );
});

export default Link;
