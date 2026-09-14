import api from './api';

/**
 * Service layer for Crop endpoints in Buyer Portal
 * Connects to the real Module 4 Crop API
 */

// Retrieve marketplace crops with optional search, location, and status filters
export const getAvailableCrops = async (filters = {}) => {
  const params = {
    status: 'available', // Buyers only browse available crops by default
    ...filters,
  };
  const response = await api.get('/crops', { params });
  return response.data;
};

// Retrieve single crop detail by ID
export const getCropById = async (id) => {
  const response = await api.get(`/crops/${id}`);
  return response.data;
};
