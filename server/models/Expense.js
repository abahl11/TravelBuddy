// server/models/Expense.js
const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // For 'equal' and 'exact' this is a currency amount; for 'percentage', a percent.
    share: {
      type: Number,
      required: true,
      min: [0, 'A share cannot be negative'],
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paidAt: Date,
  },
  { _id: false }
);

const ExpenseSchema = new mongoose.Schema(
  {
    journey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [140, 'Description must be at most 140 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP'],
    },
    category: {
      type: String,
      enum: ['transportation', 'accommodation', 'food', 'activities', 'other'],
      default: 'other',
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    participants: {
      type: [ParticipantSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'An expense needs at least one participant',
      },
    },
    splitType: {
      type: String,
      enum: ['equal', 'exact', 'percentage'],
      default: 'equal',
    },
    status: {
      type: String,
      enum: ['active', 'settled', 'cancelled'],
      default: 'active',
    },
    receipt: {
      type: String, // URL to an uploaded receipt image
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes must be at most 500 characters'],
    },
  },
  { timestamps: true }
);

ExpenseSchema.index({ journey: 1, date: -1 });
ExpenseSchema.index({ paidBy: 1 });
ExpenseSchema.index({ 'participants.user': 1 });

/**
 * What a single participant owes for this expense, in the expense's currency.
 * Centralised here so the summary endpoint and any future report agree.
 */
ExpenseSchema.methods.shareFor = function shareFor(participant) {
  if (this.splitType === 'equal') {
    return this.amount / this.participants.length;
  }

  if (this.splitType === 'percentage') {
    return (this.amount * participant.share) / 100;
  }

  return participant.share; // 'exact'
};

module.exports = mongoose.model('Expense', ExpenseSchema);
