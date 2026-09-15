import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Handshake,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Truck,
  FileText,
} from 'lucide-react';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import { getSentOffers } from '../services/offerService';
import { formatINR, formatDate } from '../utils/formatters';

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'rejected'];

export default function Offers() {
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchOffers = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await getSentOffers();
      const list =
        response?.data?.offers ||
        (Array.isArray(response?.data) ? response.data : []) ||
        response?.offers ||
        [];
      setOffers(list);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load submitted procurement offers.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const filteredOffers = offers.filter((o) =>
    filter === 'all' ? true : o.status === filter
  );

  const getStatusClass = (status) => {
    if (status === 'accepted') return 'status-badge-accepted';
    if (status === 'rejected') return 'status-badge-rejected';
    return 'status-badge-pending';
  };

  const getStatusIcon = (status) => {
    if (status === 'accepted') return <CheckCircle2 size={13} />;
    if (status === 'rejected') return <XCircle size={13} />;
    return <Clock size={13} />;
  };

  const getStatusLabel = (status) => {
    if (status === 'accepted') return 'Accepted';
    if (status === 'rejected') return 'Declined';
    return 'Pending';
  };

  const counts = {
    all: offers.length,
    pending: offers.filter((o) => o.status === 'pending').length,
    accepted: offers.filter((o) => o.status === 'accepted').length,
    rejected: offers.filter((o) => o.status === 'rejected').length,
  };

  if (isLoading) {
    return <PageLoader message="Retrieving your submitted procurement bids..." />;
  }

  return (
    <div className="portal-page-container">
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">Submitted Procurement Bids</h2>
          <p className="page-subheading">
            Current and historical procurement offers submitted directly to Telangana farmers.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary-action"
          onClick={fetchOffers}
          disabled={isLoading}
        >
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {loadError && (
        <div className="alert-box alert-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{loadError}</span>
          </div>
          <button type="button" className="btn btn-sm btn-secondary-action" onClick={fetchOffers}>
            Retry
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="filter-tabs-bar">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`filter-tab-btn ${filter === tab ? 'active' : ''}`}
            onClick={() => setFilter(tab)}
          >
            <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            <span className="filter-tab-count tabular-nums">{counts[tab]}</span>
          </button>
        ))}
      </div>

      {/* Offers Table */}
      {filteredOffers.length === 0 ? (
        <EmptyState
          icon={Handshake}
          title={
            offers.length === 0
              ? 'No Procurement Offers Submitted'
              : `No ${filter.charAt(0).toUpperCase() + filter.slice(1)} Offers`
          }
          description={
            offers.length === 0
              ? 'You have not submitted any procurement bids yet. Browse available harvests to send direct offers to farmers.'
              : `You have no offers currently marked with '${filter}' status.`
          }
          actionLabel={offers.length === 0 ? 'Browse Available Crops' : 'View All Bids'}
          onAction={() => (offers.length === 0 ? window.location.assign('/browse-crops') : setFilter('all'))}
        />
      ) : (
        <div className="card">
          <div className="table-responsive-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Commodity / Lot</th>
                  <th>Farmer / Mandi</th>
                  <th className="tabular-nums">Quantity</th>
                  <th className="tabular-nums">Offered Price</th>
                  <th className="tabular-nums">Gross Value</th>
                  <th className="tabular-nums">Deductions</th>
                  <th className="tabular-nums">Net Realization</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.map((offer) => {
                  const cropName = offer.crop?.name || 'Crop Listing';
                  const cropVariety = offer.crop?.variety || '';
                  const farmerName = offer.farmer?.name || 'Farmer';
                  const farmerLoc = offer.farmer?.location || offer.crop?.location || '';
                  const deductions = (Number(offer.transportCost) || 0) + (Number(offer.otherCharges) || 0);

                  return (
                    <motion.tr
                      key={offer._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td>
                        <div className="table-crop-cell">
                          <strong>{cropName}</strong>
                          {cropVariety && <span className="table-variety-text">{cropVariety}</span>}
                          {offer.message && (
                            <small className="table-message-snippet" title={offer.message}>
                              "{offer.message}"
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="table-farmer-cell">
                          <span>{farmerName}</span>
                          <span className="table-location-text">{farmerLoc}</span>
                        </div>
                      </td>
                      <td className="tabular-nums">
                        {offer.quantity} {offer.unit}
                      </td>
                      <td className="tabular-nums">
                        {formatINR(offer.offeredPricePerKg)}<small>/kg</small>
                      </td>
                      <td className="tabular-nums">
                        {formatINR(offer.grossAmount)}
                      </td>
                      <td className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                        {deductions > 0 ? `- ${formatINR(deductions)}` : '₹0'}
                      </td>
                      <td className="tabular-nums table-highlight-val">
                        {formatINR(offer.netRealization)}
                      </td>
                      <td>
                        <span className={`status-badge-pill ${getStatusClass(offer.status)}`}>
                          {getStatusIcon(offer.status)}
                          {getStatusLabel(offer.status)}
                        </span>
                      </td>
                      <td>{formatDate(offer.createdAt)}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
