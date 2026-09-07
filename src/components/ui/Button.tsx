import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/20 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-xs sm:text-sm gap-2',
    lg: 'px-5 py-2.5 text-sm sm:text-base gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#6366F1] text-white hover:bg-[#4F46E5] active:bg-[#4338CA] shadow-2xs border border-transparent',
    secondary:
      'bg-[#EEF2FF] text-[#6366F1] hover:bg-[#E0E7FF] hover:text-[#4F46E5] border border-indigo-200/60 shadow-2xs',
    outline:
      'bg-white text-slate-700 hover:bg-[#EEF2FF] hover:text-[#6366F1] hover:border-indigo-200 border border-[#E2E8F0] shadow-2xs',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-2xs border border-transparent',
    warning:
      'bg-[#F59E0B] text-white hover:bg-[#D97706] active:bg-[#B45309] shadow-2xs border border-transparent',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-2xs border border-transparent',
    ghost:
      'bg-transparent text-slate-600 hover:bg-[#EEF2FF] hover:text-[#6366F1] border border-transparent',
  };

  return (
    <button
      className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;

