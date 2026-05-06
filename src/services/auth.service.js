import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/signin/', credentials);
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
    }
    return response.data;
  },

  signup: async (userData) => {
    const response = await api.post('/api/auth/signup/', userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/users/me/');
    return response.data;
  }
};
