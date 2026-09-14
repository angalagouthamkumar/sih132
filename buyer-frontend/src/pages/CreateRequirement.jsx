import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import {
  PlusSquare,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  IndianRupee,
  RefreshCw,
  PowerOff,
  Power,
  XCircle,
} from 'lucide-react';
import {
  createRequirement,
  getMyRequirements,
  updateRequirement,
  deleteRequirement,
} from '../services/requirementService';
import { formatINR, formatDate } from '../utils/formatters';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';

const UNITS = ['kg', 'quintal', 'tonne'];

export default function CreateRequirement() {
  const { showToast } = useOutletContext();

  const [formData, setFormData] = useState({
    cropName: '',
    variety: '',
    quantity: '',
    unit: 'quintal',
    targetPricePerKg: '',
    deliveryLocation: '',
    requiredDate: '',
    qualityNotes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequirements, setMyRequirements] = useState([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, id: null });

  const fetchRequirements = async () => {
    try {
      setLoadingReqs(true);
      const res = await getMyRequirements();
      const list = res?.data || [];
      setMyRequirements(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load my requirements:', err);
    } finally {
      setLoadingReqs(false);
    }
  };

  useEffect(() => {
    fetchRequirements();
  }, []);

  const validate = () => {
    const errs = {};
    if (!formData.cropName.trim()) errs.cropName = 'Crop name is required.';
    if (!formData.variety.trim()) errs.variety = 'Variety or grade specification is required.';

    const qty = Number(formData.quantity);
    if (!formData.quantity || isNaN(qty) || qty <= 0)
      errs.quantity = 'Enter a valid positive quantity.';

    const price = Number(formData.targetPricePerKg);
    if (!formData.targetPricePerKg || isNaN(price) || price <= 0)
      errs.targetPricePerKg = 'Enter a valid target price per kilogram.';

    if (!formData.deliveryLocation.trim())
      errs.deliveryLocation = 'Delivery location is required.';

    if (!formData.requiredDate)
      errs.requiredDate = 'Required delivery date is required.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        cropName: formData.cropName.trim(),
        variety: formData.variety.trim(),
        quantity: Number(formData.quantity),
        unit: formData.unit,
        targetPricePerKg: Number(formData.targetPricePerKg),
        deliveryLocation: formData.deliveryLocation.trim(),
        requiredDate: formData.requiredDate,
        qualityNotes: formData.qualityNotes.trim(),
      };

      const res = await createRequirement(payload);
      if (res?.success) {
        showToast('Buying requirement broadcast successfully!', 'success');
        handleReset();
        fetchRequirements();
      } else {
        showToast(res?.message || 'Failed to post requirement.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error creating requirement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (reqItem) => {
    try {
      setActionId(reqItem._id);
      const newStatus = reqItem.status === 'active' ? 'closed' : 'active';
      const res = await updateRequirement(reqItem._id, { status: newStatus });
      if (res?.success) {
        showToast(`Requirement status updated to ${newStatus}.`, 'success');
        fetchRequirements();
      } else {
        showToast(res?.message || 'Failed to update requirement status.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error updating status.', 'error');
    } finally {
      setActionId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const closeDeleteModal = () => {
    if (!actionId) {
      setDeleteConfirm({ isOpen: false, id: null });
    }
  };

  const confirmDeleteRequirement = async () => {
    const { id } = deleteConfirm;
    if (!id) return;
    try {
      setActionId(id);
      const res = await deleteRequirement(id);
      if (res?.success) {
        showToast('Requirement deleted successfully.', 'success');
        fetchRequirements();
        setDeleteConfirm({ isOpen: false, id: null });
      } else {
        showToast(res?.message || 'Failed to delete requirement.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error deleting requirement.', 'error');
    } finally {
      setActionId(null);
    }
  };

  const handleReset = () => {
    setFormData({
      cropName: '',
      variety: '',
      quantity: '',
      unit: 'quintal',
      targetPricePerKg: '',
      deliveryLocation: '',
      requiredDate: '',
      qualityNotes: '',
    });
    setErrors({});
  };

  return (
    <div className="portal-page-container">
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">Buying Requirements</h2>
          <p className="page-subheading">
            Broadcast procurement specifications to registered farmers and manage your active buying requirements.
          </p>
        </div>
      </div>

      <div className="two-column-layout">
        {/* Left Form: Create Requirement */}
        <div className="layout-left-column">
          <motion.div
            className="card form-card-container"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="card-header" style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusSquare size={18} color="var(--forest-800)" />
                <h3 className="card-title">Post New Produce Requirement</h3>
              </div>
              <p className="card-subtitle">
                Enter target volumes and desired procurement terms to match registered farmers.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Row 1: Crop Name & Variety */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="cropName" className="form-label">
                    Crop Name <span className="req-star">*</span>
                  </label>
                  <input
                    id="cropName"
                    name="cropName"
                    type="text"
                    className={`form-input ${errors.cropName ? 'form-input-error' : ''}`}
                    value={formData.cropName}
                    onChange={handleChange}
                    placeholder="e.g. Paddy, Red Chilli, Cotton, Maize"
                  />
                  {errors.cropName && <p className="form-error-text">{errors.cropName}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="variety" className="form-label">
                    Variety / Grade Specification <span className="req-star">*</span>
                  </label>
                  <input
                    id="variety"
                    name="variety"
                    type="text"
                    className={`form-input ${errors.variety ? 'form-input-error' : ''}`}
                    value={formData.variety}
                    onChange={handleChange}
                    placeholder="e.g. Sona Masoori, Stemless Teja, Shankar-6"
                  />
                  {errors.variety && <p className="form-error-text">{errors.variety}</p>}
                </div>
              </div>

              {/* Row 2: Quantity & Unit */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="quantity" className="form-label">
                    Required Quantity <span className="req-star">*</span>
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    step="any"
                    className={`form-input ${errors.quantity ? 'form-input-error' : ''}`}
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g. 200"
                  />
                  {errors.quantity && <p className="form-error-text">{errors.quantity}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="unit" className="form-label">
                    Unit of Measure <span className="req-star">*</span>
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    className="form-select"
                    value={formData.unit}
                    onChange={handleChange}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u.charAt(0).toUpperCase() + u.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Target Price & Delivery Date */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="targetPricePerKg" className="form-label">
                    Target Price (₹ / kg) <span className="req-star">*</span>
                  </label>
                  <div className="input-currency-wrapper">
                    <span className="currency-prefix">₹</span>
                    <input
                      id="targetPricePerKg"
                      name="targetPricePerKg"
                      type="number"
                      min="1"
                      step="any"
                      className={`form-input input-with-symbol ${errors.targetPricePerKg ? 'form-input-error' : ''}`}
                      value={formData.targetPricePerKg}
                      onChange={handleChange}
                      placeholder="e.g. 30"
                    />
                  </div>
                  {errors.targetPricePerKg && (
                    <p className="form-error-text">{errors.targetPricePerKg}</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="requiredDate" className="form-label">
                    Required Delivery Date <span className="req-star">*</span>
                  </label>
                  <input
                    id="requiredDate"
                    name="requiredDate"
                    type="date"
                    className={`form-input ${errors.requiredDate ? 'form-input-error' : ''}`}
                    value={formData.requiredDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.requiredDate && (
                    <p className="form-error-text">{errors.requiredDate}</p>
                  )}
                </div>
              </div>

              {/* Delivery Location */}
              <div className="form-group">
                <label htmlFor="deliveryLocation" className="form-label">
                  Delivery / Processing Location <span className="req-star">*</span>
                </label>
                <input
                  id="deliveryLocation"
                  name="deliveryLocation"
                  type="text"
                  className={`form-input ${errors.deliveryLocation ? 'form-input-error' : ''}`}
                  value={formData.deliveryLocation}
                  onChange={handleChange}
                  placeholder="e.g. Hyderabad Warehouse, Medchal Industrial Area"
                />
                {errors.deliveryLocation && (
                  <p className="form-error-text">{errors.deliveryLocation}</p>
                )}
              </div>

              {/* Quality Notes */}
              <div className="form-group">
                <label htmlFor="qualityNotes" className="form-label">
                  Quality Specifications / Moisture Guidelines (Optional)
                </label>
                <textarea
                  id="qualityNotes"
                  name="qualityNotes"
                  rows="3"
                  className="form-textarea"
                  value={formData.qualityNotes}
                  onChange={handleChange}
                  placeholder="e.g. Moisture content below 14%, clean harvested lots only, no foreign seed mixtures."
                  maxLength="500"
                />
                <small className="form-hint" style={{ display: 'block', textAlign: 'right' }}>
                  {formData.qualityNotes.length}/500 chars
                </small>
              </div>

              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn btn-secondary-action"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="btn btn-primary-action"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin-animation" />
                      <span>Broadcasting Requirement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Broadcast Requirement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Right Column: Information & Guidelines */}
        <div className="layout-right-column">
          <div className="card guide-card">
            <h4 className="guide-title">Procurement Matching</h4>
            <p className="guide-text">
              When you post a requirement, registered farmers with available crop lots of matching crops will be able to review your target volume and location.
            </p>
            <ul className="guide-list">
              <li>
                <strong>Target Price:</strong> State your realistic procurement price per kg.
              </li>
              <li>
                <strong>Delivery Date:</strong> Specify your warehouse intake deadline.
              </li>
              <li>
                <strong>Active / Closed:</strong> You can close requirements once your buying quota is met.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* SECTION: My Posted Requirements Table */}
      <div className="dashboard-section-box" style={{ marginTop: '36px' }}>
        <div className="section-box-header">
          <div>
            <h3 className="section-box-title">My Posted Requirements</h3>
            <p className="section-box-subtitle">
              Manage broadcast requirements, update operational statuses, or delete fulfilled inquiries.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-secondary-action"
            onClick={fetchRequirements}
            disabled={loadingReqs}
          >
            <RefreshCw size={14} className={loadingReqs ? 'spin-animation' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {loadingReqs ? (
          <PageLoader />
        ) : myRequirements.length === 0 ? (
          <EmptyState
            title="No Requirements Posted Yet"
            description="Broadcast your first crop procurement requirement using the form above to connect with verified farmers."
          />
        ) : (
          <div className="card table-card-container">
            <div className="table-responsive">
              <table className="portal-table">
                <thead>
                  <tr>
                    <th>Crop / Variety</th>
                    <th>Target Price</th>
                    <th>Volume</th>
                    <th>Delivery Location</th>
                    <th>Required Date</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myRequirements.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <span className="table-highlight-text">{item.cropName}</span>
                        <span className="table-sub-text">{item.variety}</span>
                      </td>
                      <td className="tabular-nums font-semibold">
                        ₹{item.targetPricePerKg} <small>/ kg</small>
                      </td>
                      <td className="tabular-nums">
                        {item.quantity} {item.unit}
                      </td>
                      <td style={{ maxWidth: '180px', fontSize: '0.85rem' }}>
                        {item.deliveryLocation}
                      </td>
                      <td className="tabular-nums" style={{ fontSize: '0.85rem' }}>
                        {formatDate(item.requiredDate)}
                      </td>
                      <td>
                        <span
                          className={`status-badge-pill ${
                            item.status === 'active'
                              ? 'status-badge-success'
                              : 'status-badge-warning'
                          }`}
                        >
                          {item.status === 'active' ? 'Active' : 'Closed'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-xs btn-secondary-action"
                            onClick={() => handleToggleStatus(item)}
                            disabled={actionId === item._id}
                            title={item.status === 'active' ? 'Close requirement' : 'Reactivate requirement'}
                          >
                            {item.status === 'active' ? (
                              <>
                                <PowerOff size={12} />
                                <span>Close</span>
                              </>
                            ) : (
                              <>
                                <Power size={12} />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn btn-xs btn-secondary-action"
                            style={{ color: 'var(--error-text)', borderColor: 'var(--error-border)' }}
                            onClick={() => openDeleteModal(item._id)}
                            disabled={actionId === item._id}
                            title="Delete requirement"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Accessible Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDeleteRequirement}
        loading={actionId === deleteConfirm.id}
        title="Delete Requirement"
        message="Are you sure you want to remove this requirement? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
