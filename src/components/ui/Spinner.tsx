import React from 'react';
import clsx from 'clsx';
import societyLogo from '../../assets/society-logo.png';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  const containerSizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const ringStrokeWidths = {
    sm: 5,
    md: 4.5,
    lg: 4,
    xl: 3.5,
  };

  const labelSizes = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-[13px]',
    xl: 'text-sm',
  };

  return (
    <div
      role="status"
      aria-label={label || 'Loading...'}
      className={clsx('flex flex-col items-center justify-center gap-3', className)}
    >
      {/* Circular Rotating Loader with Center Logo */}
      <div className={clsx('relative flex items-center justify-center shrink-0', containerSizes[size])}>
        {/* Soft Ambient Background Pulse Ring */}
        <div className="absolute inset-1 rounded-full bg-indigo-500/10 animate-ping opacity-25 pointer-events-none" />

        {/* Subtle Static Track Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 text-indigo-100"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            stroke="currentColor"
            strokeWidth={ringStrokeWidths[size]}
            fill="transparent"
            r="44"
            cx="50"
            cy="50"
          />
        </svg>

        {/* Primary Circular Spinning Arc */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin text-indigo-600"
          viewBox="0 0 100 100"
          style={{ animationDuration: '1.2s' }}
          aria-hidden="true"
        >
          <circle
            stroke="currentColor"
            strokeWidth={ringStrokeWidths[size]}
            strokeDasharray="276"
            strokeDashoffset="180"
            strokeLinecap="round"
            fill="transparent"
            r="44"
            cx="50"
            cy="50"
          />
        </svg>

        {/* Secondary Counter-rotating Subtle Accent Arc */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin text-purple-500/70"
          viewBox="0 0 100 100"
          style={{ animationDuration: '2.2s', animationDirection: 'reverse' }}
          aria-hidden="true"
        >
          <circle
            stroke="currentColor"
            strokeWidth={ringStrokeWidths[size] - 1}
            strokeDasharray="276"
            strokeDashoffset="230"
            strokeLinecap="round"
            fill="transparent"
            r="44"
            cx="50"
            cy="50"
          />
        </svg>

        {/* Centered Circular Society Event Management Logo */}
        <div className="relative z-10 w-[70%] h-[70%] rounded-full overflow-hidden bg-white shadow-xs p-1 flex items-center justify-center border border-slate-100">
          <img
            src={societyLogo}
            alt="Society Event Management"
            className="w-full h-full object-contain select-none pointer-events-none"
            loading="eager"
          />
        </div>
      </div>

      {/* Status Label */}
      {label && (
        <span
          className={clsx(
            'font-medium text-slate-600 text-center tracking-tight animate-pulse select-none',
            labelSizes[size]
          )}
        >
          {label}
        </span>
      )}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
};

export default Spinner;
