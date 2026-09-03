import React from 'react';
import { formatDate, formatDateTime, formatRelativeTime } from '../../utils/formatters';

export interface DateDisplayProps {
  date: string | Date | null | undefined;
  format?: 'date' | 'datetime' | 'relative';
  className?: string;
}

export const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  format = 'date',
  className = '',
}) => {
  if (!date) return <span className="text-slate-400">—</span>;

  let text = '—';
  if (format === 'datetime') {
    text = formatDateTime(date);
  } else if (format === 'relative') {
    text = formatRelativeTime(date);
  } else {
    text = formatDate(date);
  }

  return <span className={className}>{text}</span>;
};

export default DateDisplay;
