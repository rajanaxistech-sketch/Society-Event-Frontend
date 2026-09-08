import React from 'react';
import clsx from 'clsx';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'gray' | 'blue' | 'indigo' | 'green' | 'red' | 'yellow' | 'purple' | 'teal' | 'orange' | 'amber';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-1.5 py-0.5 text-[9px] gap-1 font-bold',
    md: 'px-2 py-0.5 text-[10px] sm:text-[11px] gap-1 font-bold',
  };

  const variantStyles = {
    gray: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    indigo: 'bg-[#EEF2FF] text-[#4F46E5] border-indigo-200/70',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
    yellow: 'bg-amber-50 text-amber-800 border-amber-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    purple: 'bg-[#FAF5FF] text-[#7C3AED] border-purple-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
  };

  const dotColors = {
    gray: 'bg-slate-400',
    blue: 'bg-blue-500',
    indigo: 'bg-[#6366F1]',
    green: 'bg-emerald-500',
    red: 'bg-rose-500',
    yellow: 'bg-amber-500',
    amber: 'bg-amber-500',
    purple: 'bg-[#8B5CF6]',
    teal: 'bg-[#14B8A6]',
    orange: 'bg-orange-500',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full border tracking-wide uppercase shadow-2xs select-none',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};

export default Badge;

