import React from 'react';

/** Placeholder matching JourneyCard's proportions, so lists do not jump. */
const JourneyCardSkeleton = () => (
  <div className="card overflow-hidden">
    <div className="skeleton h-[132px] rounded-none" />
    <div className="space-y-3 p-5">
      <div className="skeleton h-4 w-2/3" />
      <div className="skeleton h-4 w-1/3" />
      <div className="flex items-center gap-3 border-t border-ink-100 pt-4">
        <div className="skeleton h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-1/2" />
          <div className="skeleton h-3 w-1/3" />
        </div>
      </div>
    </div>
  </div>
);

export default JourneyCardSkeleton;
