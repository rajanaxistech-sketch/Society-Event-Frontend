import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../ui/Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An error occurred while fetching information from the server.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`p-5 sm:p-6 text-center bg-rose-50/50 rounded-xl border border-rose-200 flex flex-col items-center justify-center ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 mb-2">
        <AlertTriangle className="w-4 h-4" />
      </div>
      <h4 className="text-xs sm:text-sm font-bold text-rose-900">{title}</h4>
      <p className="text-xs text-rose-600 mt-0.5 mb-3 max-w-md">{message}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry} leftIcon={<RefreshCw className="w-3 h-3" />}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
