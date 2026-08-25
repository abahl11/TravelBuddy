// server/controllers/userController.js
const User = require('../models/User');
const Review = require('../models/Review');
const ApiError = require('../middleware/apiError');
const asyncHandler = require('../middleware/asyncHandler');
const { generateToken } = require('../utils/tokenUtils');
const { validatePassword } = require('../utils/validationUtils');

const withToken = (user) => ({ ...user.toPublicJSON(), token: generateToken(user._id) });

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, fullName, university, hometown } = req.body;

  if (!username || !email || !password || !fullName || !university || !hometown) {
    throw ApiError.badRequest('All fields are required');
  }

  const { isValid, message } = validatePassword(password);
  if (!isValid) {
    throw ApiError.badRequest(message);
  }

  const existing = await User.findOne({
    $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }],
  });

  if (existing) {
    const field = existing.email === email.toLowerCase().trim() ? 'email' : 'username';
    throw ApiError.conflict(`An account with that ${field} already exists`);
  }

  const user = await User.create({
    username,
    email,
    password,
    fullName,
    university,
    hometown,
  });

  res.status(201).json(withToken(user));
});

// @desc    Authenticate a user and return a token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest('Email and password are required');
  }

  // `password` is select:false on the schema, so ask for it explicitly.
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  // One message for both cases so the response cannot be used to enumerate accounts.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  res.json(withToken(user));
});

// @desc    Get the signed-in user's profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  res.json(req.user.toPublicJSON());
});

// @desc    Update the signed-in user's profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const { username, email, fullName, university, hometown, bio, profilePicture, contactNumber, password } =
    req.body;

  // Username and email are unique — check before saving for a clear message.
  if (username && username.trim() !== user.username) {
    if (await User.exists({ username: username.trim(), _id: { $ne: user._id } })) {
      throw ApiError.conflict('That username is already taken');
    }
    user.username = username.trim();
  }

  if (email && email.toLowerCase().trim() !== user.email) {
    if (await User.exists({ email: email.toLowerCase().trim(), _id: { $ne: user._id } })) {
      throw ApiError.conflict('That email is already registered');
    }
    user.email = email;
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (university !== undefined) user.university = university;
  if (hometown !== undefined) user.hometown = hometown;
  // These may legitimately be cleared, so accept empty strings.
  if (bio !== undefined) user.bio = bio;
  if (profilePicture !== undefined) user.profilePicture = profilePicture;
  if (contactNumber !== undefined) user.contactNumber = contactNumber;

  if (password) {
    const { isValid, message } = validatePassword(password);
    if (!isValid) {
      throw ApiError.badRequest(message);
    }
    user.password = password;
  }

  const updated = await user.save();

  res.json(withToken(updated));
});

// @desc    Get a public user profile
// @route   GET /api/users/:id
// @access  Public
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const { email, contactNumber, ...publicProfile } = user.toPublicJSON();
  const reviews = await Review.find({ reviewedUser: user._id })
    .populate('reviewer', 'username fullName profilePicture')
    .populate('journey', 'origin destination departureDate')
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ ...publicProfile, reviews });
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUserById,
};
