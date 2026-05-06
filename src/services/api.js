import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// For global error handling via NotificationContext
let errorHandler = null;
export const registerErrorHandler = (handler) => {
  errorHandler = handler;
};

const notifyError = (message) => {
  if (errorHandler) {
    errorHandler(message, 'error');
  }
};

// Request interceptor for adding JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    // Skip adding token for auth endpoints
    if (token && !config.url.includes('/api/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh and global errors
api.interceptors.response.use(
  (response) => {
    // Success messages can be handled by individual components
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized (Token expired/invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't refresh if it's already an auth endpoint
      if (originalRequest.url.includes('/api/auth/')) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    // Global Error Handling based on status codes
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          // Often validation errors, but can be specific business logic
          if (data.non_field_errors) notifyError(data.non_field_errors[0]);
          else if (typeof data === 'string') notifyError(data);
          else if (data.detail) notifyError(data.detail);
          break;
        case 403:
          // Check for specific "Insufficient Balance" message if sent by backend
          notifyError(data.detail || 'Access denied / Insufficient balance');
          break;
        case 404:
          notifyError(data.detail || 'Requested resource or user not found');
          break;
        case 500:
          notifyError('Server error. Please try again later.');
          break;
        default:
          if (data.detail) notifyError(data.detail);
      }
    } else if (error.request) {
      notifyError('No response from server. Check your internet connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
