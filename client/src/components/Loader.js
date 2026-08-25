import React from 'react';

const SIZES = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
};

const Spinner = ({ size = 'md', className = '' }) => (
  <span
    role="status"
    aria-label="Loading"
    className={`inline-block animate-spin rounded-full border-primary-600 border-r-transparent ${
      SIZES[size] || SIZES.md
    } ${className}`}
  />
);

const Loader = ({ size = 'md', fullScreen = false, label }) => {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm">
        <Spinner size="lg" />
        {label && <p className="text-sm text-ink-500">{label}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <Spinner size={size} />
      {label && <p className="text-sm text-ink-500">{label}</p>}
    </div>
  );
};

export { Spinner };
export default Loader;
