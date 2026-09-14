import { useState, useEffect } from 'react';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

const formatINR = (amount) => {
  if (amount == null || isNaN(amount)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const Requirements = () => {
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, item: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchRequirements = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/requirements');
      const list = res.data?.data || [];
      setRequirements(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load requirements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const handleDelete = async () => {
    const { item } = deleteModal;
    if (!item) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.delete(`/requirements/${item._id}`);
      setRequirements((prev) => prev.filter((r) => r._id !== item._id));
      setDeleteModal({ isOpen: false, item: null });
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to delete requirement.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = requirements.filter((r) => {
    const matchesSearch =
      !search ||
      r.cropName?.toLowerCase().includes(search.toLowerCase()) ||
      r.variety?.toLowerCase().includes(search.toLowerCase()) ||
      r.buyer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.buyer?.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      r.deliveryLocation?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalActive = requirements.filter((r) => r.status === 'active').length;
  const totalClosed = requirements.filter((r) => r.status === 'closed').length;

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header-row">
        <div>
          <h2>Buyer Requirements</h2>
          <p>All procurement requirements broadcast by verified buyers on the platform.</p>
        </div>
        <button
          className="btn-secondary"
          onClick={fetchRequirements}
          disabled={loading}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Summary KPIs */}
      {!loading && !error && (
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Total Requirements</div>
            <div className="kpi-value tabular-nums">{requirements.length}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Active</div>
            <div className="kpi-value kpi-value-success tabular-nums">{totalActive}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Closed / Fulfilled</div>
            <div className="kpi-value kpi-value-primary tabular-nums">{totalClosed}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      {!loading && !error && requirements.length > 0 && (
        <div className="filter-bar">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by crop, buyer, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-select-w">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="fulfilled">Fulfilled</option>
            </select>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert-error" role="alert">{error}</div>
      )}

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : !error && filtered.length === 0 ? (
        <EmptyState
          message={
            requirements.length === 0
              ? 'No buyer requirements found. Requirements appear here once buyers post procurement specifications.'
              : 'No requirements match the current filters.'
          }
          icon="📋"
        />
      ) : !error ? (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Commodity</th>
                <th>Buyer</th>
                <th className="td-right">Qty</th>
                <th className="td-right">Target Price</th>
                <th>Delivery Location</th>
                <th>Required By</th>
                <th>Status</th>
                <th className="td-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req._id}>
                  <td>
                    <div className="font-semibold">{req.cropName}</div>
                    <div className="text-xs text-secondary">{req.variety}</div>
                  </td>
                  <td>
                    <div className="font-semibold">
                      {req.buyer?.businessName || req.buyer?.name || '—'}
                    </div>
                    <div className="text-xs text-secondary">{req.buyer?.location || ''}</div>
                  </td>
                  <td className="td-right tabular-nums">
                    {req.quantity} {req.unit}
                  </td>
                  <td className="td-right tabular-nums font-semibold">
                    ₹{req.targetPricePerKg}
                    <small className="text-secondary">/kg</small>
                  </td>
                  <td>
                    <span className="truncate" style={{ maxWidth: '180px' }}>
                      {req.deliveryLocation}
                    </span>
                  </td>
                  <td className="tabular-nums text-secondary">
                    {/* Use requiredDate — the standardised field name */}
                    {formatDate(req.requiredDate)}
                  </td>
                  <td>
                    <StatusBadge status={req.status} />
                  </td>
                  <td className="td-right">
                    <button
                      className="btn-icon btn-icon-danger"
                      onClick={() => setDeleteModal({ isOpen: true, item: req })}
                      title="Delete requirement"
                      aria-label="Delete requirement"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="table-footer">
            Showing {filtered.length} of {requirements.length} requirements
          </div>
        </div>
      ) : null}

      {actionError && (
        <div className="alert alert-error" role="alert">{actionError}</div>
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => {
          setActionError('');
          setDeleteModal({ isOpen: false, item: null });
        }}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Delete Requirement"
        message={`Are you sure you want to delete the requirement for "${deleteModal.item?.cropName}" posted by ${deleteModal.item?.buyer?.businessName || deleteModal.item?.buyer?.name}? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default Requirements;
