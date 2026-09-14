import api from './api';

export const getDashboardStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

export const getUsers = async (params) => {
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const updateUserAccess = async (id, isActive) => {
  const response = await api.patch(`/admin/users/${id}/access`, { isActive });
  return response.data;
};

export const updateUserVerification = async (id, verificationStatus) => {
  const response = await api.patch(`/admin/users/${id}/verification`, { verificationStatus });
  return response.data;
};

export const getCrops = async () => {
  const response = await api.get('/admin/crops');
  return response.data;
};

export const updateCropStatus = async (id, status) => {
  const response = await api.patch(`/admin/crops/${id}/status`, { status });
  return response.data;
};

export const getOffers = async () => {
  const response = await api.get('/admin/offers');
  return response.data;
};

export const getOrders = async () => {
  const response = await api.get('/admin/orders');
  return response.data;
};

// ─── Transport Config ────────────────────────────────────────────────────────
export const getTransportConfig = async () => {
  const response = await api.get('/admin/transport-config');
  return response.data;
};

export const updateTransportConfig = async (data) => {
  const response = await api.post('/admin/transport-config', data);
  return response.data;
};
