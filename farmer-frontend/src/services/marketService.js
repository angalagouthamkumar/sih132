import api from './api';

/**
 * Service to fetch simulated Telangana APMC market benchmark records
 */
export const getMarketData = async (params = {}) => {
  const response = await api.get('/market-data', { params });
  return response.data;
};
