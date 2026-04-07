import api from './api';

export const getExpenses = async (params = {}) => {
  const response = await api.get('/api/expenses/', { params });
  return response.data;
};

export const getExpenseById = async (id) => {
  const response = await api.get(`/api/expenses/${id}/`);
  return response.data;
};

export const createExpense = async (expenseData) => {
  const response = await api.post('/api/expenses/', expenseData);
  return response.data;
};

export const updateExpense = async (id, expenseData) => {
  const response = await api.patch(`/api/expenses/${id}/`, expenseData);
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await api.delete(`/api/expenses/${id}/`);
  return response.data;
};
