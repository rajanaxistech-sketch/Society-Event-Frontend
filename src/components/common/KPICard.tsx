import React from 'react';
import clsx from 'clsx';

export interface KPICardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  variant?: 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'teal';
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-white border-slate-200 text-slate-900',
    indigo: 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100 text-indigo-950',
    emerald: 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100 text-emerald-950',
    amber: 'bg-gradient-to-br from-amber-50 to-white border-amber-100 text-amber-950',
    rose: 'bg-gradient-to-br from-rose-50 to-white border-rose-100 text-rose-950',
    teal: 'bg-gradient-to-br from-teal-50 to-white border-teal-100 text-teal-950',
  };

  const iconColors = {
    default: 'text-indigo-600 bg-indigo-50',
    indigo: 'text-indigo-600 bg-indigo-100/60',
    emerald: 'text-emerald-600 bg-emerald-100/60',
    amber: 'text-amber-600 bg-amber-100/60',
    rose: 'text-rose-600 bg-rose-100/60',
    teal: 'text-teal-600 bg-teal-100/60',
  };

  return (
    <div
      className={clsx(
        'p-5 rounded-xl border shadow-xs flex flex-col justify-between transition-all hover:shadow-md duration-200',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <div className={clsx('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconColors[variant])}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2 text-xs flex items-center gap-1.5 text-slate-500">
          {trend && (
            <span
              className={clsx(
                'font-semibold',
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtitle && <span>{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default KPICard;
