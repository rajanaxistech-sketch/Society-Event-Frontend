import React, { useId } from "react";
import { cn } from "../../../utils/cn";

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs rounded-md",
  md: "px-3.5 py-2 text-sm rounded-lg",
  lg: "px-4 py-2.5 text-base rounded-lg",
};

export const Input = React.forwardRef(function Input(
  {
    label,
    error,
    helperText,
    required = false,
    disabled = false,
    readOnly = false,
    leftIcon = null,
    rightIcon = null,
    size = "md",
    fullWidth = true,
    type = "text",
    id: customId,
    className = "",
    wrapperClassName = "",
    ...props
  },
  ref
) {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;

  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth ? "w-full" : "w-auto", wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium select-none text-gray-700 flex items-center gap-1",
            disabled && "text-gray-400 cursor-not-allowed"
          )}
        >
          {label}
          {required && <span className="text-rose-500 font-bold" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-gray-400">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={type}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            "w-full border bg-white text-gray-900 transition-colors duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            sizeClasses[size] || sizeClasses.md,
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            hasError
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-200 text-rose-900"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-100",
            disabled && "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed shadow-none",
            readOnly && "bg-gray-50 border-gray-200 cursor-default",
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3 flex items-center text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>

      {hasError ? (
        <p id={errorId} className="text-xs text-rose-600 flex items-center gap-1 font-medium">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-gray-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
