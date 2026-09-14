import api from './api';

/**
 * Farmer Order Service Layer
 * Uses the existing Axios instance with JWT Bearer interceptor.
 * Never hard-codes URLs or duplicates Axios configuration.
 */

// Retrieve all orders belonging to the authenticated farmer
export const getFarmerOrders = async () => {
  const response = await api.get('/orders/farmer');
  return response.data;
};

// Get a single order by ID (farmer must be a party)
export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

// Update delivery status: only delivered → completed is available to farmer
export const updateOrderStatus = async (orderId, orderStatus) => {
  const response = await api.patch(`/orders/${orderId}/status`, { orderStatus });
  return response.data;
};
