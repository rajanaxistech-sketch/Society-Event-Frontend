import React from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: SelectOption[];
  placeholder?: string;
  requiredIndicator?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options = [],
      placeholder,
      requiredIndicator,
      className = '',
      id,
      children,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-[#1E293B] flex items-center gap-1">
            {label}
            {(requiredIndicator || props.required) && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={selectId}
            ref={ref}
            className={clsx(
              'w-full px-3 py-1.5 text-xs text-[#1E293B] bg-white border border-[#CBD5E1] rounded-lg transition-all appearance-none pr-8 shadow-2xs h-8 sm:h-9 cursor-pointer',
              'hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1]',
              'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
              error ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-500 bg-rose-50/20' : '',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled selected={!props.value}>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>
          <div className="absolute right-2.5 pointer-events-none text-slate-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
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

Select.displayName = 'Select';
export default Select;

