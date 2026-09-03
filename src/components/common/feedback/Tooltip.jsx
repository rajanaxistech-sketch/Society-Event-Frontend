import React, { useState, useRef } from "react";
import { cn } from "../../../utils/cn";

const positionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const arrowClasses = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-gray-900 border-x-transparent border-b-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 border-x-transparent border-t-transparent",
  left: "left-full top-1/2 -translate-y-1/2 border-l-gray-900 border-y-transparent border-r-transparent",
  right: "right-full top-1/2 -translate-y-1/2 border-r-gray-900 border-y-transparent border-l-transparent",
};

export function Tooltip({
  content,
  position = "top",
  delay = 100,
  children,
  className = "",
  ...props
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  if (!content) return children;

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setVisible(false);
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      {...props}
    >
      {children}

      {visible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 pointer-events-none whitespace-nowrap px-2.5 py-1.5 text-xs font-medium",
            "text-white bg-gray-900 rounded-lg shadow-lg animate-in fade-in zoom-in-95 duration-150",
            positionClasses[position] || positionClasses.top,
            className
          )}
        >
          {content}
          <div
            className={cn(
              "absolute border-4 w-0 h-0",
              arrowClasses[position] || arrowClasses.top
            )}
          />
        </div>
      )}
    </div>
  );
}

export default Tooltip;
