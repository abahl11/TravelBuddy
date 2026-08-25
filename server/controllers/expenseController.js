// server/controllers/expenseController.js
const Expense = require('../models/Expense');
const Journey = require('../models/Journey');
const ApiError = require('../middleware/apiError');
const asyncHandler = require('../middleware/asyncHandler');

const PARTICIPANT_FIELDS = 'username fullName profilePicture';

// Money never balances to the cent with floating point; treat this as zero.
const EPSILON = 0.01;

const round2 = (value) => Math.round(value * 100) / 100;

const populateExpense = (query) =>
  query.populate('paidBy', PARTICIPANT_FIELDS).populate('participants.user', PARTICIPANT_FIELDS);

/**
 * Loads a journey and asserts the signed-in user travels on it. Expenses expose
 * who owes whom, so every expense route is gated on participation.
 */
const loadJourneyAsParticipant = async (journeyId, user) => {
  const journey = await Journey.findById(journeyId)
    .populate('creator', PARTICIPANT_FIELDS)
    .populate('companions.user', PARTICIPANT_FIELDS);

  if (!journey) {
    throw ApiError.notFound('Journey not found');
  }

  if (!journey.participantIds().includes(user._id.toString())) {
    throw ApiError.forbidden('You must be a participant of this journey to view its expenses');
  }

  return journey;
};

/**
 * Validates the participant list against the journey and the chosen split,
 * returning the rows to persist.
 */
const buildParticipants = (participants, splitType, amount, journeyParticipantIds) => {
  if (!Array.isArray(participants) || participants.length === 0) {
    throw ApiError.badRequest('Select at least one participant to split this expense with');
  }

  const seen = new Set();

  const rows = participants.map((participant) => {
    const userId = participant?.user;

    if (!userId) {
      throw ApiError.badRequest('Each participant must have a user');
    }

    const id = userId.toString();

    if (!journeyParticipantIds.includes(id)) {
      throw ApiError.badRequest('Some participants are not part of this journey');
    }

    if (seen.has(id)) {
      throw ApiError.badRequest('The same participant was listed twice');
    }

    seen.add(id);

    if (splitType === 'equal') {
      return { user: id, share: round2(amount / participants.length), paid: false };
    }

    const share = Number(participant.share);

    if (!Number.isFinite(share) || share < 0) {
      throw ApiError.badRequest('Every participant needs a valid share for this split type');
    }

    return { user: id, share, paid: false };
  });

  // A split that does not add up produces a silently wrong settlement plan.
  if (splitType === 'exact') {
    const total = rows.reduce((sum, row) => sum + row.share, 0);

    if (Math.abs(total - amount) > EPSILON) {
      throw ApiError.badRequest(
        `Exact shares add up to ${round2(total)}, but the expense is ${round2(amount)}`
      );
    }
  }

  if (splitType === 'percentage') {
    const total = rows.reduce((sum, row) => sum + row.share, 0);

    if (Math.abs(total - 100) > EPSILON) {
      throw ApiError.badRequest(`Percentages must add up to 100, but they add up to ${round2(total)}`);
    }
  }

  return rows;
};

// @desc    Add an expense to a journey
// @route   POST /api/expenses
// @access  Private (journey participants)
const createExpense = asyncHandler(async (req, res) => {
  const { journey, description, amount, currency, category, date, participants, splitType, notes } =
    req.body;

  if (!journey) {
    throw ApiError.badRequest('A journey is required');
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw ApiError.badRequest('Amount must be a number greater than zero');
  }

  const journeyDoc = await loadJourneyAsParticipant(journey, req.user);
  const split = splitType || 'equal';
  const rows = buildParticipants(participants, split, numericAmount, journeyDoc.participantIds());

  // Whoever paid does not owe themselves — mark their own share settled up front.
  const payerId = req.user._id.toString();
  for (const row of rows) {
    if (row.user === payerId) {
      row.paid = true;
      row.paidAt = new Date();
    }
  }

  // A single insert is atomic on its own; no transaction (and therefore no
  // replica-set requirement) is needed here.
  const expense = await Expense.create({
    journey,
    description,
    amount: numericAmount,
    currency,
    category,
    paidBy: req.user._id,
    date: date || new Date(),
    participants: rows,
    splitType: split,
    notes,
    status: 'active',
  });

  const populated = await populateExpense(Expense.findById(expense._id));

  res.status(201).json(populated);
});

