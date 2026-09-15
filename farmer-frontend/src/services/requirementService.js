import api from './api';

export const getBuyerRequirements = async (params = {}) => {
  const response = await api.get('/requirements', { params });
  return response.data;
};
