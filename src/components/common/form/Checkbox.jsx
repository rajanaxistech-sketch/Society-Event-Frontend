import React, { useId, useEffect, useRef } from "react";
import { cn } from "../../../utils/cn";

const sizeClasses = {
  sm: "w-3.5 h-3.5 text-xs rounded",
  md: "w-4 h-4 text-sm rounded",
  lg: "w-5 h-5 text-base rounded-md",
};

export const Checkbox = React.forwardRef(function Checkbox(
  {
    label,
    description,
    checked,
    defaultChecked,
    onChange,
    disabled = false,
    indeterminate = false,
    error,
    size = "md",
    id: customId,
    className = "",
    wrapperClassName = "",
    ...props
  },
  forwardedRef
) {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const localRef = useRef(null);

  // Sync ref with indeterminate property
  useEffect(() => {
    const el = forwardedRef && "current" in forwardedRef ? forwardedRef.current : localRef.current;
    if (el) {
      el.indeterminate = indeterminate;
    }
  }, [indeterminate, forwardedRef]);

  const setCombinedRef = (node) => {
    localRef.current = node;
    if (typeof forwardedRef === "function") {
      forwardedRef(node);
    } else if (forwardedRef && "current" in forwardedRef) {
      forwardedRef.current = node;
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", wrapperClassName)}>
      <label
        htmlFor={inputId}
        className={cn(
          "inline-flex items-start gap-2.5 cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="relative flex items-center pt-0.5">
          <input
            ref={setCombinedRef}
            id={inputId}
            type="checkbox"
            checked={checked}
            defaultChecked={defaultChecked}
            onChange={onChange}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={cn(
              "accent-blue-600 border-gray-300 text-blue-600 transition duration-150 cursor-pointer",
              "focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none",
              error && "border-rose-500 accent-rose-600 focus:ring-rose-400",
              disabled && "cursor-not-allowed",
              sizeClasses[size] || sizeClasses.md,
              className
            )}
            {...props}
          />
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className={cn("text-sm font-medium text-gray-800", disabled && "text-gray-400")}>
                {label}
              </span>
            )}
            {description && (
              <span className="text-xs text-gray-500 leading-normal">
                {description}
              </span>
            )}
          </div>
        )}
      </label>

      {error && (
        <p className="text-xs text-rose-600 font-medium pl-6">
          {error}
        </p>
      )}
    </div>
  );
});

export default Checkbox;
