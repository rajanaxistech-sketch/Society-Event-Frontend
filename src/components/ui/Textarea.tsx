import React from 'react';
import clsx from 'clsx';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, requiredIndicator, className = '', id, rows = 3, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-bold text-[#1E293B] flex items-center gap-1">
            {label}
            {(requiredIndicator || props.required) && <span className="text-rose-500">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          rows={rows}
          className={clsx(
            'w-full px-3.5 py-2.5 text-xs sm:text-sm text-[#1E293B] bg-white border border-[#CBD5E1] rounded-xl transition-all placeholder:text-slate-400 shadow-2xs',
            'hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:border-[#6366F1]',
            'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
            error ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-500 bg-rose-50/20' : '',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs text-rose-600 mt-0.5">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
