// server/controllers/reviewController.js
const Review = require('../models/Review');
const Journey = require('../models/Journey');
const User = require('../models/User');
const ApiError = require('../middleware/apiError');
const asyncHandler = require('../middleware/asyncHandler');

const USER_FIELDS = 'username fullName profilePicture university';
const JOURNEY_FIELDS = 'origin destination departureDate';

// @desc    Review a companion after a completed journey
// @route   POST /api/reviews
// @access  Private (journey participants)
const createReview = asyncHandler(async (req, res) => {
  const { reviewedUser, journey, rating, comment } = req.body;

  if (!reviewedUser || !journey) {
    throw ApiError.badRequest('A journey and a user to review are required');
  }

  if (reviewedUser.toString() === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot review yourself');
  }

  const journeyDoc = await Journey.findById(journey);

  if (!journeyDoc) {
    throw ApiError.notFound('Journey not found');
  }

  if (journeyDoc.status !== 'completed') {
    throw ApiError.badRequest('You can only review companions after the journey is completed');
  }

  const participants = journeyDoc.participantIds();

  if (!participants.includes(req.user._id.toString())) {
    throw ApiError.forbidden('You must be a participant of the journey to leave a review');
  }

  if (!participants.includes(reviewedUser.toString())) {
    throw ApiError.badRequest('The reviewed user must be a participant of the journey');
  }

  if (!(await User.exists({ _id: reviewedUser }))) {
    throw ApiError.notFound('The user you are reviewing no longer exists');
  }

  // The unique index is the real guarantee, but checking here turns the race
  // window during index creation into a clean 409 instead of a duplicate row.
  if (await Review.exists({ reviewer: req.user._id, reviewedUser, journey })) {
    throw ApiError.conflict('You have already reviewed this person for this journey');
  }

  const review = await Review.create({
    reviewer: req.user._id,
    reviewedUser,
    journey,
    rating,
    comment,
  });

  // Keep the denormalised rating on the user document in step with the reviews.
  await Review.syncUserRating(reviewedUser);

  const populated = await Review.findById(review._id)
    .populate('reviewer', USER_FIELDS)
    .populate('reviewedUser', USER_FIELDS)
    .populate('journey', JOURNEY_FIELDS);

  res.status(201).json(populated);
});

// @desc    Reviews written about a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewedUser: req.params.userId })
    .populate('reviewer', USER_FIELDS)
    .populate('journey', JOURNEY_FIELDS)
    .sort({ createdAt: -1 });

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);

  res.json({
    reviews,
    averageRating: reviews.length ? Math.round((totalRating / reviews.length) * 10) / 10 : 0,
    totalReviews: reviews.length,
  });
});

// @desc    Reviews written by a user
// @route   GET /api/reviews/by-user/:userId
// @access  Public
const getReviewsByUser = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewer: req.params.userId })
    .populate('reviewedUser', USER_FIELDS)
    .populate('journey', JOURNEY_FIELDS)
    .sort({ createdAt: -1 });

  res.json(reviews);
});

// @desc    Reviews attached to a journey
// @route   GET /api/reviews/journey/:journeyId
// @access  Public
const getJourneyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ journey: req.params.journeyId })
    .populate('reviewer', USER_FIELDS)
    .populate('reviewedUser', USER_FIELDS)
    .sort({ createdAt: -1 });

  res.json(reviews);
});

// @desc    Delete your own review
// @route   DELETE /api/reviews/:id
// @access  Private (author only)
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    throw ApiError.notFound('Review not found');
  }

  if (review.reviewer.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to delete this review');
  }

  const { reviewedUser } = review;

  await review.deleteOne();
  await Review.syncUserRating(reviewedUser);

  res.json({ message: 'Review removed', _id: review._id });
});

module.exports = {
  createReview,
  getUserReviews,
  getReviewsByUser,
  getJourneyReviews,
  deleteReview,
};
