import api from './api';

export const savingsService = {
  getSavingsGoals: async () => {
    const response = await api.get('/api/savings/');
    return response.data;
  },
  createSavingsGoal: async (data) => {
    const response = await api.post('/api/savings/', data);
    return response.data;
  },
  updateSavingsGoal: async (id, data) => {
    const response = await api.patch(`/api/savings/${id}/`, data);
    return response.data;
  },
  deleteSavingsGoal: async (id) => {
    const response = await api.delete(`/api/savings/${id}/`);
    return response.data;
  }
};
