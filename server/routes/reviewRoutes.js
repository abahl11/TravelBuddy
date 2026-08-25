// server/routes/reviewRoutes.js
const express = require('express');

const {
  createReview,
  getUserReviews,
  getReviewsByUser,
  getJourneyReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.post('/', protect, createReview);
router.get('/user/:userId', validateObjectId('userId'), getUserReviews);
router.get('/by-user/:userId', validateObjectId('userId'), getReviewsByUser);
router.get('/journey/:journeyId', validateObjectId('journeyId'), getJourneyReviews);
router.delete('/:id', validateObjectId('id'), protect, deleteReview);

module.exports = router;
