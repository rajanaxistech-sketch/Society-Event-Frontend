import React from 'react';
import clsx from 'clsx';

export interface SwitchProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <label
      className={clsx(
        'inline-flex items-start gap-2 cursor-pointer select-none',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={clsx(
          'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#6366F1]/40',
          checked ? 'bg-[#6366F1]' : 'bg-[#CBD5E1]'
        )}
      >
        <span
          className={clsx(
            'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-4' : 'translate-x-0'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex flex-col text-left">
          {label && <span className="text-xs font-semibold text-[#1E293B]">{label}</span>}
          {description && <span className="text-[11px] text-slate-500">{description}</span>}
        </div>
      )}
    </label>
  );
};

export default Switch;
