import React from 'react';
import { Inbox } from 'lucide-react';
import clsx from 'clsx';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no items matching your criteria or currently available.',
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-[#E2E8F0] shadow-2xs',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center text-[#6366F1] mb-4 shadow-2xs">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h4 className="text-base font-bold text-[#1E293B]">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
