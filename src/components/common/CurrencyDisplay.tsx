import React from 'react';
import clsx from 'clsx';
import { formatCurrency } from '../../utils/formatters';

export interface CurrencyDisplayProps {
  amount: number | string | null | undefined;
  className?: string;
  trend?: 'positive' | 'negative' | 'neutral';
}

export const CurrencyDisplay: React.FC<CurrencyDisplayProps> = ({
  amount,
  className = '',
  trend,
}) => {
  const formatted = formatCurrency(amount);

  return (
    <span
      className={clsx(
        'font-medium tracking-tight',
        trend === 'positive' && 'text-emerald-600',
        trend === 'negative' && 'text-rose-600',
        trend === 'neutral' && 'text-slate-600',
        className
      )}
    >
      {formatted}
    </span>
  );
};

export default CurrencyDisplay;
