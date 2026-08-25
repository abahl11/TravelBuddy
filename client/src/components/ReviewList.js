import React from 'react';
import UserAvatar from './UserAvatar';
import StarRating from './StarRating';
import EmptyState from './EmptyState';
import { formatShortDate } from '../utils/formatDate';

const ReviewList = ({ reviews, title = 'Reviews', showHeading = true, emptyMessage }) => {
  if (!reviews || reviews.length === 0) {
    return (
      <EmptyState
        icon="star"
        title="No reviews yet"
        description={emptyMessage || 'Reviews appear here once a journey is completed.'}
      />
    );
  }

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {showHeading && <h3 className="text-lg">{title}</h3>}
        <div className="flex items-center gap-2">
          <StarRating value={Math.round(average)} />
          <span className="text-sm font-semibold text-ink-900">{average.toFixed(1)}</span>
          <span className="text-sm text-ink-500">
            ({reviews.length} review{reviews.length === 1 ? '' : 's'})
          </span>
        </div>
      </div>

      <ul className="mt-4 space-y-4">
        {reviews.map((review) => (
          <li key={review._id} className="rounded-2xl border border-ink-100 bg-white p-4">
            <div className="flex items-start gap-3">
              <UserAvatar user={review.reviewer} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-ink-900">
                    {review.reviewer?.fullName || review.reviewer?.username || 'Someone'}
                  </p>
                  <time className="text-xs text-ink-400">{formatShortDate(review.createdAt)}</time>
                </div>

                <StarRating value={review.rating} size="sm" className="mt-1" />

                <p className="mt-2 text-sm leading-relaxed text-ink-700">{review.comment}</p>

                {review.journey?.origin && (
                  <p className="mt-2 text-xs text-ink-400">
                    {review.journey.origin} &rarr; {review.journey.destination}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReviewList;
