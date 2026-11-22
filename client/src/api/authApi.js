import api from './client';

export const authApi = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  login2FA: (data) => api.post('/auth/login/2fa', data),
  demoLogin: () => api.post('/auth/demo'),
  refreshToken: (data = {}) => api.post('/auth/refresh', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  updatePreferences: (preferences) => api.patch('/auth/preferences', preferences),
};

export default authApi;
