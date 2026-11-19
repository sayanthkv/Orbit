import api from './client';

export const goalApi = {
  getGoals: () => api.get('/goals'),
  createGoal: (data) => api.post('/goals', data),
  updateGoal: (id, data) => api.put(`/goals/${id}`, data),
  deposit: (id, amount) => api.post(`/goals/${id}/deposit`, { amount }),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
};
