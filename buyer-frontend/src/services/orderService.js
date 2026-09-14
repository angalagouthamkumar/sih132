import api from './api';

/**
 * Buyer Order Service Layer
 * Uses the existing Axios instance with JWT Bearer interceptor.
 * Never hard-codes URLs or duplicates Axios configuration.
 */

// Retrieve all orders belonging to the authenticated buyer
export const getBuyerOrders = async () => {
  const response = await api.get('/orders/buyer');
  return response.data;
};

// Get a single order by ID (buyer must be a party)
export const getOrderById = async (orderId) => {
  const response = await api.get(`/orders/${orderId}`);
  return response.data;
};

// Update delivery status — buyer can move: confirmed → in_transit → delivered
export const updateOrderStatus = async (orderId, orderStatus) => {
  const response = await api.patch(`/orders/${orderId}/status`, { orderStatus });
  return response.data;
};

// Record buyer-reported payment (pending → paid, requires non-empty reference)
// Note: This records payment status only — no real money is processed.
export const updatePaymentStatus = async (orderId, paymentStatus, paymentReference) => {
  const response = await api.patch(`/orders/${orderId}/payment`, {
    paymentStatus,
    paymentReference,
  });
  return response.data;
};
