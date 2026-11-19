import { CURRENCY_SYMBOLS } from './constants';

export const formatCurrency = (amount, currency = 'INR') => {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const num = Number(amount) || 0;

  if (currency === 'INR') {
    // Format Indian number system (e.g. 1,00,000)
    return `${symbol} ${num.toLocaleString('en-IN', {
      minimumFractionDigits: num % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${symbol} ${num.toLocaleString('en-US', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: options.month || 'short',
    day: options.day || 'numeric',
    year: options.year || 'numeric',
    ...options,
  });
};

export const getMonthName = (monthNumber) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[(monthNumber - 1) % 12];
};
