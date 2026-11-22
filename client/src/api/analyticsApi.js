import api from './client';

const cleanParams = (params) => {
  if (!params) return {};
  const cleaned = {};
  Object.keys(params).forEach((key) => {
    const val = params[key];
    if (val !== '' && val !== null && val !== undefined) {
      cleaned[key] = val;
    }
  });
  return cleaned;
};

export const analyticsApi = {
  getSummary: (month, year, accountId) =>
    api.get('/analytics/summary', {
      params: cleanParams({ month, year, accountId: accountId && accountId !== 'all' ? accountId : undefined }),
    }),
  getCategoryBreakdown: (month, year, type = 'expense', accountId) =>
    api.get('/analytics/category-breakdown', {
      params: cleanParams({ month, year, type, accountId: accountId && accountId !== 'all' ? accountId : undefined }),
    }),
  getTrends: (month, year, accountId) =>
    api.get('/analytics/trends', {
      params: cleanParams({ month, year, accountId: accountId && accountId !== 'all' ? accountId : undefined }),
    }),
  getInsights: (month, year, accountId) =>
    api.get('/analytics/insights', {
      params: cleanParams({ month, year, accountId: accountId && accountId !== 'all' ? accountId : undefined }),
    }),
  getSmartInsights: (month, year, accountId) =>
    api.get('/analytics/insights', {
      params: cleanParams({ month, year, accountId: accountId && accountId !== 'all' ? accountId : undefined }),
    }),
};

export default analyticsApi;
