import React from 'react';
import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';

export interface MobileCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  badge?: string | number | null;
  badgeColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'teal';
  onClick?: () => void;
  className?: string;
  children?: React.ReactNode;
  showChevron?: boolean;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  icon,
  iconBg = 'bg-indigo-50 text-indigo-600 border border-indigo-100/60',
  badge,
  badgeColor = 'indigo',
  onClick,
  className = '',
  children,
  showChevron = false,
}) => {
  const badgeColorClasses = {
    indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    rose: 'bg-rose-100 text-rose-700 border-rose-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    teal: 'bg-teal-100 text-teal-700 border-teal-200',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={clsx(
        'w-full bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-card text-left transition-all duration-200 relative overflow-hidden',
        onClick && 'active:scale-[0.98] hover:border-indigo-200 hover:shadow-card-hover cursor-pointer group',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && (
            <div
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105',
                iconBg
              )}
            >
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="font-bold text-slate-800 text-[13px] sm:text-sm truncate leading-tight group-hover:text-indigo-600 transition-colors">
                {title}
              </h4>
              {badge !== undefined && badge !== null && (
                <span
                  className={clsx(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full border leading-none',
                    badgeColorClasses[badgeColor] || badgeColorClasses.indigo
                  )}
                >
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {showChevron && (
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
        )}
      </div>

      {children && <div className="mt-2.5 pt-2.5 border-t border-slate-100">{children}</div>}
    </Component>
  );
};

export interface ModuleGridCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  iconBg?: string;
  badge?: string | number | null;
  badgeColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple' | 'teal';
  onClick: () => void;
  className?: string;
}

export const ModuleGridCard: React.FC<ModuleGridCardProps> = ({
  title,
  description,
  icon,
  iconBg = 'bg-indigo-50 text-indigo-600',
  badge,
  badgeColor = 'indigo',
  onClick,
  className = '',
}) => {
  const badgeColorClasses = {
    indigo: 'bg-indigo-100 text-indigo-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-700',
    purple: 'bg-purple-100 text-purple-700',
    teal: 'bg-teal-100 text-teal-700',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'group bg-white rounded-2xl p-3 border border-slate-200/80 shadow-card text-left transition-all duration-200 active:scale-[0.97] hover:border-indigo-200 hover:shadow-card-hover flex flex-col justify-between relative overflow-hidden',
        className
      )}
    >
      {badge !== undefined && badge !== null && (
        <span
          className={clsx(
            'absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none',
            badgeColorClasses[badgeColor] || badgeColorClasses.indigo
          )}
        >
          {badge}
        </span>
      )}

      <div
        className={clsx(
          'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-2 transition-transform duration-200 group-hover:scale-105 shadow-2xs',
          iconBg
        )}
      >
        {icon}
      </div>

      <div className="w-full">
        <h5 className="font-bold text-slate-800 text-xs sm:text-[13px] leading-snug group-hover:text-indigo-600 transition-colors">
          {title}
        </h5>
        {description && (
          <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium leading-tight">
            {description}
          </p>
        )}
      </div>
    </button>
  );
};

export default MobileCard;
