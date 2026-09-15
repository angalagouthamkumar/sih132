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
  CreditCard,
  IndianRupee,
} from 'lucide-react';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import { getBuyerOrders, updateOrderStatus, updatePaymentStatus } from '../services/orderService';
import { formatINR, formatDate } from '../utils/formatters';

// ─── Helpers ────────────────────────────────────────────────────────────────

const SHORT_ID = (id = '') => id.toString().slice(-8).toUpperCase();

const ORDER_STATUS_META = {
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    badgeClass: 'status-badge-pill status-badge-warning',
    nextStatus: 'in_transit',
    nextLabel: 'Mark In Transit',
    nextIcon: Truck,
  },
  in_transit: {
    label: 'In Transit',
    icon: Truck,
    badgeClass: 'status-badge-pill status-badge-info',
    nextStatus: 'delivered',
    nextLabel: 'Mark Delivered',
    nextIcon: PackageCheck,
  },
  delivered: {
    label: 'Delivered',
    icon: PackageCheck,
    badgeClass: 'status-badge-pill status-badge-success',
    nextStatus: null,
    nextLabel: null,
  },
  completed: {
    label: 'Completed',
    icon: ShieldCheck,
    badgeClass: 'status-badge-pill status-badge-success',
    nextStatus: null,
    nextLabel: null,
  },
};

const PAYMENT_STATUS_META = {
  pending: { label: 'Awaiting Payment', badgeClass: 'status-badge-pill status-badge-warning', icon: ShieldOff },
  paid: { label: 'Paid (Buyer Reported)', badgeClass: 'status-badge-pill status-badge-success', icon: ShieldCheck },
};

