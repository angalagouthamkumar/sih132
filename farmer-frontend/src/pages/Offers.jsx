import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Handshake,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  X,
  Building2,
  Sparkles,
} from 'lucide-react';
import OfferCard from '../components/OfferCard';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import { getReceivedOffers, updateOfferStatus } from '../services/offerService';
import { formatINR } from '../utils/formatters';

import { convertToKg } from '../utils/priceDiscovery';

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'rejected'];

export default function Offers() {
  const { showToast } = useOutletContext();
  const [offers, setOffers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    offer: null,
    targetStatus: 'accepted',
    isSubmitting: false,
    errorMessage: '',
  });

  const fetchOffers = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const response = await getReceivedOffers();
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
        'Failed to load received buyer offers.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Compute highest net realization per kg among pending offers per crop
  const highestNetPerKgByCrop = {};
  offers.forEach((o) => {
    if (o.status === 'pending' && o.crop?._id) {
      const qKg = convertToKg(o.quantity, o.unit);
      const netKg = qKg > 0 ? o.netRealization / qKg : 0;
      const current = highestNetPerKgByCrop[o.crop._id] || 0;
      if (netKg > current) {
        highestNetPerKgByCrop[o.crop._id] = netKg;
      }
    }
  });

  const filteredOffers = offers.filter((offer) => {
    if (statusFilter === 'all') return true;
    return offer.status === statusFilter;
  });

  const counts = {
    all: offers.length,
    pending: offers.filter((o) => o.status === 'pending').length,
    accepted: offers.filter((o) => o.status === 'accepted').length,
    rejected: offers.filter((o) => o.status === 'rejected').length,
  };

  const handleOpenConfirm = (offer, targetStatus) => {
    setConfirmModal({
      isOpen: true,
      offer,
      targetStatus,
      isSubmitting: false,
      errorMessage: '',
    });
  };

  const handleCloseConfirm = () => {
    if (!confirmModal.isSubmitting) {
      setConfirmModal({
        isOpen: false,
        offer: null,
        targetStatus: 'accepted',
        isSubmitting: false,
        errorMessage: '',
      });
    }
  };

  const handleExecuteStatusUpdate = async () => {
    const { offer, targetStatus } = confirmModal;
    if (!offer) return;

    setConfirmModal((prev) => ({ ...prev, isSubmitting: true, errorMessage: '' }));

    try {
      const res = await updateOfferStatus(offer._id, targetStatus);
      if (res?.success) {
        const actionLabel = targetStatus === 'accepted' ? 'accepted' : 'declined';
        showToast(`Offer from ${offer.buyer?.businessName || 'Buyer'} successfully ${actionLabel}!`, 'success');
        handleCloseConfirm();
        // Immediately refresh offers to reflect updated status and any competing auto-rejections
        await fetchOffers();
      } else {
        setConfirmModal((prev) => ({
          ...prev,
          isSubmitting: false,
          errorMessage: res?.message || 'Failed to update offer status.',
        }));
      }
    } catch (err) {
      setConfirmModal((prev) => ({
        ...prev,
        isSubmitting: false,
        errorMessage:
          err.response?.data?.message ||
          err.message ||
          'Failed to update offer status. Please try again.',
      }));
    }
  };

  if (isLoading) {
    return <PageLoader message="Retrieving commercial buyer offers for your crops..." />;
  }

  return (
    <div className="portal-page-container">
      {/* Page Header */}
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">Buyer Procurement Offers</h2>
          <p className="page-subheading">
            Commercial farm-gate bids submitted by registered agribusinesses and grain aggregators.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary-action"
          onClick={fetchOffers}
          disabled={isLoading}
        >
          <RefreshCw size={15} />
          <span>Refresh Bids</span>
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

      {/* Filter Tabs */}
      <div className="filter-toolbar">
        <div className="filter-tabs-group">
          {STATUS_FILTERS.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`filter-tab-btn ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              <span>{tab === 'rejected' ? 'Declined' : tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              <span className="tab-count-badge tabular-nums">({counts[tab]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Offers Grid */}
      {filteredOffers.length > 0 ? (
        <div className="offers-grid-display">
          {filteredOffers.map((offer) => {
            const qKg = convertToKg(offer.quantity, offer.unit);
            const netKg = qKg > 0 ? offer.netRealization / qKg : 0;
            const isHighest =
              offer.status === 'pending' &&
              offer.crop?._id &&
              highestNetPerKgByCrop[offer.crop._id] &&
              Math.abs(highestNetPerKgByCrop[offer.crop._id] - netKg) < 0.001;

            return (
              <OfferCard
                key={offer._id}
                offer={offer}
                isHighestNetRealization={isHighest}
                onAccept={(o) => handleOpenConfirm(o, 'accepted')}
                onReject={(o) => handleOpenConfirm(o, 'rejected')}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Handshake}
          title={
            offers.length === 0
              ? 'No Buyer Offers Received Yet'
              : `No ${statusFilter === 'rejected' ? 'Declined' : statusFilter} Offers`
          }
          description={
            offers.length === 0
              ? 'You currently have no buyer bids on your crops. When buyers submit purchase proposals, they will appear here.'
              : `There are currently no buyer offers marked with '${statusFilter}' status.`
          }
          actionLabel="View All Offers"
          onAction={() => setStatusFilter('all')}
        />
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && confirmModal.offer && (
          <div className="modal-backdrop-overlay" onClick={handleCloseConfirm}>
            <motion.div
              className="modal-card-dialog modal-dialog-confirm"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-header-bar">
                <div className="modal-header-titles">
                  <h3 className="modal-dialog-title">
                    {confirmModal.targetStatus === 'accepted'
                      ? 'Accept Procurement Offer'
                      : 'Decline Procurement Offer'}
                  </h3>
                  <p className="modal-dialog-subtitle">
                    {confirmModal.offer.crop?.name} ({confirmModal.offer.quantity} {confirmModal.offer.unit})
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-icon-btn"
                  onClick={handleCloseConfirm}
                  disabled={confirmModal.isSubmitting}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {confirmModal.errorMessage && (
                <div className="alert-box alert-error" style={{ margin: '16px 24px 0' }}>
                  <AlertCircle size={16} />
                  <span>{confirmModal.errorMessage}</span>
                </div>
              )}

              <div className="modal-body-confirm">
                <div className="confirm-summary-card">
                  <div className="confirm-row">
                    <span className="confirm-key">Buyer:</span>
                    <strong className="confirm-val">
                      {confirmModal.offer.buyer?.businessName || confirmModal.offer.buyer?.name}
                    </strong>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Offered Price:</span>
                    <span className="confirm-val tabular-nums">
                      ₹{confirmModal.offer.offeredPricePerKg}/kg
                    </span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Gross Amount:</span>
                    <span className="confirm-val tabular-nums">
                      {formatINR(confirmModal.offer.grossAmount)}
                    </span>
                  </div>
                  <div className="confirm-row highlight-net">
                    <span className="confirm-key">Net Farmer Realization:</span>
                    <strong className="confirm-val tabular-nums">
                      {formatINR(confirmModal.offer.netRealization)}
                    </strong>
                  </div>
                </div>

                {confirmModal.targetStatus === 'accepted' ? (
                  <p className="confirm-notice-text">
                    <strong>Notice:</strong> Accepting this offer will lock this agreement with the buyer. Any other pending offers on this crop will automatically be marked as declined.
                  </p>
                ) : (
                  <p className="confirm-notice-text">
                    Are you sure you want to decline this procurement bid? This action cannot be reversed once confirmed.
                  </p>
                )}

                <div className="modal-actions-footer">
                  <button
                    type="button"
                    className="btn btn-secondary-action"
                    onClick={handleCloseConfirm}
                    disabled={confirmModal.isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`btn ${confirmModal.targetStatus === 'accepted' ? 'btn-primary-action' : 'btn-danger-action'}`}
                    onClick={handleExecuteStatusUpdate}
                    disabled={confirmModal.isSubmitting}
                  >
                    {confirmModal.isSubmitting ? (
                      <span>Processing...</span>
                    ) : confirmModal.targetStatus === 'accepted' ? (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Confirm & Accept</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={16} />
                        <span>Confirm & Decline</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
