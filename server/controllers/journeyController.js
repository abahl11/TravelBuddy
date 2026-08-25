// server/controllers/journeyController.js
const mongoose = require('mongoose');
const Journey = require('../models/Journey');
const Expense = require('../models/Expense');
const Message = require('../models/Message');
const Review = require('../models/Review');
const ApiError = require('../middleware/apiError');
const asyncHandler = require('../middleware/asyncHandler');
const { sendJourneyRequestEmail } = require('../utils/emailUtils');

const EARTH_RADIUS_KM = 6378.1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const CREATOR_FIELDS = 'username fullName profilePicture university averageRating reviewCount';
const COMPANION_FIELDS = 'username fullName profilePicture university';

const populateJourney = (query) =>
  query.populate('creator', CREATOR_FIELDS).populate('companions.user', COMPANION_FIELDS);

/**
 * Accepts `{ lat, lng }` from the client and returns a GeoJSON Point, or null
 * when coordinates were not supplied. Throws on values that are present but
 * unusable, so a bad payload is a 400 rather than a corrupt document.
 */
const toGeoPoint = (coords, label) => {
  if (coords === undefined || coords === null || coords === '') return null;

  const lat = Number(coords.lat);
  const lng = Number(coords.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw ApiError.badRequest(`${label} coordinates must include numeric lat and lng`);
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw ApiError.badRequest(`${label} coordinates are out of range`);
  }

  return { type: 'Point', coordinates: [lng, lat] };
};

/** A circle usable alongside sort(), unlike $near which forces distance order. */
const withinRadius = (lng, lat, radiusKm) => ({
  $geoWithin: { $centerSphere: [[lng, lat], radiusKm / EARTH_RADIUS_KM] },
});

const parseCoordPair = (lat, lng, radius) => {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    throw ApiError.badRequest('Valid lat and lng query parameters are required');
  }

  const parsedRadius = Number(radius);

  return {
    lat: parsedLat,
    lng: parsedLng,
    radiusKm: Number.isFinite(parsedRadius) && parsedRadius > 0 ? Math.min(parsedRadius, 2000) : 50,
  };
};

const parseLimit = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.floor(parsed), MAX_LIMIT);
};

// Escapes user input before it is used inside a $regex.
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Create a new journey
// @route   POST /api/journeys
// @access  Private
const createJourney = asyncHandler(async (req, res) => {
  const {
    origin,
    originCoords,
    destination,
    destinationCoords,
    departureDate,
    returnDate,
    transportMode,
    estimatedCost,
    maxCompanions,
    description,
    visibility,
  } = req.body;

  if (!origin || !destination || !departureDate || !transportMode) {
    throw ApiError.badRequest('Origin, destination, departure date and transport mode are required');
  }

  const originPoint = toGeoPoint(originCoords, 'Origin');
  const destinationPoint = toGeoPoint(destinationCoords, 'Destination');

  const journeyData = {
    creator: req.user._id,
    creatorUniversity: req.user.university,
    origin,
    destination,
    departureDate,
    returnDate: returnDate || null,
    transportMode,
    estimatedCost: estimatedCost === '' || estimatedCost === undefined ? null : Number(estimatedCost),
    maxCompanions: maxCompanions ? Number(maxCompanions) : 4,
    description: description || '',
    status: 'open',
    visibility: visibility || 'public',
  };

  if (originPoint) journeyData.originCoords = originPoint;
  if (destinationPoint) journeyData.destinationCoords = destinationPoint;

  // The route is only meaningful when both ends are known.
  if (originPoint && destinationPoint) {
    journeyData.route = {
      type: 'LineString',
      coordinates: [originPoint.coordinates, destinationPoint.coordinates],
    };
  }

  const journey = await Journey.create(journeyData);
  const populated = await populateJourney(Journey.findById(journey._id));

  res.status(201).json(populated);
});

