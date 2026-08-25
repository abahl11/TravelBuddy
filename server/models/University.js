// server/models/University.js
const mongoose = require('mongoose');

const UniversitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
    },
    location: {
      city: { type: String, required: [true, 'City is required'], trim: true },
      state: { type: String, required: [true, 'State is required'], trim: true },
      country: { type: String, required: [true, 'Country is required'], trim: true },
    },
    website: {
      type: String,
      trim: true,
    },
    verificationEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('University', UniversitySchema);
