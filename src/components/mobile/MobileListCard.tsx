import React from 'react';
import clsx from 'clsx';
import StatusBadge from '../common/StatusBadge';

export interface MobileListCardProps {
  title: string;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
  status?: string;
  badge?: React.ReactNode;
  meta?: Array<{
    label: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
  }>;
  actions?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MobileListCard: React.FC<MobileListCardProps> = ({
  title,
  subtitle,
  icon,
  iconBg = 'bg-indigo-50 text-indigo-600',
  status,
  badge,
  meta = [],
  actions,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'bg-white rounded-2xl p-3 border border-slate-200/80 shadow-card transition-all duration-200 text-left relative space-y-2',
        onClick && 'cursor-pointer hover:border-indigo-200 active:scale-[0.99]',
        className
      )}
    >
      {/* Top Row: Icon + Title/Subtitle + Status/Badge */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {icon && (
            <div
              className={clsx(
                'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5',
                iconBg
              )}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] leading-snug">
              {title}
            </h4>
            {subtitle && (
              <div className="text-[11px] text-slate-500 mt-0.5 font-medium leading-tight">
                {subtitle}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          {status && <StatusBadge status={status} size="sm" />}
          {badge}
        </div>
      </div>

      {/* Metadata Grid / Rows */}
      {meta.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-slate-100 text-[11px]">
          {meta.map((item, idx) => (
            <div key={idx} className="flex flex-col min-w-0">
              <span className="text-[10px] text-slate-400 font-medium">{item.label}</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1 truncate">
                {item.icon && <span className="text-slate-400 shrink-0">{item.icon}</span>}
                <span className="truncate">{item.value || '—'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons Row */}
      {actions && (
        <div
          className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100/80"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
    </div>
  );
};

export default MobileListCard;
