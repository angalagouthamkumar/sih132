import api from './api';

/**
 * Buyer Offer Service Layer
 * Interacts with /api/offers endpoints using existing Axios instance
 */

// Submit a new procurement offer for an available crop
export const createOffer = async (offerData) => {
  const response = await api.post('/offers', offerData);
  return response.data;
};

// Retrieve all procurement offers sent by the logged-in buyer
export const getSentOffers = async () => {
  const response = await api.get('/offers/sent');
  return response.data;
};
