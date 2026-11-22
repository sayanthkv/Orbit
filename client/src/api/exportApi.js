import api from './client';

export const exportApi = {
  previewImport: (data) => api.post('/export/import/preview', data),
  commitImport: (data) => api.post('/export/import/commit', data),
  getExportUrl: (params = {}) => {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.type) query.append('type', params.type);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.accountId && params.accountId !== 'all') query.append('accountId', params.accountId);
    return `${import.meta.env.VITE_API_URL || '/api'}/export/csv?${query.toString()}`;
  },
};

export default exportApi;
