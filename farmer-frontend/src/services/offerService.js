import api from './api';

/**
 * Farmer Offer Service Layer
 * Connects to /api/offers endpoints using existing Axios instance
 */

// Retrieve all procurement offers received for crops owned by the logged-in farmer
export const getReceivedOffers = async () => {
  const response = await api.get('/offers/received');
  return response.data;
};

// Accept or reject a pending offer
export const updateOfferStatus = async (offerId, status) => {
  const response = await api.patch(`/offers/${offerId}/status`, { status });
  return response.data;
};
