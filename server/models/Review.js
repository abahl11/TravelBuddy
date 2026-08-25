// server/models/Review.js
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reviewedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    journey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      required: true,
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number',
      },
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [500, 'Comment must be at most 500 characters'],
    },
  },
  { timestamps: true }
);

ReviewSchema.pre('validate', function rejectSelfReview(next) {
  if (this.reviewer && this.reviewedUser && this.reviewer.toString() === this.reviewedUser.toString()) {
    return next(new Error('You cannot review yourself'));
  }

  next();
});

// One review per reviewer, per reviewed user, per journey.
ReviewSchema.index({ reviewer: 1, reviewedUser: 1, journey: 1 }, { unique: true });
ReviewSchema.index({ reviewedUser: 1, createdAt: -1 });
ReviewSchema.index({ journey: 1 });

/**
 * Recomputes and stores a user's rating aggregate. Called after any write that
 * changes the review set, so User.averageRating never drifts from the reviews.
 */
ReviewSchema.statics.syncUserRating = async function syncUserRating(userId) {
  const [result] = await this.aggregate([
    { $match: { reviewedUser: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$reviewedUser',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  await mongoose.model('User').findByIdAndUpdate(userId, {
    averageRating: result ? Math.round(result.averageRating * 10) / 10 : 0,
    reviewCount: result ? result.reviewCount : 0,
  });
};

module.exports = mongoose.model('Review', ReviewSchema);
