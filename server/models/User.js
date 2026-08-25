// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
      match: [
        /^[a-zA-Z0-9._-]+$/,
        'Username may only contain letters, numbers, dots, underscores and hyphens',
      ],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never reaches the client unless explicitly selected
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [80, 'Full name must be at most 80 characters'],
    },
    university: {
      type: String,
      required: [true, 'University is required'],
      trim: true,
    },
    hometown: {
      type: String,
      required: [true, 'Hometown is required'],
      trim: true,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    bio: {
      type: String,
      default: '',
      maxlength: [500, 'Bio must be at most 500 characters'],
    },
    profilePicture: {
      type: String,
      default: '',
    },
    contactNumber: {
      type: String,
      default: '',
      trim: true,
    },
    verificationStatus: {
      type: Boolean,
      default: false,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

UserSchema.index({ university: 1 });

UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/** The shape the client is allowed to see. */
UserSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    _id: this._id,
    username: this.username,
    email: this.email,
    fullName: this.fullName,
    university: this.university,
    hometown: this.hometown,
    bio: this.bio,
    profilePicture: this.profilePicture,
    contactNumber: this.contactNumber,
    isAdmin: this.isAdmin,
    averageRating: this.averageRating,
    reviewCount: this.reviewCount,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', UserSchema);
