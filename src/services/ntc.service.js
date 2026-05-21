import api from './api';

export const ntcService = {
  getPacks: async () => {
    const response = await api.get('/api/ntc/packs/');
    return response.data;
  },

  sendOtp: async (data) => {
    const response = await api.post('/api/ntc/send-otp/', data);
    return response.data;
  },

  confirmPurchase: async (data) => {
    const response = await api.post('/api/ntc/confirm/', data);
    return response.data;
  },
};