// @desc    List a journey's expenses
// @route   GET /api/expenses/journey/:journeyId
// @access  Private (journey participants)
const getJourneyExpenses = asyncHandler(async (req, res) => {
  await loadJourneyAsParticipant(req.params.journeyId, req.user);

  const expenses = await populateExpense(Expense.find({ journey: req.params.journeyId })).sort({
    date: -1,
  });

  res.json(expenses);
});

// @desc    Balances and a settlement plan for a journey
// @route   GET /api/expenses/journey/:journeyId/summary
// @access  Private (journey participants)
const getJourneyExpenseSummary = asyncHandler(async (req, res) => {
  const journey = await loadJourneyAsParticipant(req.params.journeyId, req.user);
  const expenses = await Expense.find({ journey: req.params.journeyId, status: 'active' });

  const people = [journey.creator, ...journey.companions.filter((c) => c.status === 'accepted').map((c) => c.user)]
    .filter(Boolean);

  const balances = new Map(
    people.map((person) => [
      person._id.toString(),
      {
        user: {
          _id: person._id,
          username: person.username,
          fullName: person.fullName,
          profilePicture: person.profilePicture,
        },
        paid: 0,
        owes: 0,
        netBalance: 0,
      },
    ])
  );

  // A participant may have left the journey after an expense was recorded;
  // keep them in the summary rather than dropping their share.
  const ensure = (id) => {
    if (!balances.has(id)) {
      balances.set(id, {
        user: { _id: id, username: 'Former companion', fullName: 'Former companion', profilePicture: '' },
        paid: 0,
        owes: 0,
        netBalance: 0,
      });
    }
    return balances.get(id);
  };

  for (const expense of expenses) {
    ensure(expense.paidBy.toString()).paid += expense.amount;

    for (const participant of expense.participants) {
      ensure(participant.user.toString()).owes += expense.shareFor(participant);
    }
  }

  for (const balance of balances.values()) {
    balance.paid = round2(balance.paid);
    balance.owes = round2(balance.owes);
    balance.netBalance = round2(balance.paid - balance.owes);
  }

  const rows = [...balances.values()];

  // Greedy settlement: largest debtor pays largest creditor until everyone is flat.
  const debtors = rows.filter((b) => b.netBalance < -EPSILON).map((b) => ({ ...b }));
  const creditors = rows.filter((b) => b.netBalance > EPSILON).map((b) => ({ ...b }));

  debtors.sort((a, b) => a.netBalance - b.netBalance);
  creditors.sort((a, b) => b.netBalance - a.netBalance);

  const settlements = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = round2(Math.min(-debtor.netBalance, creditor.netBalance));

    if (amount > EPSILON) {
      settlements.push({ from: debtor.user, to: creditor.user, amount });
    }

    debtor.netBalance = round2(debtor.netBalance + amount);
    creditor.netBalance = round2(creditor.netBalance - amount);

    // Advance past anyone who is settled. Without both guards a rounding
    // remainder below EPSILON would spin this loop forever.
    if (Math.abs(debtor.netBalance) < EPSILON) i += 1;
    if (Math.abs(creditor.netBalance) < EPSILON) j += 1;
    if (amount <= EPSILON) break;
  }

  res.json({
    totalExpenses: round2(expenses.reduce((sum, expense) => sum + expense.amount, 0)),
    currency: expenses[0]?.currency || 'INR',
    balances: rows,
    settlements,
    expenseCount: expenses.length,
  });
});

// @desc    Mark your share of an expense as paid
// @route   PUT /api/expenses/:id/settle
// @access  Private (participants of the expense)
const settleExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    throw ApiError.notFound('Expense not found');
  }

  const userId = req.user._id.toString();
  const participant = expense.participants.find((p) => p.user.toString() === userId);

  if (!participant) {
    throw ApiError.forbidden('You are not part of this expense');
  }

  if (participant.paid) {
    throw ApiError.badRequest('You have already settled your share');
  }

  participant.paid = true;
  participant.paidAt = new Date();

  if (expense.participants.every((p) => p.paid)) {
    expense.status = 'settled';
  }

  await expense.save();

  const populated = await populateExpense(Expense.findById(expense._id));

  res.json(populated);
});

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (whoever paid)
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (!expense) {
    throw ApiError.notFound('Expense not found');
  }

  if (expense.paidBy.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the person who paid can delete this expense');
  }

  await expense.deleteOne();

  res.json({ message: 'Expense removed', _id: expense._id });
});

module.exports = {
  createExpense,
  getJourneyExpenses,
  getJourneyExpenseSummary,
  settleExpense,
  deleteExpense,
};
