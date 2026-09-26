import React from 'react';
import clsx from 'clsx';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  requiredIndicator?: boolean;
  showCount?: boolean;
  currentCount?: number;
  inputSize?: 'sm' | 'md' | 'lg';
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      requiredIndicator,
      showCount,
      currentCount,
      inputSize = 'md',
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const isLarge = inputSize === 'lg';
    const isSmall = inputSize === 'sm';

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className={clsx(
                'font-semibold text-[#1E293B] flex items-center gap-1',
                isLarge ? 'text-sm sm:text-base mb-0.5' : isSmall ? 'text-xs' : 'text-xs sm:text-sm'
              )}
            >
              {label}
              {(requiredIndicator || props.required) && <span className="text-rose-500">*</span>}
            </label>
            {showCount && props.maxLength && (
              <span className={clsx(
                "text-xs font-medium tracking-tight",
                (currentCount || 0) >= props.maxLength ? "text-rose-600 font-semibold" : "text-slate-400"
              )}>
                {currentCount || 0}/{props.maxLength} max
              </span>
            )}
          </div>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div
              className={clsx(
                "absolute text-slate-400 pointer-events-none flex items-center justify-center",
                isLarge ? "left-3.5" : "left-2.5"
              )}
            >
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              'w-full bg-white border border-[#CBD5E1] transition-all placeholder:text-slate-400',
              'hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1]',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              isLarge
                ? 'px-3.5 py-2.5 text-sm sm:text-base rounded-xl h-11 sm:h-12 shadow-xs'
                : isSmall
                ? 'px-2.5 py-1 text-xs rounded-md h-7 shadow-2xs'
                : 'px-3 py-2 text-xs sm:text-sm rounded-lg h-9 sm:h-10 shadow-2xs',
              error ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-500 bg-rose-50/20' : '',
              leftIcon && (isLarge ? 'pl-11' : 'pl-8'),
              rightIcon && (isLarge ? 'pr-11' : 'pr-8'),
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div
              className={clsx(
                "absolute text-slate-400 flex items-center justify-center",
                isLarge ? "right-3.5" : "right-2.5"
              )}
            >
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className={clsx("text-red-600 font-medium mt-0.5", isLarge ? "text-xs sm:text-sm" : "text-[11px]")}>{error}</p>
        ) : helperText ? (
          <p className={clsx("text-slate-500 mt-0.5", isLarge ? "text-xs sm:text-sm" : "text-[11px]")}>{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

