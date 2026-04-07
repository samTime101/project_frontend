import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const tokens = JSON.parse(localStorage.getItem('auth_tokens'));
  if (tokens && tokens.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`;
  }
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/refresh/') {
      originalRequest._retry = true;
      const tokens = JSON.parse(localStorage.getItem('auth_tokens'));
      
      if (tokens && tokens.refresh) {
        try {
          const res = await axios.post(`${api.defaults.baseURL}/api/auth/refresh/`, {
            refresh: tokens.refresh
          });
          
          const newTokens = {
            access: res.data.access,
            refresh: tokens.refresh // Keeping old, if refresh isn't returned
          };
          
          localStorage.setItem('auth_tokens', JSON.stringify(newTokens));
          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('auth_tokens');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
