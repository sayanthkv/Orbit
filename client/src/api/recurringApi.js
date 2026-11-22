import api from './client';

export const recurringApi = {
  getRecurringRules: () => api.get('/recurring'),
  createRecurringRule: (data) => api.post('/recurring', data),
  updateRecurringRule: (id, data) => api.put(`/recurring/${id}`, data),
  deleteRecurringRule: (id) => api.delete(`/recurring/${id}`),
  triggerProcess: () => api.post('/recurring/process'),
  runRuleNow: (id) => api.post(`/recurring/${id}/run`),
};

export default recurringApi;
