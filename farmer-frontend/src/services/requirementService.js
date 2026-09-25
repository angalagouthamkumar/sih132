import api from './api';

export const getBuyerRequirements = async (params = {}) => {
  const response = await api.get('/requirements', { params });
  return response.data;
};

export const createSupplyOffer = async (payload) => {
  const response = await api.post('/requirement-offers', payload);
  return response.data;
};

export const getMySupplyProposals = async () => {
  const response = await api.get('/requirement-offers/mine');
  return response.data;
};
