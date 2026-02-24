import { apiClient } from './client';

export const generateApi = {
  generateOutline: (data: object) => apiClient.post('/generate/outline', data),
  generateNote: (data: object) => apiClient.post('/generate/note', data),
  generateImage: (data: { prompt: string; noteId?: string; pageNumber?: number }) => apiClient.post('/generate/image', data),
  analyzeNote: (data: { content: string }) => apiClient.post('/generate/analyze', data),
};

export const notesApi = {
  list: (params?: object) => apiClient.get('/notes', { params }),
  get: (id: string) => apiClient.get(`/notes/${id}`),
  update: (id: string, data: object) => apiClient.put(`/notes/${id}`, data),
  delete: (id: string) => apiClient.delete(`/notes/${id}`),
};

export const templatesApi = {
  list: (params?: object) => apiClient.get('/templates', { params }),
  get: (id: string) => apiClient.get(`/templates/${id}`),
  create: (data: object) => apiClient.post('/templates', data),
  update: (id: string, data: object) => apiClient.put(`/templates/${id}`, data),
  delete: (id: string) => apiClient.delete(`/templates/${id}`),
};

export const rechargeApi = {
  redeem: (code: string) => apiClient.post('/recharge/redeem', { code }),
  transactions: (params?: object) => apiClient.get('/recharge/transactions', { params }),
};

export const adminApi = {
  stats: () => apiClient.get('/admin/stats'),
  users: (params?: object) => apiClient.get('/admin/users', { params }),
  updateUser: (id: string, data: object) => apiClient.patch(`/admin/users/${id}`, data),
  generateCards: (data: object) => apiClient.post('/admin/cards/generate', data),
  listCards: (params?: object) => apiClient.get('/admin/cards', { params }),
};

export const adminConfigApi = {
  getProviders: () => apiClient.get('/admin/config/providers'),
  createProvider: (data: object) => apiClient.post('/admin/config/providers', data),
  updateProvider: (id: string, data: object) => apiClient.put(`/admin/config/providers/${id}`, data),
  deleteProvider: (id: string) => apiClient.delete(`/admin/config/providers/${id}`),
  activateProvider: (id: string) => apiClient.patch(`/admin/config/providers/${id}/activate`),
  testProvider: (data: object) => apiClient.post('/admin/config/test', data),
  fetchModels: (data: { provider: string; apiKey: string; baseUrl?: string }) =>
    apiClient.post('/admin/config/models', data),
};

export const xhsApi = {
  checkLogin: () => apiClient.get('/xhs/login/status'),
  getQrcode: () => apiClient.get('/xhs/login/qrcode'),
  logout: () => apiClient.delete('/xhs/login'),
  listFeeds: () => apiClient.get('/xhs/feeds'),
  searchFeeds: (data: object) => apiClient.post('/xhs/feeds/search', data),
  getFeedDetail: (data: object) => apiClient.post('/xhs/feeds/detail', data),
  getMyProfile: () => apiClient.get('/xhs/profile/me'),
  publish: (data: object) => apiClient.post('/xhs/publish', data),
  likeFeed: (data: object) => apiClient.post('/xhs/feeds/like', data),
  favoriteFeed: (data: object) => apiClient.post('/xhs/feeds/favorite', data),
  commentOnFeed: (data: object) => apiClient.post('/xhs/feeds/comment', data),
};
