import { useState, useEffect } from 'react';
import { getOrders } from '../services/adminService';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await getOrders();
        if (res.success) {
          setOrders(res.data);
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary-900">Orders Monitoring</h2>
        <p className="text-text-secondary">Read-only view of all platform orders.</p>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState message={error} icon="⚠️" />
      ) : orders.length === 0 ? (
        <EmptyState message="No orders found." icon="📦" />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID & Date</th>
                <th>Parties (B → F)</th>
                <th>Snapshot</th>
                <th>Net Amount</th>
                <th>Order Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div className="text-xs font-mono text-text-secondary">{order._id.substring(18)}</div>
                    <div className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-text">{order.buyer?.name || 'Unknown Buyer'}</div>
                    <div className="text-xs text-text-secondary">→ {order.farmer?.name || 'Unknown Farmer'}</div>
                  </td>
                  <td>
                    <div className="font-semibold text-text text-sm">{order.cropName}</div>
                    <div className="text-xs text-text-secondary">{order.quantity} {order.unit} @ {formatCurrency(order.offeredPricePerKg)}</div>
                  </td>
                  <td className="text-sm font-bold text-primary-900 financial-value">
                    {formatCurrency(order.netAmount)}
                  </td>
                  <td>
                    <StatusBadge status={order.orderStatus} />
                  </td>
                  <td>
                    <StatusBadge status={order.paymentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Orders;
