import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  ShieldCheck,
  ShieldOff,
  X,
  ChevronDown,
  ChevronUp,
  IndianRupee,
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import { getFarmerOrders, updateOrderStatus } from '../services/orderService';
import { formatINR, formatDate } from '../utils/formatters';

// ─── Helpers ────────────────────────────────────────────────────────────────

const SHORT_ID = (id = '') => id.toString().slice(-8).toUpperCase();

const ORDER_STATUS_META = {
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    badgeClass: 'status-badge loading',
  },
  in_transit: {
    label: 'In Transit',
    icon: Truck,
    badgeClass: 'status-badge warning',
  },
  delivered: {
    label: 'Delivered',
    icon: PackageCheck,
    badgeClass: 'status-badge online',
  },
  completed: {
    label: 'Completed',
    icon: ShieldCheck,
    badgeClass: 'status-badge online',
  },
};

const PAYMENT_STATUS_META = {
  pending: { label: 'Awaiting Payment', badgeClass: 'status-badge loading', icon: ShieldOff },
  paid: { label: 'Paid', badgeClass: 'status-badge online', icon: ShieldCheck },
};

function StatusBadge({ status, type = 'order' }) {
  const meta = type === 'payment'
    ? PAYMENT_STATUS_META[status]
    : ORDER_STATUS_META[status];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span className={meta.badgeClass} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <Icon size={12} />
      <span>{meta.label}</span>
    </span>
  );
}

