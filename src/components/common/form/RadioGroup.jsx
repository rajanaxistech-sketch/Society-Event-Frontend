import React, { useId, useState } from "react";
import { cn } from "../../../utils/cn";

export function RadioGroup({
  label,
  name: customName,
  options = [],
  value,
  defaultValue,
  onChange,
  direction = "vertical", // 'vertical' | 'horizontal'
  disabled = false,
  error,
  helperText,
  required = false,
  className = "",
  ...props
}) {
  const generatedId = useId();
  const groupName = customName || `radio-group-${generatedId}`;
  const [internalValue, setInternalValue] = useState(defaultValue);

  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (val) => {
    if (!isControlled) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={label ? `${groupName}-label` : undefined}
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {label && (
        <span
          id={`${groupName}-label`}
          className={cn(
            "text-sm font-medium text-gray-700 flex items-center gap-1",
            disabled && "text-gray-400"
          )}
        >
          {label}
          {required && <span className="text-rose-500 font-bold" aria-hidden="true">*</span>}
        </span>
      )}

      <div
        className={cn(
          "flex gap-3",
          direction === "vertical" ? "flex-col" : "flex-row flex-wrap"
        )}
      >
        {options.map((opt) => {
          const isSelected = currentValue === opt.value;
          const isOptionDisabled = disabled || Boolean(opt.disabled);
          const optionId = `${groupName}-${opt.value}`;

          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              className={cn(
                "inline-flex items-start gap-2.5 cursor-pointer select-none",
                isOptionDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="relative flex items-center pt-0.5">
                <input
                  id={optionId}
                  type="radio"
                  name={groupName}
                  value={opt.value}
                  checked={isSelected}
                  disabled={isOptionDisabled}
                  onChange={() => handleChange(opt.value)}
                  className={cn(
                    "w-4 h-4 accent-blue-600 border-gray-300 text-blue-600 transition cursor-pointer",
                    "focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none",
                    error && "border-rose-500 accent-rose-600 focus:ring-rose-400",
                    isOptionDisabled && "cursor-not-allowed"
                  )}
                />
              </div>

              <div className="flex flex-col">
                <span
                  className={cn(
                    "text-sm font-medium text-gray-800",
                    isOptionDisabled && "text-gray-400"
                  )}
                >
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="text-xs text-gray-500 leading-normal">
                    {opt.description}
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error ? (
        <p className="text-xs text-rose-600 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500">{helperText}</p>
      ) : null}
    </div>
  );
}

export default RadioGroup;
