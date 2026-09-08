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
        'flex flex-col items-center justify-center p-6 sm:p-8 text-center bg-white rounded-xl border border-dashed border-[#E2E8F0] shadow-2xs',
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#6366F1] mb-2.5 shadow-2xs">
        {icon || <Inbox className="w-5 h-5" />}
      </div>
      <h4 className="text-sm font-bold text-[#1E293B]">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-0.5 mb-3.5 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};

export default EmptyState;
