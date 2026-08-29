import React from 'react';
import type { BookingStatus } from '../../types';

interface StatusBadgeProps {
  status: BookingStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getClassName = () => {
    switch (status) {
      case 'Pending':
        return 'status-badge status-pending';
      case 'Confirmed':
        return 'status-badge status-confirmed';
      case 'Completed':
        return 'status-badge status-completed';
      case 'Cancelled':
        return 'status-badge status-cancelled';
      case 'No Show':
        return 'status-badge status-no-show';
      default:
        return 'status-badge';
    }
  };

  return <span className={getClassName()}>{status}</span>;
};