// @desc    List journeys with optional filters
// @route   GET /api/journeys
// @access  Public
const getJourneys = asyncHandler(async (req, res) => {
  const {
    destination,
    lat,
    lng,
    radius,
    departureDate,
    university,
    creator,
    companion,
    transportMode,
    status,
    includePast,
    limit,
  } = req.query;

  const query = {};

  // Coordinates give a real proximity search; free text is the fallback.
  if (lat && lng) {
    const point = parseCoordPair(lat, lng, radius);
    query.destinationCoords = withinRadius(point.lng, point.lat, point.radiusKm);
  } else if (destination) {
    query.destination = { $regex: escapeRegex(destination), $options: 'i' };
  }

  if (departureDate) {
    const start = new Date(departureDate);

    if (Number.isNaN(start.getTime())) {
      throw ApiError.badRequest('Invalid departureDate');
    }

    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    query.departureDate = { $gte: start, $lt: end };
  } else if (includePast !== 'true' && !creator && !companion) {
    // Browsing should not surface trips that have already left.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    query.departureDate = { $gte: today };
  }

  if (university) {
    query.creatorUniversity = { $regex: escapeRegex(university), $options: 'i' };
  }

  if (transportMode) {
    query.transportMode = transportMode;
  }

  if (creator) {
    if (!mongoose.Types.ObjectId.isValid(creator)) {
      throw ApiError.badRequest('Invalid creator id');
    }
    query.creator = creator;
  }

  if (companion) {
    if (!mongoose.Types.ObjectId.isValid(companion)) {
      throw ApiError.badRequest('Invalid companion id');
    }
    query.companions = { $elemMatch: { user: companion } };
  }

  if (status) {
    query.status = status;
  } else if (!creator && !companion) {
    // A dashboard wants every trip it owns; browsing only wants joinable ones.
    query.status = { $in: ['open', 'full'] };
  }

  // Private journeys are only ever visible to their creator.
  if (!creator) {
    const visibilityFilter = [{ visibility: { $ne: 'private' } }];
    if (req.user) visibilityFilter.push({ creator: req.user._id });
    query.$or = visibilityFilter;
  }

  const journeys = await populateJourney(Journey.find(query))
    .sort({ departureDate: 1 })
    .limit(parseLimit(limit));

  res.json(journeys);
});

// @desc    Get a single journey
// @route   GET /api/journeys/:id
// @access  Public
const getJourneyById = asyncHandler(async (req, res) => {
  const journey = await populateJourney(Journey.findById(req.params.id)).populate(
    'creator',
    `${CREATOR_FIELDS} bio hometown`
  );

  if (!journey) {
    throw ApiError.notFound('Journey not found');
  }

  if (journey.visibility === 'private') {
    const viewerId = req.user?._id?.toString();
    const allowed = viewerId && journey.participantIds().includes(viewerId);

    if (!allowed) {
      throw ApiError.notFound('Journey not found');
    }
  }

  res.json(journey);
});

// @desc    Update a journey
// @route   PUT /api/journeys/:id
// @access  Private (creator only)
const updateJourney = asyncHandler(async (req, res) => {
  const journey = await Journey.findById(req.params.id);

  if (!journey) {
    throw ApiError.notFound('Journey not found');
  }

  if (journey.creator.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to update this journey');
  }

  if (journey.status === 'completed') {
    throw ApiError.badRequest('A completed journey can no longer be edited');
  }

  // Whitelist: `creator`, `companions` and `status` are never client-writable here.
  const editable = [
    'origin',
    'destination',
    'departureDate',
    'returnDate',
    'transportMode',
    'estimatedCost',
    'maxCompanions',
    'description',
    'visibility',
  ];

  for (const field of editable) {
    if (req.body[field] !== undefined) {
      journey[field] = req.body[field] === '' ? null : req.body[field];
    }
  }

  if (req.body.originCoords !== undefined) {
    journey.originCoords = toGeoPoint(req.body.originCoords, 'Origin');
  }

  if (req.body.destinationCoords !== undefined) {
    journey.destinationCoords = toGeoPoint(req.body.destinationCoords, 'Destination');
  }

  if (journey.originCoords?.coordinates?.length && journey.destinationCoords?.coordinates?.length) {
    journey.route = {
      type: 'LineString',
      coordinates: [journey.originCoords.coordinates, journey.destinationCoords.coordinates],
    };
  }

  // Shrinking the trip below the number of people already accepted is a mistake.
  if (journey.acceptedCount > journey.maxCompanions) {
    throw ApiError.badRequest(
      `This journey already has ${journey.acceptedCount} accepted companions`
    );
  }

  journey.syncStatus();
  await journey.save();

  const populated = await populateJourney(Journey.findById(journey._id));

  res.json(populated);
});

