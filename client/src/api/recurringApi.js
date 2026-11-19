import api from './client';

export const recurringApi = {
  getRules: () => api.get('/recurring'),
  createRule: (data) => api.post('/recurring', data),
  updateRule: (id, data) => api.put(`/recurring/${id}`, data),
  deleteRule: (id) => api.delete(`/recurring/${id}`),
  triggerProcess: () => api.post('/recurring/process'),
};