function StatusBadge({ status, type = 'order' }) {
  const meta = type === 'payment' ? PAYMENT_STATUS_META[status] : ORDER_STATUS_META[status];
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
            <span className="timeline-date tabular-nums">{formatDate(entry.changedAt)}</span>
            {entry.changedBy?.name && (
              <span className="timeline-actor">{entry.changedBy.name}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Order Card ──────────────────────────────────────────────────────────────

function OrderCard({ order, onStatusAction, onPaymentAction, expandedId, onToggleExpand }) {
  const isExpanded = expandedId === order._id;
  const shortId = SHORT_ID(order._id);
  const deductions = (Number(order.transportCost) || 0) + (Number(order.otherCharges) || 0);
  const meta = ORDER_STATUS_META[order.orderStatus] || {};

  const canUpdateStatus =
    order.orderStatus === 'confirmed' || order.orderStatus === 'in_transit';
  const canPay =
    order.paymentStatus === 'pending' &&
    (order.orderStatus === 'delivered' || order.orderStatus === 'completed');

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
        <div className="order-card-date tabular-nums">{formatDate(order.createdAt)}</div>
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
          <span className="order-buyer-label">Farmer:</span>
          <span className="order-buyer-name">
            {order.farmer?.name || 'Farmer'}
            {order.farmer?.location && (
              <span className="order-farmer-location"> · {order.farmer.location}</span>
            )}
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

      {/* Action Footer */}
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

        <div className="order-action-buttons">
          {canPay && (
            <button
              type="button"
              className="btn btn-secondary-action btn-sm"
              onClick={() => onPaymentAction(order)}
            >
              <CreditCard size={14} />
              <span>Mark Paid</span>
            </button>
          )}
          {canUpdateStatus && meta.nextStatus && (
            <button
              type="button"
              className="btn btn-primary-action btn-sm"
              onClick={() => onStatusAction(order, meta.nextStatus, meta.nextLabel)}
            >
              {meta.nextIcon && <meta.nextIcon size={14} />}
              <span>{meta.nextLabel}</span>
            </button>
          )}
        </div>
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
  const { showToast } = useOutletContext() || {};
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  // Status-transition modal
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    order: null,
    targetStatus: '',
    actionLabel: '',
    isSubmitting: false,
    errorMessage: '',
  });

  // Payment modal
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    order: null,
    reference: '',
    isSubmitting: false,
    errorMessage: '',
  });

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const res = await getBuyerOrders();
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

  // ── Status Modal ──
  const openStatusModal = (order, targetStatus, actionLabel) => {
    setStatusModal({
      isOpen: true,
      order,
      targetStatus,
      actionLabel,
      isSubmitting: false,
      errorMessage: '',
    });
  };

  const closeStatusModal = () => {
    if (!statusModal.isSubmitting) {
      setStatusModal({ isOpen: false, order: null, targetStatus: '', actionLabel: '', isSubmitting: false, errorMessage: '' });
    }
  };

  const handleConfirmStatus = async () => {
    const { order, targetStatus } = statusModal;
    if (!order || !targetStatus) return;
    setStatusModal((prev) => ({ ...prev, isSubmitting: true, errorMessage: '' }));
    try {
      const res = await updateOrderStatus(order._id, targetStatus);
      if (res?.success) {
        const label = ORDER_STATUS_META[targetStatus]?.label || targetStatus;
        showToast?.(`Order status updated to "${label}".`, 'success');
        closeStatusModal();
        await fetchOrders();
      } else {
        setStatusModal((prev) => ({
          ...prev,
          isSubmitting: false,
          errorMessage: res?.message || 'Failed to update order status.',
        }));
      }
    } catch (err) {
      setStatusModal((prev) => ({
        ...prev,
        isSubmitting: false,
        errorMessage:
          err.response?.data?.message ||
          err.message ||
          'Failed to update order status.',
      }));
    }
  };

  // ── Payment Modal ──
  const openPaymentModal = (order) => {
    setPaymentModal({
      isOpen: true,
      order,
      reference: '',
      isSubmitting: false,
      errorMessage: '',
    });
  };

  const closePaymentModal = () => {
    if (!paymentModal.isSubmitting) {
      setPaymentModal({ isOpen: false, order: null, reference: '', isSubmitting: false, errorMessage: '' });
    }
  };

  const handleConfirmPayment = async () => {
    const { order, reference } = paymentModal;
    if (!order) return;
    if (!reference.trim()) {
      setPaymentModal((prev) => ({ ...prev, errorMessage: 'Payment reference is required.' }));
      return;
    }
    if (reference.trim().length > 100) {
      setPaymentModal((prev) => ({ ...prev, errorMessage: 'Reference cannot exceed 100 characters.' }));
      return;
    }
    setPaymentModal((prev) => ({ ...prev, isSubmitting: true, errorMessage: '' }));
    try {
      const res = await updatePaymentStatus(order._id, 'paid', reference.trim());
      if (res?.success) {
        showToast?.('Payment status recorded successfully. Note: this does not process real money.', 'success');
        closePaymentModal();
        await fetchOrders();
      } else {
        setPaymentModal((prev) => ({
          ...prev,
          isSubmitting: false,
          errorMessage: res?.message || 'Failed to record payment.',
        }));
      }
    } catch (err) {
      setPaymentModal((prev) => ({
        ...prev,
        isSubmitting: false,
        errorMessage:
          err.response?.data?.message ||
          err.message ||
          'Failed to record payment.',
      }));
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading your procurement orders..." />;
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
          <h2 className="page-heading">Procurement Orders</h2>
          <p className="page-subheading">
            Track accepted offers, delivery progress, and record payment confirmations for your purchases.
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
        <div
          className="alert-box alert-error"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}
        >
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
          description="When a farmer accepts one of your procurement offers, an order will appear here automatically."
          actionLabel="Browse Available Crops"
          onAction={() => window.location.assign('/browse-crops')}
        />
      ) : (
        <>
          {activeOrders.length > 0 && (
            <div className="dashboard-section-box" style={{ marginBottom: '24px' }}>
              <div className="section-box-header">
                <div>
                  <h3 className="section-box-title">Active Orders ({activeOrders.length})</h3>
                  <p className="section-box-subtitle">
                    Orders in progress — update status as goods move from farm to your facility.
                  </p>
                </div>
              </div>
              <div className="orders-cards-grid">
                {activeOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onStatusAction={openStatusModal}
                    onPaymentAction={openPaymentModal}
                    expandedId={expandedId}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
              </div>
            </div>
          )}

          {completedOrders.length > 0 && (
            <div className="dashboard-section-box">
              <div className="section-box-header">
                <div>
                  <h3 className="section-box-title">Completed Orders ({completedOrders.length})</h3>
                  <p className="section-box-subtitle">Past settled procurement transactions.</p>
                </div>
              </div>
              <div className="orders-cards-grid">
                {completedOrders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onStatusAction={openStatusModal}
                    onPaymentAction={openPaymentModal}
                    expandedId={expandedId}
                    onToggleExpand={handleToggleExpand}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Status Transition Modal ── */}
      <AnimatePresence>
        {statusModal.isOpen && statusModal.order && (
          <div
            className="modal-backdrop-overlay"
            onClick={closeStatusModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="status-modal-title"
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
                  <h3 className="modal-dialog-title" id="status-modal-title">
                    {statusModal.actionLabel}
                  </h3>
                  <p className="modal-dialog-subtitle">
                    Order #{SHORT_ID(statusModal.order._id)} · {statusModal.order.cropName}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-icon-btn"
                  onClick={closeStatusModal}
                  disabled={statusModal.isSubmitting}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {statusModal.errorMessage && (
                <div className="alert-box alert-error" style={{ margin: '16px 24px 0' }}>
                  <AlertCircle size={16} />
                  <span>{statusModal.errorMessage}</span>
                </div>
              )}

              <div className="modal-body-confirm">
                <div className="confirm-summary-card">
                  <div className="confirm-row">
                    <span className="confirm-key">Farmer:</span>
                    <strong className="confirm-val">
                      {statusModal.order.farmer?.name || 'Farmer'}
                    </strong>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Quantity:</span>
                    <span className="confirm-val tabular-nums">
                      {statusModal.order.quantity} {statusModal.order.unit}
                    </span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Net Amount:</span>
                    <strong className="confirm-val tabular-nums">
                      {formatINR(statusModal.order.netAmount)}
                    </strong>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Moving to:</span>
                    <StatusBadge status={statusModal.targetStatus} type="order" />
                  </div>
                </div>

                <p className="confirm-notice-text">
                  Confirm that the order status should be updated to{' '}
                  <strong>{ORDER_STATUS_META[statusModal.targetStatus]?.label}</strong>.
                  This will be recorded in the order timeline.
                </p>

                <div className="modal-actions-footer">
                  <button
                    type="button"
                    className="btn btn-secondary-action"
                    onClick={closeStatusModal}
                    disabled={statusModal.isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary-action"
                    onClick={handleConfirmStatus}
                    disabled={statusModal.isSubmitting}
                  >
                    {statusModal.isSubmitting ? (
                      <span>Updating...</span>
                    ) : (
                      <span>Confirm Update</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Payment Modal ── */}
      <AnimatePresence>
        {paymentModal.isOpen && paymentModal.order && (
          <div
            className="modal-backdrop-overlay"
            onClick={closePaymentModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-modal-title"
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
                  <h3 className="modal-dialog-title" id="payment-modal-title">
                    Record Payment Confirmation
                  </h3>
                  <p className="modal-dialog-subtitle">
                    Order #{SHORT_ID(paymentModal.order._id)} · {paymentModal.order.cropName}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-icon-btn"
                  onClick={closePaymentModal}
                  disabled={paymentModal.isSubmitting}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {paymentModal.errorMessage && (
                <div className="alert-box alert-error" style={{ margin: '16px 24px 0' }}>
                  <AlertCircle size={16} />
                  <span>{paymentModal.errorMessage}</span>
                </div>
              )}

              <div className="modal-body-confirm">
                <div className="confirm-summary-card">
                  <div className="confirm-row">
                    <span className="confirm-key">Amount:</span>
                    <strong className="confirm-val tabular-nums">
                      {formatINR(paymentModal.order.netAmount)}
                    </strong>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Farmer:</span>
                    <span className="confirm-val">
                      {paymentModal.order.farmer?.name || 'Farmer'}
                    </span>
                  </div>
                </div>

                <div className="payment-ref-notice">
                  <IndianRupee size={14} style={{ flexShrink: 0 }} />
                  <p>
                    <strong>Important:</strong> This records your stated payment reference only.
                    No real transaction is processed through this platform.
                  </p>
                </div>

                <div className="form-field-group" style={{ margin: '16px 0 4px' }}>
                  <label htmlFor="payment-reference-input" className="form-field-label">
                    Payment Reference <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="payment-reference-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. UPI-DEMO-12345"
                    value={paymentModal.reference}
                    onChange={(e) =>
                      setPaymentModal((prev) => ({
                        ...prev,
                        reference: e.target.value,
                        errorMessage: '',
                      }))
                    }
                    maxLength={100}
                    disabled={paymentModal.isSubmitting}
                    autoComplete="off"
                  />
                  <span className="form-field-hint">
                    Enter your UPI transaction ID or bank reference number.
                  </span>
                </div>

                <div className="modal-actions-footer">
                  <button
                    type="button"
                    className="btn btn-secondary-action"
                    onClick={closePaymentModal}
                    disabled={paymentModal.isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary-action"
                    onClick={handleConfirmPayment}
                    disabled={paymentModal.isSubmitting || !paymentModal.reference.trim()}
                  >
                    {paymentModal.isSubmitting ? (
                      <span>Recording...</span>
                    ) : (
                      <>
                        <ShieldCheck size={15} />
                        <span>Confirm Payment</span>
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
