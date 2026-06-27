import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('ecom_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (!path.startsWith('/auth')) {
        localStorage.removeItem('ecom_token');
        localStorage.removeItem('ecom_user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  login: (data) => api.post('/auth/login', data),
  resendOTP: (userId) => api.post('/auth/resend-otp', { userId }),
};

export const productsAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  search: (q, params) => api.get('/products/search', { params: { q, ...params } }),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  addItem: (productId, quantity) => api.post('/cart/items', { productId, quantity }),
  updateItem: (productId, quantity) => api.put(`/cart/items/${productId}`, { quantity }),
  removeItem: (productId) => api.delete(`/cart/items/${productId}`),
  clear: () => api.delete('/cart'),
};

export const checkoutAPI = {
  create: (data) => api.post('/checkout', data),
};

export const paymentAPI = {
  process: (data) => api.post('/payment', data),
};

export const ordersAPI = {
  getById: (id) => api.get(`/orders/${id}`),
  getAll: (params) => api.get('/orders', { params }),
};

export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  changePassword: (data) => api.put('/profile/password', data),
  uploadAvatar: (formData) => api.post('/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAccount: (password) => api.delete('/profile', { data: { password } }),
};

export const newsletterAPI = {
  subscribe: (email) => api.post('/newsletter/subscribe', { email }),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export const notificationsAPI = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  dismiss: (id) => api.delete(`/notifications/${id}`),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  listApiKeys: () => api.get('/settings/api-keys'),
  generateApiKey: (name) => api.post('/settings/api-keys', { name }),
  revokeApiKey: (id) => api.delete(`/settings/api-keys/${id}`),
};

export const searchAPI = {
  search: (q, types) => api.get('/search', { params: { q, types: types?.join(',') } }),
  getSaved: () => api.get('/search/saved'),
  save: (query, filters) => api.post('/search/saved', { query, filters }),
  deleteSaved: (id) => api.delete(`/search/saved/${id}`),
};

export const wishlistAPI = {
  list: () => api.get('/wishlist'),
  add: (productId) => api.post('/wishlist', { productId }),
  remove: (productId) => api.delete(`/wishlist/${productId}`),
};

export const projectsAPI = {
  list: (params) => api.get('/projects', { params }),
  create: (data) => api.post('/projects', data),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  archive: (id) => api.patch(`/projects/${id}/archive`),
  delete: (id) => api.delete(`/projects/${id}`),
  listMembers: (id) => api.get(`/projects/${id}/members`),
  inviteMember: (id, data) => api.post(`/projects/${id}/members`, data),
  updateMemberRole: (id, userId, role) => api.put(`/projects/${id}/members/${userId}`, { role }),
  removeMember: (id, userId) => api.delete(`/projects/${id}/members/${userId}`),
};

export const tasksAPI = {
  list: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  create: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  getById: (projectId, taskId) => api.get(`/projects/${projectId}/tasks/${taskId}`),
  update: (projectId, taskId, data) => api.put(`/projects/${projectId}/tasks/${taskId}`, data),
  delete: (projectId, taskId) => api.delete(`/projects/${projectId}/tasks/${taskId}`),
  reorder: (projectId, data) => api.patch(`/projects/${projectId}/tasks/reorder`, data),
  // Comments
  addComment: (projectId, taskId, body) => api.post(`/projects/${projectId}/tasks/${taskId}/comments`, { body }),
  updateComment: (projectId, taskId, commentId, body) => api.put(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { body }),
  deleteComment: (projectId, taskId, commentId) => api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`),
  // Attachments
  addAttachment: (projectId, taskId, formData) => api.post(`/projects/${projectId}/tasks/${taskId}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAttachment: (projectId, taskId, attachmentId) => api.delete(`/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}`),
  // Labels
  listLabels: (projectId) => api.get(`/projects/${projectId}/tasks/labels/list`),
  createLabel: (projectId, data) => api.post(`/projects/${projectId}/tasks/labels`, data),
  deleteLabel: (projectId, labelId) => api.delete(`/projects/${projectId}/tasks/labels/${labelId}`),
};

// Extends authAPI with new endpoints
Object.assign(authAPI, {
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
});

export default api;
