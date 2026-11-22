import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (!envUrl) return '/api';
  const cleanUrl = envUrl.trim().replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  withCredentials: true, // Send httpOnly cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Bearer token fallback (vital when third-party cookies are blocked across domains)
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('orbit_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message:
        error.response?.data?.message ||
        error.message ||
        'Something went wrong. Please try again.',
      status: error.response?.status,
      errors: error.response?.data?.errors,
    };
    return Promise.reject(customError);
  }
);

export default api;