function OrderTimeline({ history = [] }) {
  if (!history.length) return null;
  return (
    <div className="order-timeline-list">
      {history.map((entry, idx) => (
        <div key={idx} className="order-timeline-entry">
          <div className="timeline-dot" />
          <div className="timeline-content">
            <span className="timeline-status-label">
              {ORDER_STATUS_META[entry.status]?.label || entry.status}
            </span>
            <span className="timeline-date tabular-nums">
              {formatDate(entry.changedAt)}
            </span>
            {entry.changedBy?.name && (
              <span className="timeline-actor">{entry.changedBy.name}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order, onComplete, expandedId, onToggleExpand }) {
  const isExpanded = expandedId === order._id;
  const shortId = SHORT_ID(order._id);
  const deductions = (Number(order.transportCost) || 0) + (Number(order.otherCharges) || 0);
  const canComplete = order.orderStatus === 'delivered';

  return (
    <motion.div
      className="order-card-real"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Card Header */}
      <div className="order-card-header">
        <div className="order-card-ref-col">
          <span className="order-short-id tabular-nums">#{shortId}</span>
          <StatusBadge status={order.orderStatus} type="order" />
        </div>
        <div className="order-card-date tabular-nums">
          {formatDate(order.createdAt)}
        </div>
      </div>

      {/* Main Info */}
      <div className="order-card-body">
        <div className="order-card-crop-row">
          <div>
            <span className="order-crop-name">{order.cropName}</span>
            <span className="order-crop-variety">{order.variety}</span>
          </div>
          <div className="order-card-qty tabular-nums">
            {order.quantity} {order.unit}
          </div>
        </div>

        <div className="order-card-buyer-row">
          <span className="order-buyer-label">Buyer:</span>
          <span className="order-buyer-name">
            {order.buyer?.businessName || order.buyer?.name || 'Verified Buyer'}
          </span>
        </div>

        {/* Financial Summary */}
        <div className="order-financials-grid">
          <div className="fin-item">
            <span className="fin-label">Price / kg</span>
            <span className="fin-value tabular-nums">
              ₹{Number(order.offeredPricePerKg).toFixed(2)}
            </span>
          </div>
          <div className="fin-item">
            <span className="fin-label">Gross</span>
            <span className="fin-value tabular-nums">{formatINR(order.grossAmount)}</span>
          </div>
          <div className="fin-item">
            <span className="fin-label">Deductions</span>
            <span className="fin-value tabular-nums" style={{ color: 'var(--text-secondary)' }}>
              {deductions > 0 ? `− ${formatINR(deductions)}` : '₹0'}
            </span>
          </div>
          <div className="fin-item fin-net">
            <span className="fin-label">Net Amount</span>
            <strong className="fin-value tabular-nums">{formatINR(order.netAmount)}</strong>
          </div>
        </div>

        {/* Payment Status */}
        <div className="order-payment-row">
          <span className="order-payment-label">Payment:</span>
          <StatusBadge status={order.paymentStatus} type="payment" />
          {order.paymentStatus === 'paid' && order.paymentReference && (
            <span className="payment-ref-tag tabular-nums">Ref: {order.paymentReference}</span>
          )}
        </div>
      </div>

      {/* Expandable Timeline */}
      <div className="order-card-footer">
        <button
          type="button"
          className="order-expand-btn"
          onClick={() => onToggleExpand(order._id)}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Collapse timeline' : 'Expand timeline'}
        >
          <span>Order Timeline</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {canComplete && (
          <button
            type="button"
            className="btn btn-primary-action btn-sm"
            onClick={() => onComplete(order)}
          >
            <PackageCheck size={14} />
            <span>Mark Completed</span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="order-timeline-drawer">
              <OrderTimeline history={order.statusHistory || []} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function Orders() {
  const { showToast } = useOutletContext();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Completion modal
  const [modal, setModal] = useState({
    isOpen: false,
    order: null,
    isSubmitting: false,
    errorMessage: '',
  });

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await getFarmerOrders();
      const list =
        res?.data?.orders ||
        (Array.isArray(res?.data) ? res.data : []) ||
        res?.orders ||
        [];
      setOrders(list);
    } catch (err) {
      setLoadError(
        err.response?.data?.message ||
        err.message ||
        'Failed to load orders. Please retry.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleToggleExpand = (orderId) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  };

  const openCompleteModal = (order) => {
    setModal({ isOpen: true, order, isSubmitting: false, errorMessage: '' });
  };

  const closeModal = () => {
    if (!modal.isSubmitting) {
      setModal({ isOpen: false, order: null, isSubmitting: false, errorMessage: '' });
    }
  };

  const handleConfirmComplete = async () => {
    const { order } = modal;
    if (!order) return;
    setModal((prev) => ({ ...prev, isSubmitting: true, errorMessage: '' }));

    try {
      const res = await updateOrderStatus(order._id, 'completed');
      if (res?.success) {
        showToast('Order marked as completed successfully!', 'success');
        closeModal();
        await fetchOrders();
      } else {
        setModal((prev) => ({
          ...prev,
          isSubmitting: false,
          errorMessage: res?.message || 'Failed to complete order.',
        }));
      }
    } catch (err) {
      setModal((prev) => ({
        ...prev,
        isSubmitting: false,
        errorMessage:
          err.response?.data?.message ||
          err.message ||
          'Failed to complete order. Please try again.',
      }));
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading your order history and settlements..." />;
  }

  const activeOrders = orders.filter((o) =>
    ['confirmed', 'in_transit', 'delivered'].includes(o.orderStatus)
  );
  const completedOrders = orders.filter((o) => o.orderStatus === 'completed');

  return (
    <div className="portal-page-container">
      {/* Page Header */}
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">Orders & Settlements</h2>
          <p className="page-subheading">
            Track confirmed purchase orders, delivery progress, and buyer-reported payments.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary-action"
          onClick={fetchOrders}
          disabled={isLoading}
        >
          <RefreshCw size={15} />
          <span>Refresh</span>
        </button>
      </div>

      {loadError && (
        <div className="alert-box alert-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{loadError}</span>
          </div>
          <button type="button" className="btn btn-sm btn-secondary-action" onClick={fetchOrders}>
            Retry
          </button>
        </div>
      )}

      {orders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No Orders Yet"
          description="Once you accept a buyer offer, an order will be created automatically and appear here."
        />
      ) : (
        <>
          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <div className="dashboard-section-box" style={{ marginBottom: '24px' }}>
              <div className="section-box-header">
                <div>
                  <h3 className="section-box-title">Active Orders ({activeOrders.length})</h3>
                  <p className="section-box-subtitle">
                    Orders in progress — awaiting delivery or completion.
                  </p>
                </div>
              </div>
              <div className="orders-cards-grid">
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onComplete={openCompleteModal}
                    expandedId={expandedId}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <div className="dashboard-section-box">
              <div className="section-box-header">
                <div>
                  <h3 className="section-box-title">Completed Orders ({completedOrders.length})</h3>
                  <p className="section-box-subtitle">
                    Fully settled orders and past transactions.
                  </p>
                </div>
              </div>
              <div className="orders-cards-grid">
                {completedOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onComplete={openCompleteModal}
                    expandedId={expandedId}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Mark Completed Modal */}
      <AnimatePresence>
        {modal.isOpen && modal.order && (
          <div
            className="modal-backdrop-overlay"
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-modal-title"
          >
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
                  <h3 className="modal-dialog-title" id="complete-modal-title">
                    Confirm Order Completion
                  </h3>
                  <p className="modal-dialog-subtitle">
                    {modal.order.cropName} — Order #{SHORT_ID(modal.order._id)}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-icon-btn"
                  onClick={closeModal}
                  disabled={modal.isSubmitting}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {modal.errorMessage && (
                <div className="alert-box alert-error" style={{ margin: '16px 24px 0' }}>
                  <AlertCircle size={16} />
                  <span>{modal.errorMessage}</span>
                </div>
              )}

              <div className="modal-body-confirm">
                <div className="confirm-summary-card">
                  <div className="confirm-row">
                    <span className="confirm-key">Buyer:</span>
                    <strong className="confirm-val">
                      {modal.order.buyer?.businessName || modal.order.buyer?.name}
                    </strong>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Net Amount:</span>
                    <strong className="confirm-val tabular-nums">
                      {formatINR(modal.order.netAmount)}
                    </strong>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Payment:</span>
                    <StatusBadge status={modal.order.paymentStatus} type="payment" />
                  </div>
                </div>

                <p className="confirm-notice-text">
                  Marking this order as <strong>completed</strong> confirms that goods were delivered and the transaction is settled. This action cannot be reversed.
                </p>

                <div className="modal-actions-footer">
                  <button
                    type="button"
                    className="btn btn-secondary-action"
                    onClick={closeModal}
                    disabled={modal.isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary-action"
                    onClick={handleConfirmComplete}
                    disabled={modal.isSubmitting}
                  >
                    {modal.isSubmitting ? (
                      <span>Processing...</span>
                    ) : (
                      <>
                        <PackageCheck size={16} />
                        <span>Confirm Completion</span>
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
