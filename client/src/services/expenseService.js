import api from '../api/client';

const createExpense = async (expenseData) => {
  const { data } = await api.post('/expenses', expenseData);
  return data;
};

const getJourneyExpenses = async (journeyId) => {
  const { data } = await api.get(`/expenses/journey/${journeyId}`);
  return data;
};

const getJourneyExpenseSummary = async (journeyId) => {
  const { data } = await api.get(`/expenses/journey/${journeyId}/summary`);
  return data;
};

const settleExpense = async (expenseId) => {
  const { data } = await api.put(`/expenses/${expenseId}/settle`);
  return data;
};

const deleteExpense = async (expenseId) => {
  const { data } = await api.delete(`/expenses/${expenseId}`);
  return data;
};

const expenseService = {
  createExpense,
  getJourneyExpenses,
  getJourneyExpenseSummary,
  settleExpense,
  deleteExpense,
};

export default expenseService;
