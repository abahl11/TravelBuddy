// server/controllers/messageController.js
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const ApiError = require('../middleware/apiError');
const asyncHandler = require('../middleware/asyncHandler');

const USER_FIELDS = 'username fullName profilePicture university';

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { recipient, content, journey } = req.body;

  if (!recipient || !content?.trim()) {
    throw ApiError.badRequest('Recipient and content are required');
  }

  if (recipient.toString() === req.user._id.toString()) {
    throw ApiError.badRequest('You cannot message yourself');
  }

  if (!mongoose.Types.ObjectId.isValid(recipient)) {
    throw ApiError.badRequest('Invalid recipient');
  }

  if (!(await User.exists({ _id: recipient }))) {
    throw ApiError.notFound('Recipient not found');
  }

  const message = await Message.create({
    sender: req.user._id,
    recipient,
    content: content.trim(),
    journey: journey || null,
  });

  const populated = await Message.findById(message._id)
    .populate('sender', USER_FIELDS)
    .populate('recipient', USER_FIELDS);

  res.status(201).json(populated);
});

// @desc    List the signed-in user's conversations, most recent first
// @route   GET /api/messages
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const conversations = await Message.aggregate([
    { $match: { $or: [{ sender: userId }, { recipient: userId }] } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        // Group both directions of a pair under the other person's id.
        _id: { $cond: [{ $eq: ['$sender', userId] }, '$recipient', '$sender'] },
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$recipient', userId] }, { $eq: ['$read', false] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    { $limit: 50 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        unreadCount: 1,
        'lastMessage.content': 1,
        'lastMessage.createdAt': 1,
        'lastMessage.sender': 1,
        'lastMessage.read': 1,
        'user._id': 1,
        'user.username': 1,
        'user.fullName': 1,
        'user.profilePicture': 1,
        'user.university': 1,
      },
    },
  ]);

  res.json(conversations);
});

// @desc    Number of unread messages
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.countDocuments({ recipient: req.user._id, read: false });

  res.json({ count });
});

// @desc    The conversation between the signed-in user and another user
// @route   GET /api/messages/:userId
// @access  Private
const getMessagesByUser = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, recipient: otherUserId },
      { sender: otherUserId, recipient: req.user._id },
    ],
  })
    .populate('sender', USER_FIELDS)
    .populate('recipient', USER_FIELDS)
    .populate('journey', 'origin destination')
    .sort({ createdAt: 1 })
    .limit(200);

  // Opening a conversation reads it.
  await Message.updateMany(
    { sender: otherUserId, recipient: req.user._id, read: false },
    { $set: { read: true } }
  );

  res.json(messages);
});

// @desc    Mark one message as read
// @route   PUT /api/messages/:id/read
// @access  Private (recipient only)
const markMessageAsRead = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    throw ApiError.notFound('Message not found');
  }

  if (message.recipient.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Not authorized');
  }

  message.read = true;
  await message.save();

  res.json(message);
});

module.exports = {
  sendMessage,
  getConversations,
  getUnreadCount,
  getMessagesByUser,
  markMessageAsRead,
};
