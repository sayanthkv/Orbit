import api from './client';

export const analyticsApi = {
  getSummary: (month, year) => api.get('/analytics/summary', { params: { month, year } }),
  getCategoryBreakdown: (month, year, type = 'expense') =>
    api.get('/analytics/category-breakdown', { params: { month, year, type } }),
  getTrends: (month, year) => api.get('/analytics/trends', { params: { month, year } }),
  getInsights: (month, year) => api.get('/analytics/insights', { params: { month, year } }),
};
