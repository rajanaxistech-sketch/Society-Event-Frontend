import React from "react";
import { cn } from "../../../utils/cn";

const gapMap = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
  10: "gap-10",
  12: "gap-12",
};

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  baseline: "items-baseline",
  stretch: "items-stretch",
};

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

export function Stack({
  as: Component = "div",
  direction = "vertical", // 'vertical' | 'horizontal' | 'row' | 'column'
  gap = 4,
  align = "stretch",
  justify = "start",
  wrap = false,
  divider,
  children,
  className = "",
  ...props
}) {
  const isHorizontal = direction === "horizontal" || direction === "row";

  // If divider is provided, inject it between valid React children
  const renderChildren = () => {
    if (!divider) return children;

    const validChildren = React.Children.toArray(children).filter(Boolean);
    return validChildren.map((child, index) => (
      <React.Fragment key={index}>
        {child}
        {index < validChildren.length - 1 && divider}
      </React.Fragment>
    ));
  };

  return (
    <Component
      className={cn(
        "flex",
        isHorizontal ? "flex-row" : "flex-col",
        gapMap[gap] || `gap-${gap}`,
        alignMap[align] || alignMap.stretch,
        justifyMap[justify] || justifyMap.start,
        wrap && "flex-wrap",
        className
      )}
      {...props}
    >
      {renderChildren()}
    </Component>
  );
}

export default Stack;