// @desc    Delete a journey and everything attached to it
// @route   DELETE /api/journeys/:id
// @access  Private (creator only)
const deleteJourney = asyncHandler(async (req, res) => {
  const journey = await Journey.findById(req.params.id);

  if (!journey) {
    throw ApiError.notFound('Journey not found');
  }

  if (journey.creator.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to delete this journey');
  }

  // Without this the expenses, reviews and messages outlive their journey and
  // surface as broken references elsewhere in the app.
  const reviewedUserIds = await Review.distinct('reviewedUser', { journey: journey._id });

  await Promise.all([
    Expense.deleteMany({ journey: journey._id }),
    Review.deleteMany({ journey: journey._id }),
    Message.updateMany({ journey: journey._id }, { $set: { journey: null } }),
  ]);

  await journey.deleteOne();
  await Promise.all(reviewedUserIds.map((userId) => Review.syncUserRating(userId)));

  res.json({ message: 'Journey removed' });
});

// @desc    Request to join a journey
// @route   POST /api/journeys/:id/join
// @access  Private
const joinJourney = asyncHandler(async (req, res) => {
  const journey = await Journey.findById(req.params.id).populate('creator', 'email fullName');

  if (!journey) {
    throw ApiError.notFound('Journey not found');
  }

  if (journey.creator._id.toString() === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot join your own journey');
  }

  if (journey.status === 'completed' || journey.status === 'cancelled') {
    throw ApiError.badRequest(`This journey is ${journey.status}`);
  }

  if (journey.status === 'full') {
    throw ApiError.badRequest('This journey is already full');
  }

  if (new Date(journey.departureDate) < new Date()) {
    throw ApiError.badRequest('This journey has already departed');
  }

  const existing = journey.companions.find(
    (companion) => companion.user.toString() === req.user._id.toString()
  );

  if (existing) {
    const wording = {
      pending: 'You have already requested to join this journey',
      accepted: 'You have already joined this journey',
      rejected: 'Your request to join this journey was declined',
    };
    throw ApiError.badRequest(wording[existing.status]);
  }

  journey.companions.push({ user: req.user._id, status: 'pending' });
  await journey.save();

  // A pending request must not change the journey's status; only accepted
  // companions count towards 'full'.
  sendJourneyRequestEmail(journey.creator.email, journey, req.user).catch(() => {
    /* notification failure must not fail the join */
  });

  const populated = await populateJourney(Journey.findById(journey._id));

  res.json(populated);
});

// @desc    Accept or reject a join request
// @route   PUT /api/journeys/:id/companions/:userId
// @access  Private (creator only)
const respondToJoinRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['accepted', 'rejected'].includes(status)) {
    throw ApiError.badRequest('Status must be either accepted or rejected');
  }

  const journey = await Journey.findById(req.params.id);

  if (!journey) {
    throw ApiError.notFound('Journey not found');
  }

  if (journey.creator.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to manage this journey');
  }

  const companion = journey.companions.find((c) => c.user.toString() === req.params.userId);

  if (!companion) {
    throw ApiError.notFound('That user has not requested to join this journey');
  }

  if (status === 'accepted' && companion.status !== 'accepted' && journey.acceptedCount >= journey.maxCompanions) {
    throw ApiError.badRequest('This journey is already full');
  }

  companion.status = status;

  // Rejecting someone frees a seat, so re-open a journey that was full.
  journey.syncStatus();
  await journey.save();

  const populated = await populateJourney(Journey.findById(journey._id));

  res.json(populated);
});

// @desc    Mark a journey completed
// @route   PUT /api/journeys/:id/complete
// @access  Private (creator only)
const completeJourney = asyncHandler(async (req, res) => {
  const journey = await Journey.findById(req.params.id);

  if (!journey) {
    throw ApiError.notFound('Journey not found');
  }

  if (journey.creator.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to complete this journey');
  }

  if (journey.status === 'completed') {
    throw ApiError.badRequest('This journey is already completed');
  }

  if (new Date(journey.departureDate) > new Date()) {
    throw ApiError.badRequest('Cannot mark a future journey as completed');
  }

  journey.status = 'completed';
  await journey.save();

  const populated = await populateJourney(Journey.findById(journey._id));

  res.json(populated);
});

