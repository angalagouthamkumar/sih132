import { useState, useEffect } from 'react';
import { getMarketData, createMarketData, updateMarketData, deleteMarketData } from '../services/marketService';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

const initialForm = {
  crop: '',
  variety: '',
  marketName: '',
  district: '',
  minPricePerKg: '',
  maxPricePerKg: '',
  modalPricePerKg: '',
  distanceKm: '',
  transportCost: '',
  marketFee: '',
  demand: 'medium',
  trend: 'stable',
  priceDate: new Date().toISOString().split('T')[0],
};

const MarketData = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Delete Confirmation
  const [deleteModalState, setDeleteModalState] = useState({ isOpen: false, record: null });
  const [deleteError, setDeleteError] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getMarketData();
      if (res.success) {
        setRecords(res.data);
      } else {
        setError(res.message || 'Failed to load market data.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load market data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openForm = (record = null) => {
    setFormError('');
    if (record) {
      setEditingId(record._id);
      setFormData({
        ...record,
        priceDate: new Date(record.priceDate).toISOString().split('T')[0],
      });
    } else {
      setEditingId(null);
      setFormData(initialForm);
    }
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormData(initialForm);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setActionLoading(true);

    const payload = {
      ...formData,
      minPricePerKg:   Number(formData.minPricePerKg),
      maxPricePerKg:   Number(formData.maxPricePerKg),
      modalPricePerKg: Number(formData.modalPricePerKg),
      distanceKm:      Number(formData.distanceKm),
      transportCost:   Number(formData.transportCost),
      marketFee:       Number(formData.marketFee),
    };

    try {
      if (editingId) {
        await updateMarketData(editingId, payload);
      } else {
        await createMarketData(payload);
      }
      await fetchRecords();
      closeForm();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save market data.');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    const { record } = deleteModalState;
    if (!record) return;
    setActionLoading(true);
    setDeleteError('');
    try {
      await deleteMarketData(record._id);
      await fetchRecords();
      setDeleteModalState({ isOpen: false, record: null });
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete record.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header-row">
        <div>
          <h2>Market Data</h2>
          <p>Manage mandi benchmark price records for the platform.</p>
        </div>
        <button className="btn-primary" onClick={() => openForm()}>
          + Add Market Record
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">{error}</div>
      )}

      {loading ? (
        <PageLoader />
      ) : !error && records.length === 0 ? (
        <EmptyState
          message="No market data records found. Click 'Add Market Record' to create the first benchmark entry."
          icon="📊"
        />
      ) : !error ? (
        <div className="market-records-grid">
          {records.map((record) => (
            <div key={record._id} className="card market-record-card">
              <div className="market-record-header">
                <div>
                  <h3 className="market-record-title">
                    {record.crop} — {record.variety}
                  </h3>
                  <p className="market-record-sub">
                    {record.marketName}, {record.district}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button
                    className="btn-icon"
                    onClick={() => openForm(record)}
                    title="Edit record"
                    aria-label="Edit record"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => {
                      setDeleteError('');
                      setDeleteModalState({ isOpen: true, record });
                    }}
                    title="Delete record"
                    aria-label="Delete record"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <div className="market-record-body">
                <div className="market-stat">
                  <span className="market-stat-label">Modal Price</span>
                  <span className="market-stat-val tabular-nums">
                    ₹{record.modalPricePerKg}/kg
                  </span>
                </div>
                <div className="market-stat">
                  <span className="market-stat-label">Range</span>
                  <span className="market-stat-val tabular-nums">
                    ₹{record.minPricePerKg}–₹{record.maxPricePerKg}
                  </span>
                </div>
                <div className="market-stat">
                  <span className="market-stat-label">Demand</span>
                  <span className="market-stat-val" style={{ textTransform: 'capitalize' }}>
                    {record.demand}
                  </span>
                </div>
                <div className="market-stat">
                  <span className="market-stat-label">Trend</span>
                  <span className="market-stat-val" style={{ textTransform: 'capitalize' }}>
                    {record.trend}
                  </span>
                </div>
                <div className="market-stat" style={{ gridColumn: '1 / -1' }}>
                  <span className="market-stat-label">Costs (Dist: {record.distanceKm} km)</span>
                  <span className="market-stat-val tabular-nums">
                    Transport: ₹{record.transportCost} | Fee: ₹{record.marketFee}
                  </span>
                </div>
              </div>

              <div className="market-record-footer">
                {new Date(record.priceDate).toLocaleDateString('en-IN')}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="form-modal-overlay">
          <div className="form-modal-box">
            <div className="form-modal-header">
              <h3 className="form-modal-title">
                {editingId ? 'Edit Market Record' : 'Add Market Record'}
              </h3>
              <button
                type="button"
                className="btn-icon"
                onClick={closeForm}
                aria-label="Close form"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row form-row-2">
                <div className="form-group">
                  <label className="form-label">Crop</label>
                  <input type="text" name="crop" value={formData.crop}
                    onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Variety</label>
                  <input type="text" name="variety" value={formData.variety}
                    onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Market Name</label>
                  <input type="text" name="marketName" value={formData.marketName}
                    onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">District</label>
                  <input type="text" name="district" value={formData.district}
                    onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Price (₹/kg)</label>
                  <input type="number" step="0.01" min="0" name="minPricePerKg"
                    value={formData.minPricePerKg} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Price (₹/kg)</label>
                  <input type="number" step="0.01" min="0" name="maxPricePerKg"
                    value={formData.maxPricePerKg} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Modal Price (₹/kg)</label>
                  <input type="number" step="0.01" min="0" name="modalPricePerKg"
                    value={formData.modalPricePerKg} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Distance (km)</label>
                  <input type="number" min="0" name="distanceKm"
                    value={formData.distanceKm} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Transport Cost (₹)</label>
                  <input type="number" min="0" name="transportCost"
                    value={formData.transportCost} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Market Fee (₹)</label>
                  <input type="number" min="0" name="marketFee"
                    value={formData.marketFee} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Demand</label>
                  <select name="demand" value={formData.demand} onChange={handleInputChange} required>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Trend</label>
                  <select name="trend" value={formData.trend} onChange={handleInputChange} required>
                    <option value="falling">Falling</option>
                    <option value="stable">Stable</option>
                    <option value="rising">Rising</option>
                  </select>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Price Date</label>
                  <input type="date" name="priceDate" value={formData.priceDate}
                    onChange={handleInputChange} required />
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn-secondary" onClick={closeForm}
                  disabled={actionLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={actionLoading}>
                  {actionLoading ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteError && (
        <div className="alert alert-error" role="alert">{deleteError}</div>
      )}

      <ConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => {
          setDeleteError('');
          setDeleteModalState({ isOpen: false, record: null });
        }}
        onConfirm={confirmDelete}
        loading={actionLoading}
        title="Delete Market Record"
        message={`Delete the record for "${deleteModalState.record?.crop}" at ${deleteModalState.record?.marketName}? This cannot be undone.`}
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
};

export default MarketData;
