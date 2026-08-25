import React from 'react';

const getInitials = (name) => {
  if (!name) return '?';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Paired background/foreground so text contrast holds for every name.
const PALETTE = [
  'bg-primary-100 text-primary-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-700',
  'bg-violet-100 text-violet-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-teal-100 text-teal-700',
];

/** Same name always gets the same colour, so people stay recognisable. */
const colorFor = (name) => {
  if (!name) return 'bg-ink-200 text-ink-600';

  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return PALETTE[Math.abs(hash) % PALETTE.length];
};

export const AVATAR_SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
};

const InitialsAvatar = ({ name, size = 'md', className = '' }) => (
  <div
    className={`inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold ${
      AVATAR_SIZES[size] || AVATAR_SIZES.md
    } ${colorFor(name)} ${className}`}
    title={name || undefined}
  >
    {getInitials(name)}
  </div>
);

export default InitialsAvatar;
