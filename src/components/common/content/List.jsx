import React from "react";
import { cn } from "../../../utils/cn";

const spacingClasses = {
  sm: "gap-1",
  md: "gap-2.5",
  lg: "gap-4",
};

export function List({
  items,
  renderItem,
  ordered = false,
  variant = "simple", // 'simple' | 'divided' | 'bordered'
  spacing = "md",
  children,
  className = "",
  ...props
}) {
  const Component = ordered ? "ol" : "ul";

  const renderContent = () => {
    if (children) return children;
    if (!items || items.length === 0) return null;

    return items.map((item, index) => {
      const rendered = renderItem ? renderItem(item, index) : item;
      return (
        <li
          key={index}
          className={cn(
            "text-sm text-gray-700",
            variant === "divided" && "py-2.5 border-b border-gray-100 last:border-b-0",
            variant === "bordered" && "p-3 rounded-lg border border-gray-200 bg-white"
          )}
        >
          {rendered}
        </li>
      );
    });
  };

  return (
    <Component
      className={cn(
        "flex flex-col m-0 p-0",
        ordered ? "list-decimal pl-5" : "list-none",
        variant === "simple" && spacingClasses[spacing],
        variant === "bordered" && spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {renderContent()}
    </Component>
  );
}

export default List;
