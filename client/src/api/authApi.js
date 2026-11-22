import api from './client';

export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  demoLogin: () => api.post('/auth/demo'),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (preferences) => api.patch('/auth/preferences', preferences),
};
