import React from 'react';
import { Badge, BadgeProps } from '../ui/Badge';
import { formatEnumString } from '../../utils/formatters';

export interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', size = 'md' }) => {
  if (!status) return null;

  const normalized = status.toLowerCase();

  let variant: BadgeProps['variant'] = 'gray';

  switch (normalized) {
    // Active / Success states
    case 'active':
    case 'paid':
    case 'cleared':
    case 'confirmed':
    case 'imported':
    case 'completed':
      variant = 'green';
      break;

    // Published / Ongoing / Planned / Blue states
    case 'published':
    case 'planned':
    case 'validating':
      variant = 'blue';
      break;

    case 'ongoing':
    case 'previewed':
      variant = 'teal';
      break;

    // Warning / Pending / Partial states
    case 'pending':
    case 'partially_paid':
    case 'partial':
    case 'importing':
    case 'queued':
      variant = 'yellow';
      break;

    // Danger / Inactive / Failed / Cancelled / Overdue states
    case 'inactive':
    case 'draft':
      variant = 'gray';
      break;

    case 'cancelled':
    case 'overdue':
    case 'bounced':
    case 'failed':
    case 'reversed':
    case 'error':
      variant = 'red';
      break;

    default:
      variant = 'gray';
  }

  return (
    <Badge variant={variant} size={size} dot className={className}>
      {formatEnumString(status)}
    </Badge>
  );
};

export default StatusBadge;
