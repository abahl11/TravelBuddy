const LOCALES = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };

export const CURRENCY_SYMBOLS = { INR: '\u20B9', USD: '$', EUR: '\u20AC', GBP: '\u00A3' };

/**
 * @param {number|string} amount
 * @param {'INR'|'USD'|'EUR'|'GBP'} currency
 * @param {{ maximumFractionDigits?: number }} [options]
 * @returns {string}
 */
export const formatCurrency = (amount, currency = 'INR', options = {}) => {
  const value = Number(amount);

  if (!Number.isFinite(value)) return `${CURRENCY_SYMBOLS[currency] || ''}0`;

  return new Intl.NumberFormat(LOCALES[currency] || 'en-IN', {
    style: 'currency',
    currency: LOCALES[currency] ? currency : 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
};

export default formatCurrency;
