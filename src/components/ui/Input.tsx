import React from 'react';
import clsx from 'clsx';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  requiredIndicator?: boolean;
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
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#1E293B] flex items-center gap-1">
            {label}
            {(requiredIndicator || props.required) && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-2.5 text-slate-400 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={clsx(
              'w-full px-3 py-1.5 text-xs text-[#1E293B] bg-white border border-[#CBD5E1] rounded-lg transition-all placeholder:text-slate-400 shadow-2xs h-8 sm:h-9',
              'hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1]',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              error ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-500 bg-rose-50/20' : '',
              leftIcon && 'pl-8',
              rightIcon && 'pr-8',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-2.5 text-slate-400 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;

