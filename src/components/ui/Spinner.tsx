import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '', label }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className={clsx('animate-spin text-indigo-600', sizeClasses[size], className)} />
      {label && <span className="text-xs text-slate-500 font-medium">{label}</span>}
    </div>
  );
};

export default Spinner;
