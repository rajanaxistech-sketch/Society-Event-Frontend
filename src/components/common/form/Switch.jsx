import React, { useId, useState } from "react";
import { cn } from "../../../utils/cn";

const sizeConfig = {
  sm: {
    track: "w-8 h-4",
    thumb: "w-3 h-3",
    translate: "translate-x-4",
  },
  md: {
    track: "w-11 h-6",
    thumb: "w-4 h-4",
    translate: "translate-x-5",
  },
  lg: {
    track: "w-14 h-7",
    thumb: "w-5 h-5",
    translate: "translate-x-7",
  },
};

export const Switch = React.forwardRef(function Switch(
  {
    label,
    description,
    checked,
    defaultChecked = false,
    onChange,
    disabled = false,
    size = "md",
    id: customId,
    className = "",
    wrapperClassName = "",
    ...props
  },
  ref
) {
  const generatedId = useId();
  const switchId = customId || generatedId;

  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const toggle = () => {
    if (disabled) return;
    const nextVal = !isChecked;
    if (!isControlled) {
      setInternalChecked(nextVal);
    }
    onChange?.(nextVal);
  };

  const config = sizeConfig[size] || sizeConfig.md;

  return (
    <div className={cn("inline-flex flex-col gap-1", wrapperClassName)}>
      <div className="inline-flex items-center gap-3">
        <button
          ref={ref}
          id={switchId}
          type="button"
          role="switch"
          aria-checked={isChecked}
          disabled={disabled}
          onClick={toggle}
          className={cn(
            "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            isChecked ? "bg-blue-600" : "bg-gray-200",
            disabled && "opacity-50 cursor-not-allowed",
            config.track,
            className
          )}
          {...props}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none inline-block transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out my-auto self-center ml-0.5",
              isChecked ? config.translate : "translate-x-0",
              config.thumb
            )}
          />
        </button>

        {(label || description) && (
          <label
            htmlFor={switchId}
            onClick={toggle}
            className={cn(
              "flex flex-col cursor-pointer select-none",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {label && (
              <span className="text-sm font-medium text-gray-800">{label}</span>
            )}
            {description && (
              <span className="text-xs text-gray-500">{description}</span>
            )}
          </label>
        )}
      </div>
    </div>
  );
});

export default Switch;
