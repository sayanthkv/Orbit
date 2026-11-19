import api from './client';

export const budgetApi = {
  getBudgets: (month, year) => api.get('/budgets', { params: { month, year } }),
  setBudget: (data) => api.post('/budgets', data),
  deleteBudget: (id) => api.delete(`/budgets/${id}`),
};
