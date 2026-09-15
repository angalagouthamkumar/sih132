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
    <div className="admin-page">
      <div className="page-header-row">
        <div>
          <h2 className="admin-page-title">Orders Monitoring</h2>
          <p className="admin-page-subtitle">Read-only view of all platform orders.</p>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState message={error} icon="⚠️" />
      ) : orders.length === 0 ? (
        <EmptyState message="No orders found." icon="📦" />
      ) : (
        <div className="table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order ID & Date</th>
                <th>Parties (Buyer → Farmer)</th>
                <th>Crop Snapshot</th>
                <th>Net Amount</th>
                <th>Order Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <div className="cell-mono-id">{order._id.substring(18)}</div>
                    <div className="cell-date">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div className="cell-party-buyer">{order.buyer?.name || 'Unknown Buyer'}</div>
                    <div className="cell-party-farmer">→ {order.farmer?.name || 'Unknown Farmer'}</div>
                  </td>
                  <td>
                    <div className="cell-crop-title">{order.cropName}</div>
                    <div className="cell-crop-subtitle">{order.quantity} {order.unit} @ {formatCurrency(order.offeredPricePerKg)}</div>
                  </td>
                  <td className="cell-amount-value">
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

