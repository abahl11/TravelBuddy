const isValid = (date) => date instanceof Date && !Number.isNaN(date.getTime());

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return isValid(date) ? date : null;
};

/**
 * @param {Date|string} value
 * @returns {string} e.g. "Mon, 5 Jan 2026"
 */
export const formatDate = (value) => {
  const date = toDate(value);
  if (!date) return '';

  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * @param {Date|string} value
 * @returns {string} e.g. "5 Jan 2026"
 */
export const formatShortDate = (value) => {
  const date = toDate(value);
  if (!date) return '';

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * @param {Date|string} value
 * @returns {string} e.g. "Monday, 5 January 2026"
 */
export const formatLongDate = (value) => {
  const date = toDate(value);
  if (!date) return '';

  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Formats for a <input type="date"> using local time.
 *
 * toISOString() would shift the date by a day for anyone east or west of UTC,
 * which is why the parts are assembled by hand.
 *
 * @param {Date|string} value
 * @returns {string} yyyy-mm-dd
 */
export const formatDateForInput = (value) => {
  const date = toDate(value);
  if (!date) return '';

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
};

/** Today, in the format a date input expects. Used as a `min` for future dates. */
export const todayForInput = () => formatDateForInput(new Date());

/**
 * @param {Date|string} value
 * @returns {string} e.g. "in 3 days", "Tomorrow", "Today", "" when past
 */
export const getDaysUntil = (value) => {
  const date = toDate(value);
  if (!date) return '';

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDay(date) - startOfDay(new Date())) / 86400000);

  if (days < 0) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 30) return `in ${days} days`;

  return '';
};

/**
 * @param {Date|string} value
 * @returns {string} e.g. "2 hours ago"
 */
export const getRelativeTime = (value) => {
  const date = toDate(value);
  if (!date) return '';

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';

  const units = [
    { limit: 3600, divisor: 60, name: 'minute' },
    { limit: 86400, divisor: 3600, name: 'hour' },
    { limit: 604800, divisor: 86400, name: 'day' },
    { limit: 2592000, divisor: 604800, name: 'week' },
    { limit: 31536000, divisor: 2592000, name: 'month' },
    { limit: Infinity, divisor: 31536000, name: 'year' },
  ];

  const unit = units.find((u) => seconds < u.limit);
  const amount = Math.floor(seconds / unit.divisor);

  return `${amount} ${unit.name}${amount === 1 ? '' : 's'} ago`;
};

/**
 * @param {Date|string} value
 * @returns {string} e.g. "4:05 pm"
 */
export const formatTime = (value) => {
  const date = toDate(value);
  if (!date) return '';

  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
};

/** True when the date falls before today. */
export const isPast = (value) => {
  const date = toDate(value);
  if (!date) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return date < today;
};
