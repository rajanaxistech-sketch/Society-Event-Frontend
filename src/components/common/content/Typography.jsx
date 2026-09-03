import React from "react";
import { cn } from "../../../utils/cn";

const variantElementMap = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  title: "h2",
  subtitle: "p",
  body: "p",
  bodySmall: "p",
  caption: "span",
  label: "span",
  muted: "span",
  code: "code",
};

const variantStyleMap = {
  h1: "text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900",
  h2: "text-2xl sm:text-3xl font-bold tracking-tight text-gray-900",
  h3: "text-xl sm:text-2xl font-bold text-gray-900",
  h4: "text-lg sm:text-xl font-semibold text-gray-900",
  h5: "text-base sm:text-lg font-semibold text-gray-900",
  h6: "text-sm sm:text-base font-semibold text-gray-900",
  title: "text-xl font-semibold text-gray-900",
  subtitle: "text-base text-gray-500 font-normal",
  body: "text-base text-gray-700 leading-relaxed",
  bodySmall: "text-sm text-gray-600 leading-normal",
  caption: "text-xs text-gray-400 font-normal",
  label: "text-sm font-medium text-gray-700 select-none",
  muted: "text-sm text-gray-400 font-normal",
  code: "text-xs font-mono bg-gray-100 text-pink-600 px-1.5 py-0.5 rounded border border-gray-200",
};

const weightMap = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

const alignMap = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
  justify: "text-justify",
};

export function Typography({
  variant = "body",
  as,
  weight,
  align,
  color,
  truncate = false,
  children,
  className = "",
  ...props
}) {
  const Component = as || variantElementMap[variant] || "p";

  return (
    <Component
      className={cn(
        variantStyleMap[variant] || variantStyleMap.body,
        weight && weightMap[weight],
        align && alignMap[align],
        color,
        truncate && "truncate",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Typography;
