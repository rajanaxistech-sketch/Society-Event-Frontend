import React, { useId } from "react";
import { cn } from "../../../utils/cn";

const sizeClasses = {
  sm: "px-3 py-1.5 text-xs rounded-md pr-8",
  md: "px-3.5 py-2 text-sm rounded-lg pr-9",
  lg: "px-4 py-2.5 text-base rounded-lg pr-10",
};

export const Select = React.forwardRef(function Select(
  {
    label,
    options = [],
    value,
    defaultValue,
    onChange,
    placeholder = "Select an option...",
    error,
    helperText,
    required = false,
    disabled = false,
    leftIcon = null,
    size = "md",
    fullWidth = true,
    id: customId,
    className = "",
    wrapperClassName = "",
    ...props
  },
  ref
) {
  const generatedId = useId();
  const selectId = customId || generatedId;
  const helperId = `${selectId}-helper`;
  const errorId = `${selectId}-error`;

  const hasError = Boolean(error);

  return (
    <div className={cn("flex flex-col gap-1.5", fullWidth ? "w-full" : "w-auto", wrapperClassName)}>
      {label && (
        <label
          htmlFor={selectId}
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

        <select
          ref={ref}
          id={selectId}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          className={cn(
            "w-full border bg-white text-gray-900 transition-colors duration-150 appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            sizeClasses[size] || sizeClasses.md,
            leftIcon && "pl-9",
            hasError
              ? "border-rose-500 focus:border-rose-500 focus:ring-rose-200 text-rose-900"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-100",
            disabled && "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed shadow-none",
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden={required}>
              {placeholder}
            </option>
          )}
          {options.map((opt, idx) => {
            const isObj = typeof opt === "object" && opt !== null;
            const optVal = isObj ? opt.value : opt;
            const optLabel = isObj ? opt.label : opt;
            const optDisabled = isObj ? Boolean(opt.disabled) : false;

            return (
              <option key={idx} value={optVal} disabled={optDisabled}>
                {optLabel}
              </option>
            );
          })}
        </select>

        {/* Dropdown chevron arrow */}
        <div className="absolute right-3 flex items-center pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

export default Select;
