import React from "react";
import { cn } from "../../../utils/cn";

const maxWidthClasses = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
};

export function Container({
  as: Component = "div",
  maxWidth = "7xl",
  centered = true,
  gutter = true,
  children,
  className = "",
  ...props
}) {
  return (
    <Component
      className={cn(
        "w-full",
        maxWidthClasses[maxWidth] || maxWidthClasses["7xl"],
        centered && "mx-auto",
        gutter && "px-4 sm:px-6 lg:px-8",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Container;
