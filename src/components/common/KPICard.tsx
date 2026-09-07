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
  variant?: 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'teal' | 'purple';
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
  const iconColors = {
    default: 'text-[#6366F1] bg-[#EEF2FF]',
    indigo: 'text-[#6366F1] bg-[#EEF2FF]',
    purple: 'text-[#8B5CF6] bg-[#FAF5FF]',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-[#D97706] bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
    teal: 'text-[#0D9488] bg-teal-50',
  };

  const accentBorders = {
    default: 'border-[#E2E8F0] hover:border-indigo-200',
    indigo: 'border-[#E2E8F0] hover:border-indigo-300',
    purple: 'border-[#E2E8F0] hover:border-purple-300',
    emerald: 'border-[#E2E8F0] hover:border-emerald-300',
    amber: 'border-[#E2E8F0] hover:border-amber-300',
    rose: 'border-[#E2E8F0] hover:border-rose-300',
    teal: 'border-[#E2E8F0] hover:border-teal-300',
  };

  return (
    <div
      className={clsx(
        'p-4 sm:p-5 rounded-2xl bg-white border shadow-card flex flex-col justify-between transition-all duration-200 hover:shadow-card-hover min-w-0',
        accentBorders[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2.5 min-w-0">
        <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
          {title}
        </span>
        {icon && (
          <div className={clsx('w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs', iconColors[variant])}>
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 min-w-0">
        <div className="text-xl sm:text-2xl font-black tracking-tight text-[#1E293B] truncate">{value}</div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs flex items-center gap-1.5 text-slate-500">
          {trend && (
            <span
              className={clsx(
                'font-bold',
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {trend.value}
            </span>
          )}
          {subtitle && <span className="truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};

export default KPICard;

