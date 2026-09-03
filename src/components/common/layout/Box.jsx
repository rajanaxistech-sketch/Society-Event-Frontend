import React from "react";
import { cn } from "../../../utils/cn";

export function Box({
  as: Component = "div",
  children,
  className = "",
  ...props
}) {
  return (
    <Component className={cn("box-border", className)} {...props}>
      {children}
    </Component>
  );
}

export default Box;
