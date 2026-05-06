import api from './api';

export const paymentPlanService = {
  getPaymentPlans: async (params = {}) => {
    const response = await api.get('/api/paymentplans/', { params });
    return response.data;
  },

  createPaymentPlan: async (data) => {
    const response = await api.post('/api/paymentplans/', data);
    return response.data;
  },

  getPaymentPlan: async (id) => {
    const response = await api.get(`/api/paymentplans/${id}/`);
    return response.data;
  },

  updatePaymentPlan: async (id, data) => {
    const response = await api.patch(`/api/paymentplans/${id}/`, data);
    return response.data;
  },

  deletePaymentPlan: async (id) => {
    await api.delete(`/api/paymentplans/${id}/`);
  },

  markCanceled: async (id) => {
    const response = await api.post(`/api/paymentplans/${id}/mark_canceled/`, {});
    return response.data;
  },

  markCompleted: async (id) => {
    const response = await api.post(`/api/paymentplans/${id}/mark_completed/`, {});
    return response.data;
  }
};
