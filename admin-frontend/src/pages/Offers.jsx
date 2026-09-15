import { Handshake as UiHandshake, AlertTriangle as UiAlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getOffers } from '../services/adminService';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await getOffers();
        if (res.success) {
          setOffers(res.data);
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load offers.');
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

  return (
    <div className="admin-page">
      <div className="page-header-row">
        <div>
          <h2 className="admin-page-title">Offers Monitoring</h2>
          <p className="admin-page-subtitle">Read-only view of all platform offers.</p>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState message={error} icon={<UiAlertTriangle size={20} />} />
      ) : offers.length === 0 ? (
        <EmptyState message="No offers found." icon={<UiHandshake size={20} />} />
      ) : (
        <div className="table-container">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Crop & Quantity</th>
                <th>Parties (Buyer → Farmer)</th>
                <th>Price/Kg</th>
                <th>Net Realization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer._id}>
                  <td className="cell-date">{new Date(offer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="cell-crop-title">{offer.crop?.name || 'Unknown Crop'}</div>
                    <div className="cell-crop-subtitle">{offer.quantity} {offer.unit}</div>
                  </td>
                  <td>
                    <div className="cell-party-buyer">{offer.buyer?.name || 'Unknown Buyer'}</div>
                    <div className="cell-party-farmer">→ {offer.farmer?.name || 'Unknown Farmer'}</div>
                  </td>
                  <td className="cell-unit-price">{formatCurrency(offer.offeredPricePerKg)}</td>
                  <td className="cell-amount-value">{formatCurrency(offer.netRealization)}</td>
                  <td>
                    <StatusBadge status={offer.status} />
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

export default Offers;

