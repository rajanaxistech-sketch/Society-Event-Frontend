import React from 'react';
import clsx from 'clsx';
import societyLogo from '../../assets/society-logo.png';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  label?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  className = '',
  label,
}) => {
  const containerSizes = {
    xs: 'w-10 h-10',
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
    xl: 'w-36 h-36',
  };

  const ringStrokeWidths = {
    xs: 5.5,
    sm: 4.8,
    md: 4.2,
    lg: 3.8,
    xl: 3.2,
  };

  const labelSizes = {
    xs: 'text-[10.5px]',
    sm: 'text-xs',
    md: 'text-[13px]',
    lg: 'text-sm',
    xl: 'text-base',
  };

  return (
    <div
      role="status"
      aria-label={label || 'Loading...'}
      className={clsx('flex flex-col items-center justify-center gap-3', className)}
    >
      {/* Circular Rotating Loader with Center Gold Logo */}
      <div className={clsx('relative flex items-center justify-center shrink-0', containerSizes[size])}>
        {/* Soft Ambient Gold Background Glow Pulse */}
        <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-35 pointer-events-none" />

        {/* Subtle Static Track Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 text-amber-100/90"
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

        {/* Primary Circular Spinning Arc (Rich Gold/Amber) */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin text-amber-500"
          viewBox="0 0 100 100"
          style={{ animationDuration: '1.2s' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="goldSpinnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <circle
            stroke="url(#goldSpinnerGrad)"
            strokeWidth={ringStrokeWidths[size]}
            strokeDasharray="276"
            strokeDashoffset="160"
            strokeLinecap="round"
            fill="transparent"
            r="44"
            cx="50"
            cy="50"
          />
        </svg>

        {/* Secondary Counter-rotating Subtle Accent Arc */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin text-indigo-500/60"
          viewBox="0 0 100 100"
          style={{ animationDuration: '2.4s', animationDirection: 'reverse' }}
          aria-hidden="true"
        >
          <circle
            stroke="currentColor"
            strokeWidth={Math.max(2, ringStrokeWidths[size] - 1.5)}
            strokeDasharray="276"
            strokeDashoffset="220"
            strokeLinecap="round"
            fill="transparent"
            r="44"
            cx="50"
            cy="50"
          />
        </svg>

        {/* Centered Circular Logo Container - Increased size & prominent logo scale */}
        <div className="relative z-10 w-[78%] h-[78%] rounded-full overflow-hidden bg-white shadow-sm flex items-center justify-center border border-amber-200/70 p-0.5">
          <img
            src={societyLogo}
            alt="Society Logo"
            className="w-full h-full object-contain select-none pointer-events-none transform scale-115 transition-transform"
            loading="eager"
          />
        </div>
      </div>

      {/* Status Label */}
      {label && (
        <span
          className={clsx(
            'font-semibold text-slate-700 text-center tracking-tight animate-pulse select-none mt-0.5',
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

