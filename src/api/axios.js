import axios from 'axios';

export const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 15000, // 15s timeout
  withCredentials: true, // IMPORTANT: enable cookies for Sanctum SPA
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Handle 401 errors globally (expired sessions)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect if not on login/register page
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
