import api from './api';

export const getMarketData = async () => {
  const response = await api.get('/admin/market-data');
  return response.data;
};

export const createMarketData = async (data) => {
  const response = await api.post('/admin/market-data', data);
  return response.data;
};

export const updateMarketData = async (id, data) => {
  const response = await api.patch(`/admin/market-data/${id}`, data);
  return response.data;
};

export const deleteMarketData = async (id) => {
  const response = await api.delete(`/admin/market-data/${id}`);
  return response.data;
};
