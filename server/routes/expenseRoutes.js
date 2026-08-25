// server/routes/expenseRoutes.js
const express = require('express');

const {
  createExpense,
  getJourneyExpenses,
  getJourneyExpenseSummary,
  settleExpense,
  deleteExpense,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');
const validateObjectId = require('../middleware/validateObjectId');

const router = express.Router();

router.use(protect);

router.post('/', createExpense);
router.get('/journey/:journeyId', validateObjectId('journeyId'), getJourneyExpenses);
router.get('/journey/:journeyId/summary', validateObjectId('journeyId'), getJourneyExpenseSummary);
router.put('/:id/settle', validateObjectId('id'), settleExpense);
router.delete('/:id', validateObjectId('id'), deleteExpense);

module.exports = router;
