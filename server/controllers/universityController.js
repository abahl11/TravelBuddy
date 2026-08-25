// server/controllers/universityController.js
const University = require('../models/University');
const ApiError = require('../middleware/apiError');
const asyncHandler = require('../middleware/asyncHandler');

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    List universities, optionally filtered by name
// @route   GET /api/universities
// @access  Public
const getUniversities = asyncHandler(async (req, res) => {
  const { name } = req.query;
  const query = name ? { name: { $regex: escapeRegex(name), $options: 'i' } } : {};

  const universities = await University.find(query).sort({ name: 1 }).limit(100);

  res.json(universities);
});

// @desc    Add a university
// @route   POST /api/universities
// @access  Private/Admin
const addUniversity = asyncHandler(async (req, res) => {
  const { name, location, website, verificationEmail } = req.body;

  if (!name?.trim()) {
    throw ApiError.badRequest('Name is required');
  }

  if (await University.exists({ name: name.trim() })) {
    throw ApiError.conflict('That university already exists');
  }

  const university = await University.create({
    name: name.trim(),
    location,
    website,
    verificationEmail,
  });

  res.status(201).json(university);
});

module.exports = {
  getUniversities,
  addUniversity,
};
