import api from './client';

const cleanParams = (params) => {
  if (!params) return {};
  const cleaned = {};
  Object.keys(params).forEach((key) => {
    const val = params[key];
    if (val !== '' && val !== null && val !== undefined) {
      cleaned[key] = val;
    }
  });
  return cleaned;
};

export const transactionApi = {
  getTransactions: (params) => api.get('/transactions', { params: cleanParams(params) }),
  getTransactionById: (id) => api.get(`/transactions/${id}`),
  createTransaction: (data) => api.post('/transactions', data),
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
};

export default transactionApi;
