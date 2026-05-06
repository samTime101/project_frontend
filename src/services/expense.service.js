import api from './api';

export const expenseService = {
  getExpenses: async (params = {}) => {
    const response = await api.get('/api/expenses/', { params });
    return response.data;
  },

  getExpense: async (id) => {
    const response = await api.get(`/api/expenses/${id}/`);
    return response.data;
  },

  createExpense: async (data) => {
    const response = await api.post('/api/expenses/', data);
    return response.data;
  },

  updateExpense: async (id, data) => {
    const response = await api.patch(`/api/expenses/${id}/`, data);
    return response.data;
  },

  deleteExpense: async (id) => {
    await api.delete(`/api/expenses/${id}/`);
  }
};
