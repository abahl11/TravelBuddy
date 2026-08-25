// server/models/Journey.js
const mongoose = require('mongoose');

/**
 * GeoJSON Point. Coordinates are optional: a journey can be created without map
 * data (for instance when no Maps API key is configured) and simply does not
 * take part in geospatial searches.
 */
const PointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number], // [longitude, latitude]
      validate: {
        validator: (v) =>
          !v ||
          v.length === 0 ||
          (v.length === 2 &&
            v.every(Number.isFinite) &&
            v[0] >= -180 &&
            v[0] <= 180 &&
            v[1] >= -90 &&
            v[1] <= 90),
        message: 'Coordinates must be [longitude, latitude] within valid ranges',
      },
    },
  },
  { _id: false }
);

/**
 * GeoJSON LineString for the origin -> destination path.
 *
 * Declared as a sub-schema rather than an inline object on purpose: an inline
 * object with a defaulted `type` materialises as `{ type: 'LineString' }` even
 * for journeys that have no coordinates, and the 2dsphere index rejects that
 * document outright ("GeoJSON coordinates must be an array"). A sub-schema
 * stays undefined until something is actually assigned to it.
 */
const LineStringSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['LineString'], default: 'LineString' },
    coordinates: {
      type: [[Number]],
      validate: {
        validator: (v) => !v || v.length === 0 || v.every((pair) => pair.length === 2 && pair.every(Number.isFinite)),
        message: 'Route coordinates must be [longitude, latitude] pairs',
      },
    },
  },
  { _id: false }
);

const CompanionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const JourneySchema = new mongoose.Schema(
  {
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalised so a university search does not need a second query.
    creatorUniversity: {
      type: String,
      default: '',
      trim: true,
    },
    origin: {
      type: String,
      required: [true, 'Origin is required'],
      trim: true,
    },
    originCoords: PointSchema,
    destination: {
      type: String,
      required: [true, 'Destination is required'],
      trim: true,
    },
    destinationCoords: PointSchema,
    // Straight line origin -> destination, drawn on the journey map.
    route: LineStringSchema,
    departureDate: {
      type: Date,
      required: [true, 'Departure date is required'],
    },
    returnDate: {
      type: Date,
      default: null,
      validate: {
        validator(value) {
          return !value || !this.departureDate || value >= this.departureDate;
        },
        message: 'Return date cannot be before the departure date',
      },
    },
    transportMode: {
      type: String,
      enum: ['bus', 'train', 'flight', 'car', 'other'],
      required: [true, 'Transport mode is required'],
    },
    estimatedCost: {
      type: Number,
      default: null,
      min: [0, 'Estimated cost cannot be negative'],
    },
    maxCompanions: {
      type: Number,
      default: 4,
      min: [1, 'A journey needs room for at least one companion'],
      max: [20, 'A journey can hold at most 20 companions'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description must be at most 1000 characters'],
    },
    status: {
      type: String,
      enum: ['open', 'full', 'completed', 'cancelled'],
      default: 'open',
    },
    visibility: {
      type: String,
      enum: ['public', 'university', 'private'],
      default: 'public',
    },
    companions: [CompanionSchema],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

JourneySchema.index({ originCoords: '2dsphere' });
JourneySchema.index({ destinationCoords: '2dsphere' });
JourneySchema.index({ route: '2dsphere' });
JourneySchema.index({ departureDate: 1, status: 1 });
JourneySchema.index({ creator: 1 });
JourneySchema.index({ creatorUniversity: 1 });
JourneySchema.index({ 'companions.user': 1 });

// `companions` is absent whenever a Journey is populated with a projection
// (e.g. populate('journey', 'origin destination')). Virtuals still run during
// toJSON, so every accessor here must tolerate that.
JourneySchema.virtual('acceptedCount').get(function acceptedCount() {
  if (!Array.isArray(this.companions)) return 0;

  return this.companions.filter((c) => c.status === 'accepted').length;
});

/**
 * Keeps `status` consistent with the accepted-companion count. Only toggles
 * between open and full; completed and cancelled are set deliberately elsewhere.
 */
JourneySchema.methods.syncStatus = function syncStatus() {
  if (this.status === 'completed' || this.status === 'cancelled') return this;

  this.status = this.acceptedCount >= this.maxCompanions ? 'full' : 'open';

  return this;
};

/** Everyone travelling: the creator plus accepted companions, as id strings. */
JourneySchema.methods.participantIds = function participantIds() {
  if (!this.creator) return [];

  const idOf = (value) => (value._id ? value._id.toString() : value.toString());

  const companionIds = Array.isArray(this.companions)
    ? this.companions.filter((c) => c.status === 'accepted' && c.user).map((c) => idOf(c.user))
    : [];

  return [idOf(this.creator), ...companionIds];
};

module.exports = mongoose.model('Journey', JourneySchema);
