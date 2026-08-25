// server/routes/journeyRoutes.js
const express = require('express');

const {
  createJourney,
  getJourneys,
  getJourneyById,
  updateJourney,
  deleteJourney,
  joinJourney,
  respondToJoinRequest,
  completeJourney,
  cancelJourney,
  getNearbyJourneys,
  getJourneysAlongRoute,
  getJourneysIntersectingArea,
  getUniversityJourneys,
} = require('../controllers/journeyController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

// Literal paths must be declared before '/:id', or they are swallowed by it.
router.get('/nearby', getNearbyJourneys);
router.get('/along-route', getJourneysAlongRoute);
router.get('/university', protect, getUniversityJourneys);
router.post('/intersect-area', getJourneysIntersectingArea); // needs a body, so POST

router.route('/').get(optionalAuth, getJourneys).post(protect, createJourney);

router
  .route('/:id')
  .get(validateObjectId('id'), optionalAuth, getJourneyById)
  .put(validateObjectId('id'), protect, updateJourney)
  .delete(validateObjectId('id'), protect, deleteJourney);

router.put('/:id/complete', validateObjectId('id'), protect, completeJourney);
router.put('/:id/cancel', validateObjectId('id'), protect, cancelJourney);
router.post('/:id/join', validateObjectId('id'), protect, joinJourney);
router.put('/:id/companions/:userId', validateObjectId('id', 'userId'), protect, respondToJoinRequest);

module.exports = router;
