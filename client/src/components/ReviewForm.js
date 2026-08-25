import React, { useState } from 'react';
import reviewService from '../services/reviewService';
import { getErrorMessage } from '../api/client';
import UserAvatar from './UserAvatar';
import StarRating from './StarRating';
import ErrorMessage from './ErrorMessage';

const RATING_LABELS = {
  1: 'Would not travel again',
  2: 'Below expectations',
  3: 'Fine',
  4: 'Good company',
  5: 'Great to travel with',
};

const ReviewForm = ({ journey, reviewedUser, onReviewSubmitted, onCancel }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!comment.trim()) {
      setError('Please write a short comment');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const review = await reviewService.createReview({
        reviewedUser: reviewedUser._id,
        journey: journey._id,
        rating,
        comment: comment.trim(),
      });

      onReviewSubmitted?.(review);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to submit the review'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-100 bg-ink-50/60 p-5">
      <div className="flex items-center gap-3">
        <UserAvatar user={reviewedUser} size="md" />
        <div>
          <p className="text-sm text-ink-500">Reviewing</p>
          <p className="font-semibold">{reviewedUser.fullName || reviewedUser.username}</p>
        </div>
      </div>

      <ErrorMessage error={error} className="mt-4" onDismiss={() => setError('')} />

      <div className="mt-5">
        <span className="label">How was travelling together?</span>
        <div className="flex items-center gap-3">
          <StarRating value={rating} onChange={setRating} size="lg" />
          <span className="text-sm text-ink-500">{RATING_LABELS[rating]}</span>
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="review-comment" className="label">
          Your review
        </label>
        <textarea
          id="review-comment"
          rows="4"
          maxLength={500}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Were they on time? Easy to coordinate with? Would you travel together again?"
          className="input resize-y"
          required
        />
        <p className="mt-1.5 text-right text-xs text-ink-400">{comment.length}/500</p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row-reverse">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit review'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
