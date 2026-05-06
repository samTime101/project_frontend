import api from './api';

export const transactionService = {
  getTransactions: async (params = {}) => {
    const response = await api.get('/api/transactions/', { params });
    return response.data;
  },

  createTransaction: async (data) => {
    const response = await api.post('/api/transactions/', data);
    return response.data;
  },

  getTransaction: async (id) => {
    const response = await api.get(`/api/transactions/${id}/`);
    return response.data;
  },

  cancelTransaction: async (id) => {
    const response = await api.post(`/api/transactions/${id}/cancel/`);
    return response.data;
  },

  respondToTransaction: async (id, action) => {
    const response = await api.post(`/api/transactions/${id}/respond/`, { action });
    return response.data;
  }
};
