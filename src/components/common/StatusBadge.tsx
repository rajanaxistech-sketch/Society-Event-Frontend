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
    // Active / Ongoing states -> Soft Teal
    case 'active':
    case 'ongoing':
    case 'previewed':
      variant = 'teal';
      break;

    // Paid / Cleared / Completed states -> Soft Green
    case 'paid':
    case 'cleared':
    case 'confirmed':
    case 'imported':
    case 'completed':
    case 'success':
      variant = 'green';
      break;

    // Approved / Published / Planned states -> Soft Indigo
    case 'approved':
    case 'published':
    case 'planned':
    case 'validating':
      variant = 'indigo';
      break;

    // Warning / Pending / Partial states -> Soft Amber
    case 'pending':
    case 'partially_paid':
    case 'partial':
    case 'importing':
    case 'queued':
      variant = 'amber';
      break;

    // Rejected / Inactive / Failed / Cancelled / Overdue states -> Soft Red
    case 'rejected':
    case 'cancelled':
    case 'overdue':
    case 'bounced':
    case 'failed':
    case 'reversed':
    case 'error':
      variant = 'red';
      break;

    case 'inactive':
    case 'draft':
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

