import api from './client';

export const categoryApi = {
  getCategories: (type) => api.get('/categories', { params: { type } }),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};
