import axios from 'axios';

export const getApiBaseUrl = (): string => {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('trivault_api_url') : null;
  const envUrl = import.meta.env.VITE_API_URL;
  const target = (custom && custom.trim() !== '') ? custom.trim() : envUrl;
  return target ? `${target.replace(/\/$/, '')}/api/v1` : '/api/v1';
};

export const setApiBaseUrl = (url: string) => {
  if (url && url.trim() !== '') {
    localStorage.setItem('trivault_api_url', url.trim());
  } else {
    localStorage.removeItem('trivault_api_url');
  }
};

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Authorization Bearer token and dynamic baseURL automatically
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
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
