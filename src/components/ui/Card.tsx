import React from 'react';
import clsx from 'clsx';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  footer,
  noPadding = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={clsx(
        'bg-white border border-[#E2E8F0] rounded-xl shadow-card overflow-hidden flex flex-col transition-all duration-200',
        className
      )}
      {...props}
    >
      {(title || headerAction) && (
        <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#F8F7FC]/70 border-b border-[#E2E8F0] flex items-center justify-between gap-3">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={clsx('flex-1', !noPadding && 'p-3 sm:p-4')}>{children}</div>
      {footer && (
        <div className="px-3.5 sm:px-4 py-2 bg-[#F8F7FC]/70 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;

