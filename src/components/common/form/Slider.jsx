import React, { useId, useState } from "react";
import { cn } from "../../../utils/cn";

export const Slider = React.forwardRef(function Slider(
  {
    label,
    min = 0,
    max = 100,
    step = 1,
    value,
    defaultValue = 0,
    onChange,
    showValue = true,
    disabled = false,
    error,
    id: customId,
    className = "",
    wrapperClassName = "",
    ...props
  },
  ref
) {
  const generatedId = useId();
  const sliderId = customId || generatedId;

  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const handleChange = (e) => {
    const nextVal = Number(e.target.value);
    if (!isControlled) {
      setInternalValue(nextVal);
    }
    onChange?.(nextVal, e);
  };

  const percentage = Math.min(
    100,
    Math.max(0, ((currentValue - min) / (max - min)) * 100)
  );

  return (
    <div className={cn("flex flex-col gap-2 w-full", wrapperClassName)}>
      {(label || showValue) && (
        <div className="flex justify-between items-center text-sm font-medium">
          {label && (
            <label
              htmlFor={sliderId}
              className={cn("text-gray-700", disabled && "text-gray-400")}
            >
              {label}
            </label>
          )}
          {showValue && (
            <span className={cn("text-gray-600 font-mono text-xs px-2 py-0.5 bg-gray-100 rounded", disabled && "text-gray-400")}>
              {currentValue}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center w-full h-6">
        <input
          ref={ref}
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          onChange={handleChange}
          disabled={disabled}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={currentValue}
          style={{
            background: `linear-gradient(to right, #2563eb ${percentage}%, #e5e7eb ${percentage}%)`,
          }}
          className={cn(
            "w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-600 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110",
            disabled && "opacity-50 cursor-not-allowed [&::-webkit-slider-thumb]:cursor-not-allowed",
            className
          )}
          {...props}
        />
      </div>

      <div className="flex justify-between text-[11px] text-gray-400 font-mono -mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
});

export default Slider;
