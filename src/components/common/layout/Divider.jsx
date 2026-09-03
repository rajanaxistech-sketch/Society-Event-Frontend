import React from "react";
import { cn } from "../../../utils/cn";

export function Divider({
  orientation = "horizontal",
  label,
  align = "center", // 'left' | 'center' | 'right'
  dashed = false,
  className = "",
  ...props
}) {
  const isHorizontal = orientation === "horizontal";

  if (!isHorizontal) {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn(
          "inline-block self-stretch w-px bg-gray-200 min-h-[1.5em] my-auto",
          dashed && "border-l border-dashed border-gray-200 bg-transparent",
          className
        )}
        {...props}
      />
    );
  }

  if (label) {
    return (
      <div
        role="separator"
        aria-orientation="horizontal"
        className={cn("flex items-center w-full my-4", className)}
        {...props}
      >
        <div
          className={cn(
            "flex-grow border-t border-gray-200",
            dashed && "border-dashed",
            align === "left" && "flex-grow-0 w-8"
          )}
        />
        <span className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider select-none">
          {label}
        </span>
        <div
          className={cn(
            "flex-grow border-t border-gray-200",
            dashed && "border-dashed",
            align === "right" && "flex-grow-0 w-8"
          )}
        />
      </div>
    );
  }

  return (
    <hr
      className={cn(
        "w-full border-0 border-t border-gray-200 my-4",
        dashed && "border-dashed",
        className
      )}
      {...props}
    />
  );
}

export default Divider;
