import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Formats a number or string amount into Indian Rupee currency format (e.g., ₹1,00,000.00 or ₹1,00,000)
 */
export const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }

  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
  }).format(num);
};

/**
 * Formats date into "12 Sep 2026"
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  const d = dayjs(date);
  return d.isValid() ? d.format('DD MMM YYYY') : '—';
};

/**
 * Formats date-time into "12 Sep 2026, 10:30 AM"
 */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  const d = dayjs(date);
  return d.isValid() ? d.format('DD MMM YYYY, hh:mm A') : '—';
};

/**
 * Formats relative time (e.g. "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  const d = dayjs(date);
  return d.isValid() ? d.fromNow() : '—';
};

/**
 * Capitalizes string and replaces underscores with spaces
 */
export const formatEnumString = (val: string | null | undefined): string => {
  if (!val) return '—';
  return val
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