// @desc    Cancel a journey
// @route   PUT /api/journeys/:id/cancel
// @access  Private (creator only)
const cancelJourney = asyncHandler(async (req, res) => {
  const journey = await Journey.findById(req.params.id);

  if (!journey) {
    throw ApiError.notFound('Journey not found');
  }

  if (journey.creator.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized to cancel this journey');
  }

  if (journey.status === 'completed') {
    throw ApiError.badRequest('A completed journey cannot be cancelled');
  }

  journey.status = 'cancelled';
  await journey.save();

  const populated = await populateJourney(Journey.findById(journey._id));

  res.json(populated);
});

// @desc    Journeys starting or ending near a point
// @route   GET /api/journeys/nearby
// @access  Public
const getNearbyJourneys = asyncHandler(async (req, res) => {
  const { lat, lng, radius, limit } = req.query;
  const point = parseCoordPair(lat, lng, radius);
  const circle = withinRadius(point.lng, point.lat, point.radiusKm);

  // $geoWithin (unlike $near) is legal inside $or and composes with sort().
  const journeys = await populateJourney(
    Journey.find({
      status: { $in: ['open', 'full'] },
      visibility: { $ne: 'private' },
      $or: [{ originCoords: circle }, { destinationCoords: circle }],
    })
  )
    .sort({ departureDate: 1 })
    .limit(parseLimit(limit));

  res.json(journeys);
});

// @desc    Journeys whose route passes near a point
// @route   GET /api/journeys/along-route
// @access  Public
const getJourneysAlongRoute = asyncHandler(async (req, res) => {
  const { lat, lng, radius, limit } = req.query;
  const point = parseCoordPair(lat, lng, radius ?? 10);

  const journeys = await populateJourney(
    Journey.find({
      status: { $in: ['open', 'full'] },
      visibility: { $ne: 'private' },
      route: withinRadius(point.lng, point.lat, point.radiusKm),
    })
  )
    .sort({ departureDate: 1 })
    .limit(parseLimit(limit));

  res.json(journeys);
});

// @desc    Journeys whose route crosses a polygon
// @route   POST /api/journeys/intersect-area
// @access  Public
const getJourneysIntersectingArea = asyncHandler(async (req, res) => {
  const { coordinates } = req.body;

  // A GeoJSON polygon is an array of linear rings, each an array of positions.
  const isPolygon =
    Array.isArray(coordinates) &&
    coordinates.length > 0 &&
    coordinates.every(
      (ring) =>
        Array.isArray(ring) &&
        ring.length >= 4 &&
        ring.every((pos) => Array.isArray(pos) && pos.length === 2 && pos.every(Number.isFinite))
    );

  if (!isPolygon) {
    throw ApiError.badRequest('A valid GeoJSON polygon ring array is required');
  }

  const journeys = await populateJourney(
    Journey.find({
      status: { $in: ['open', 'full'] },
      visibility: { $ne: 'private' },
      route: { $geoIntersects: { $geometry: { type: 'Polygon', coordinates } } },
    })
  )
    .sort({ departureDate: 1 })
    .limit(parseLimit(req.query.limit));

  res.json(journeys);
});

// @desc    Journeys created by people at the signed-in user's university
// @route   GET /api/journeys/university
// @access  Private
const getUniversityJourneys = asyncHandler(async (req, res) => {
  if (!req.user.university) {
    throw ApiError.badRequest('Your profile does not have a university set');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const journeys = await populateJourney(
    Journey.find({
      creatorUniversity: { $regex: escapeRegex(req.user.university), $options: 'i' },
      status: { $in: ['open', 'full'] },
      visibility: { $ne: 'private' },
      departureDate: { $gte: today },
    })
  )
    .sort({ departureDate: 1 })
    .limit(parseLimit(req.query.limit));

  res.json(journeys);
});

module.exports = {
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
};
