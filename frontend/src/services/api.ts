import axios from 'axios';

const apiBase = import.meta.env.VITE_API_URL
  ? `${(import.meta.env.VITE_API_URL as string).replace(/\/$/, '')}/api/v1`
  : '/api/v1';

export const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('trivault_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on 401 Unauthorized if token expired
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('trivault_token');
        localStorage.removeItem('trivault_user');
      }
    }
    return Promise.reject(error);
  }
);
