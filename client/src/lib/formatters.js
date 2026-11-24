// Indian number formatting with INR symbol
export const formatCurrency = (amount, options = {}) => {
  const num = Number(amount) || 0;
  const { showSymbol = true, decimalPlaces = 2 } = options;

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(num);

  return showSymbol ? `₹${formatted}` : formatted;
};

// Compact Indian format for chart ticks (e.g. 1.5L, 25K)
export const formatCompactCurrency = (amount) => {
  const num = Math.abs(Number(amount)) || 0;
  const sign = Number(amount) < 0 ? '-' : '';

  if (num >= 10000000) {
    return `${sign}₹${(num / 10000000).toFixed(1)}Cr`;
  }
  if (num >= 100000) {
    return `${sign}₹${(num / 100000).toFixed(1)}L`;
  }
  if (num >= 1000) {
    return `${sign}₹${(num / 1000).toFixed(1)}K`;
  }
  return `${sign}₹${num.toFixed(0)}`;
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const { format = 'medium' } = options;

  if (format === 'short') {
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    });
  }

  if (format === 'input') {
    return date.toISOString().split('T')[0];
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatMonthName = (monthNumber, year) => {
  const date = new Date(Date.UTC(year || 2026, Number(monthNumber) - 1, 1));
  return date.toLocaleString('default', { month: 'long', year: year ? 'numeric' : undefined });
};
