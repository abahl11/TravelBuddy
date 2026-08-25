import React from 'react';
import Icon from './Icon';

const SIZES = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-7 w-7' };

/**
 * Read-only display, or an interactive picker when `onChange` is supplied.
 */
const StarRating = ({ value = 0, onChange, size = 'md', className = '' }) => {
  const interactive = typeof onChange === 'function';
  const starClass = SIZES[size] || SIZES.md;

  return (
    <div className={`flex items-center gap-0.5 ${className}`} role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? 'Rating' : `${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const icon = (
          <Icon
            name="star"
            filled={filled}
            className={`${starClass} ${filled ? 'text-amber-400' : 'text-ink-300'}`}
          />
        );

        if (!interactive) {
          return <span key={star}>{icon}</span>;
        }

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
            onClick={() => onChange(star)}
            className="rounded transition-transform hover:scale-110"
          >
            {icon}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
