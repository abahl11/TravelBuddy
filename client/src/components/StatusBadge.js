import React from 'react';

const STYLES = {
  open: { light: 'badge-open', dark: 'bg-emerald-400/20 text-emerald-100', label: 'Open' },
  full: { light: 'badge-full', dark: 'bg-amber-400/20 text-amber-100', label: 'Full' },
  completed: { light: 'badge-completed', dark: 'bg-white/20 text-white', label: 'Completed' },
  cancelled: { light: 'badge-cancelled', dark: 'bg-red-400/20 text-red-100', label: 'Cancelled' },
  pending: { light: 'badge-full', dark: 'bg-amber-400/20 text-amber-100', label: 'Pending' },
  accepted: { light: 'badge-open', dark: 'bg-emerald-400/20 text-emerald-100', label: 'Accepted' },
  rejected: { light: 'badge-cancelled', dark: 'bg-red-400/20 text-red-100', label: 'Declined' },
};

const StatusBadge = ({ status, onDark = false, className = '' }) => {
  const config = STYLES[status];

  if (!config) return null;

  return (
    <span
      className={`${onDark ? `badge backdrop-blur-sm ${config.dark}` : config.light} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;
