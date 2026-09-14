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
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary-900">Offers Monitoring</h2>
        <p className="text-text-secondary">Read-only view of all platform offers.</p>
      </div>

      {loading ? (
        <PageLoader />
      ) : error ? (
        <EmptyState message={error} icon="⚠️" />
      ) : offers.length === 0 ? (
        <EmptyState message="No offers found." icon="🤝" />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Crop & Quantity</th>
                <th>Parties (B → F)</th>
                <th>Price/Kg</th>
                <th>Net Realization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer._id}>
                  <td className="text-sm">{new Date(offer.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="font-semibold text-text">{offer.crop?.name || 'Unknown'}</div>
                    <div className="text-xs text-text-secondary">{offer.quantity} {offer.unit}</div>
                  </td>
                  <td>
                    <div className="text-sm font-medium text-text">{offer.buyer?.name || 'Unknown Buyer'}</div>
                    <div className="text-xs text-text-secondary">→ {offer.farmer?.name || 'Unknown Farmer'}</div>
                  </td>
                  <td className="text-sm">{formatCurrency(offer.offeredPricePerKg)}</td>
                  <td className="text-sm font-medium text-primary-900 financial-value">{formatCurrency(offer.netRealization)}</td>
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
