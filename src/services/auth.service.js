import api from './api';

export const login = async (email, password) => {
  const response = await api.post('/api/auth/signin/', { email, password });
  if (response.data.access) {
    localStorage.setItem('auth_tokens', JSON.stringify(response.data));
  }
  return response.data;
};

export const signup = async (userData) => {
  const response = await api.post('/api/auth/signup/', userData);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('auth_tokens');
  window.location.href = '/login';
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('auth_tokens');
};
