import { http } from './http.js';

const data = (p) => p.then((r) => r.data);

export const authApi = {
  me: () => data(http.get('/auth/me')),
  session: () => data(http.get('/auth/session')),
  login: (body) => data(http.post('/auth/login', body)),
  register: (body) => data(http.post('/auth/register', body)),
  logout: () => data(http.post('/auth/logout')),
  updateProfile: (body) => data(http.patch('/auth/me', body)),
  changePassword: (body) => data(http.post('/auth/change-password', body)),
  forgotPassword: (email) => data(http.post('/auth/forgot-password', { email })),
  resetPassword: (body) => data(http.post('/auth/reset-password', body)),
};

export const productsApi = {
  list: (params, config) => data(http.get('/products', { params, ...config })),
  get: (slug) => data(http.get(`/products/${encodeURIComponent(slug)}`)),
  priceRange: () => data(http.get('/products/price-range')),
  reviews: (id) => data(http.get(`/products/${id}/reviews`)),
  addReview: (id, body) => data(http.post(`/products/${id}/reviews`, body)),
  create: (body) => data(http.post('/products', body)),
  update: (id, body) => data(http.put(`/products/${id}`, body)),
  remove: (id) => data(http.delete(`/products/${id}`)),
  setInventory: (id, body) => data(http.patch(`/products/${id}/inventory`, body)),
};

export const categoriesApi = {
  list: () => data(http.get('/categories')),
  create: (body) => data(http.post('/categories', body)),
  update: (id, body) => data(http.put(`/categories/${id}`, body)),
  remove: (id) => data(http.delete(`/categories/${id}`)),
};

export const servicesApi = {
  list: (params) => data(http.get('/services', { params })),
  create: (body) => data(http.post('/services', body)),
  update: (id, body) => data(http.put(`/services/${id}`, body)),
  remove: (id) => data(http.delete(`/services/${id}`)),
};

export const appointmentsApi = {
  availableDates: (serviceId) => data(http.get('/appointments/available-dates', { params: { serviceId } })),
  availability: (serviceId, date, exclude) => data(http.get('/appointments/availability', { params: { serviceId, date, exclude } })),
  create: (body) => data(http.post('/appointments', body)),
  get: (id, token) => data(http.get(`/appointments/${id}`, { params: token ? { token } : {} })),
  cancel: (id, body) => data(http.post(`/appointments/${id}/cancel`, body)),
  reschedule: (id, body) => data(http.post(`/appointments/${id}/reschedule`, body)),
  mine: () => data(http.get('/appointments/mine')),
  adminList: (params) => data(http.get('/appointments/admin/list', { params })),
  adminUpdate: (id, body) => data(http.patch(`/appointments/admin/${id}`, body)),
  blockedDates: () => data(http.get('/appointments/admin/blocked-dates')),
  addBlockedDate: (body) => data(http.post('/appointments/admin/blocked-dates', body)),
  removeBlockedDate: (id) => data(http.delete(`/appointments/admin/blocked-dates/${id}`)),
};

export const cartApi = {
  quote: (items) => data(http.post('/cart/quote', { items })),
};

export const checkoutApi = {
  config: () => data(http.get('/checkout/config')),
  createSession: (body) => data(http.post('/checkout/session', body)),
  getBySession: (sessionId) => data(http.get(`/checkout/session/${encodeURIComponent(sessionId)}`)),
  cancel: (orderId, token) => data(http.post('/checkout/cancel', { orderId, token })),
};

export const ordersApi = {
  mine: () => data(http.get('/orders/mine')),
  get: (id) => data(http.get(`/orders/${id}`)),
  adminList: (params) => data(http.get('/orders/admin/list', { params })),
  adminUpdate: (id, body) => data(http.patch(`/orders/admin/${id}`, body)),
};

export const adminApi = {
  stats: () => data(http.get('/admin/stats')),
  customers: (params) => data(http.get('/admin/customers', { params })),
  setRole: (id, role) => data(http.patch(`/admin/customers/${id}/role`, { role })),
  reviews: (params) => data(http.get('/admin/reviews', { params })),
  setReviewApproval: (id, isApproved) => data(http.patch(`/admin/reviews/${id}`, { isApproved })),
  deleteReview: (id) => data(http.delete(`/admin/reviews/${id}`)),
  messages: (params) => data(http.get('/admin/messages', { params })),
  markMessage: (id, isRead) => data(http.patch(`/admin/messages/${id}`, { isRead })),
  subscribers: () => data(http.get('/admin/subscribers')),
  uploadImage: (file) => {
    const form = new FormData();
    form.append('image', file);
    return data(http.post('/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } }));
  },
};

export const miscApi = {
  contact: (body) => data(http.post('/contact', body)),
  subscribe: (email, website = '') => data(http.post('/newsletter', { email, website })),
};
