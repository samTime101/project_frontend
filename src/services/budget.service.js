import api from './api';

export const budgetService = {
  getBudgets: async () => {
    const response = await api.get('/api/budgets/');
    return response.data;
  },
  createBudget: async (data) => {
    const response = await api.post('/api/budgets/', data);
    return response.data;
  },
  updateBudget: async (id, data) => {
    const response = await api.patch(`/api/budgets/${id}/`, data);
    return response.data;
  },
  deleteBudget: async (id) => {
    const response = await api.delete(`/api/budgets/${id}/`);
    return response.data;
  }
};
