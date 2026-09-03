import React from "react";
import { cn } from "../../../utils/cn";

const colClasses = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
  9: "grid-cols-9",
  10: "grid-cols-10",
  11: "grid-cols-11",
  12: "grid-cols-12",
};

const smColClasses = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
  6: "sm:grid-cols-6",
};

const mdColClasses = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  6: "md:grid-cols-6",
};

const lgColClasses = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  6: "lg:grid-cols-6",
};

const gapClasses = {
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

export function Grid({
  as: Component = "div",
  cols = 1,
  gap = 4,
  children,
  className = "",
  ...props
}) {
  const getColClass = () => {
    if (typeof cols === "number" || typeof cols === "string") {
      return colClasses[cols] || `grid-cols-${cols}`;
    }

    if (typeof cols === "object" && cols !== null) {
      return cn(
        cols.default && colClasses[cols.default],
        cols.sm && smColClasses[cols.sm],
        cols.md && mdColClasses[cols.md],
        cols.lg && lgColClasses[cols.lg]
      );
    }

    return "grid-cols-1";
  };

  return (
    <Component
      className={cn(
        "grid",
        getColClass(),
        gapClasses[gap] || `gap-${gap}`,
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Grid;
