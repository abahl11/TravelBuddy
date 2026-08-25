// server/models/Message.js
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    journey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      default: null,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [2000, 'A message must be at most 2000 characters'],
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Drives the conversation view (both directions of a pair, newest first).
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model('Message', MessageSchema);
