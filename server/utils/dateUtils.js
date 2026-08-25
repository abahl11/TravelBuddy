// server/utils/dateUtils.js

/**
 * @param {Date|string} date
 * @returns {boolean} True when the date falls before today.
 */
const isDateInPast = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return new Date(date) < today;
};

/**
 * @param {Date|string} date
 * @returns {string} e.g. "Mon, Jan 5, 2026"
 */
const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

/**
 * @param {Date|string} date
 * @param {number} daysBefore
 * @param {number} daysAfter
 * @returns {{ startDate: Date, endDate: Date }} Inclusive range around `date`.
 */
const getDateRange = (date, daysBefore = 1, daysAfter = 1) => {
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - daysBefore);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + daysAfter);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
};

module.exports = { isDateInPast, formatDate, getDateRange };
