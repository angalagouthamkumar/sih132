import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOutletContext, Link } from 'react-router-dom';
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
  Handshake,
  UserCheck,
  Package,
  X,
  ArrowRight,
  ShieldCheck,
  Send,
} from 'lucide-react';
import {
  createRequirement,
  getMyRequirements,
  updateRequirement,
  deleteRequirement,
  getRequirementOffers,
  updateRequirementOfferStatus,
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

  // Farmer Proposals Modal State
  const [proposalsModal, setProposalsModal] = useState({
    isOpen: false,
    requirement: null,
    proposals: [],
    loading: false,
    error: '',
  });

  // Proposal Accept / Decline Confirmation State
  const [proposalActionConfirm, setProposalActionConfirm] = useState({
    isOpen: false,
    proposal: null,
    targetStatus: 'accepted',
    isSubmitting: false,
    errorMessage: '',
  });

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

    setIsSubmitting(true);
    try {
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
      if (res.success) {
        showToast('Procurement requirement broadcasted successfully!', 'success');
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
        fetchRequirements();
      } else {
        showToast(res.message || 'Failed to create requirement.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Error creating requirement.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    setActionId(item._id);
    const newStatus = item.status === 'active' ? 'closed' : 'active';
    try {
      const res = await updateRequirement(item._id, { status: newStatus });
      if (res.success) {
        showToast(`Requirement marked as ${newStatus}.`, 'info');
        setMyRequirements((prev) =>
          prev.map((r) => (r._id === item._id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.', 'error');
    } finally {
      setActionId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteConfirm({ isOpen: true, id });
  };

  const closeDeleteModal = () => {
    setDeleteConfirm({ isOpen: false, id: null });
  };

  const confirmDeleteRequirement = async () => {
    if (!deleteConfirm.id) return;
    setActionId(deleteConfirm.id);
    try {
      const res = await deleteRequirement(deleteConfirm.id);
      if (res.success) {
        showToast('Requirement deleted successfully.', 'success');
        setMyRequirements((prev) => prev.filter((r) => r._id !== deleteConfirm.id));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete requirement.', 'error');
    } finally {
      setActionId(null);
      closeDeleteModal();
    }
  };

  // Farmer proposals handlers
  const handleOpenProposals = async (requirement) => {
    setProposalsModal({
      isOpen: true,
      requirement,
      proposals: [],
      loading: true,
      error: '',
    });

    try {
      const res = await getRequirementOffers(requirement._id);
      const list = res?.data?.proposals || (Array.isArray(res?.data) ? res.data : []) || [];
      setProposalsModal((prev) => ({
        ...prev,
        proposals: list,
        loading: false,
      }));
    } catch (err) {
      setProposalsModal((prev) => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || 'Failed to load farmer supply proposals.',
      }));
    }
  };

  const handleCloseProposals = () => {
    setProposalsModal({
      isOpen: false,
      requirement: null,
      proposals: [],
      loading: false,
      error: '',
    });
  };

  const handleOpenActionConfirm = (proposal, targetStatus) => {
    setProposalActionConfirm({
      isOpen: true,
      proposal,
      targetStatus,
      isSubmitting: false,
      errorMessage: '',
    });
  };

  const handleCloseActionConfirm = () => {
    if (!proposalActionConfirm.isSubmitting) {
      setProposalActionConfirm({
        isOpen: false,
        proposal: null,
        targetStatus: 'accepted',
        isSubmitting: false,
        errorMessage: '',
      });
    }
  };

  const handleExecuteProposalStatus = async () => {
    const { proposal, targetStatus } = proposalActionConfirm;
    if (!proposal) return;

    setProposalActionConfirm((prev) => ({ ...prev, isSubmitting: true, errorMessage: '' }));

    try {
      const res = await updateRequirementOfferStatus(proposal._id, targetStatus);
      if (res?.success) {
        const actionLabel = targetStatus === 'accepted' ? 'accepted' : 'declined';
        showToast(`Supply proposal from ${proposal.farmer?.name || 'Farmer'} successfully ${actionLabel}!`, 'success');
        handleCloseActionConfirm();

        // Refresh proposals inside the open modal
        if (proposalsModal.requirement?._id) {
          const updatedOffers = await getRequirementOffers(proposalsModal.requirement._id);
          const list = updatedOffers?.data?.proposals || (Array.isArray(updatedOffers?.data) ? updatedOffers.data : []) || [];
          setProposalsModal((prev) => ({ ...prev, proposals: list }));
        }

        // Also refresh requirements list to reflect any fulfilled status
        await fetchRequirements();
      } else {
        setProposalActionConfirm((prev) => ({
          ...prev,
          isSubmitting: false,
          errorMessage: res?.message || 'Failed to update proposal status.',
        }));
      }
    } catch (err) {
      setProposalActionConfirm((prev) => ({
        ...prev,
        isSubmitting: false,
        errorMessage: err.response?.data?.message || err.message || 'Failed to update proposal status.',
      }));
    }
  };

  return (
    <div className="portal-page-container">
      {/* Page Header Banner */}
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">Create Procurement Requirement</h2>
          <p className="page-subheading">
            Broadcast customized agricultural procurement specifications to receive direct harvest bids from verified Telangana farmers.
          </p>
        </div>
      </div>

      <div className="two-column-layout">
        {/* Left Column: Input Form */}
        <div className="layout-left-column">
          <motion.div
            className="card form-card-container"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="card-header-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusSquare size={18} style={{ color: 'var(--primary-700)' }} />
                <h3 className="card-title">Procurement Specifications</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="standard-form-layout" noValidate>
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
                    placeholder="e.g. Cotton, Paddy, Maize, Chilli"
                  />
                  {errors.cropName && <p className="form-error-text">{errors.cropName}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="variety" className="form-label">
                    Grade / Variety Specification <span className="req-star">*</span>
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

              {/* Quality & Processing Notes */}
              <div className="form-group">
                <label htmlFor="qualityNotes" className="form-label">
                  Quality Requirements & Specifications (Optional)
                </label>
                <textarea
                  id="qualityNotes"
                  name="qualityNotes"
                  rows="3"
                  className="form-textarea"
                  value={formData.qualityNotes}
                  onChange={handleChange}
                  placeholder="Specify moisture threshold, staple length, grading standards, packaging requirements..."
                />
              </div>

              <div className="form-actions-row">
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
            <h4 className="guide-title">Procurement Matching & Proposals</h4>
            <p className="guide-text">
              When you post a requirement, registered farmers with available crops matching your specifications can submit direct supply proposals.
            </p>
            <ul className="guide-list">
              <li>
                <strong>Target Price:</strong> State your realistic procurement price per kg.
              </li>
              <li>
                <strong>Farmer Proposals:</strong> Click "Farmer Offers" on any requirement below to review and accept supply bids.
              </li>
              <li>
                <strong>Automatic Orders:</strong> Accepting a proposal creates a confirmed dispatch order and deducts inventory from the farmer's listing.
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
              Manage broadcast requirements, view received farmer proposals, or update operational statuses.
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
            description="Broadcast your first crop procurement requirement using the form above to connect with registered farmers."
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
                              : item.status === 'fulfilled'
                              ? 'status-badge-accepted'
                              : 'status-badge-warning'
                          }`}
                        >
                          {item.status === 'active' ? 'Active' : item.status === 'fulfilled' ? 'Fulfilled' : 'Closed'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          {/* Farmer Offers Action */}
                          <button
                            type="button"
                            className="btn btn-xs btn-primary-action"
                            onClick={() => handleOpenProposals(item)}
                            title="View Farmer Supply Offers"
                          >
                            <Handshake size={12} />
                            <span>Farmer Offers</span>
                          </button>

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

      {/* FARMER PROPOSALS MODAL */}
      <AnimatePresence>
        {proposalsModal.isOpen && proposalsModal.requirement && (
          <div className="modal-backdrop" style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 31, 32, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }} onClick={handleCloseProposals}>
            <motion.div
              className="modal-card"
              style={{
                background: 'var(--surface, #FFFFFF)',
                borderRadius: '12px',
                border: '1px solid var(--border, #E2E8F0)',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 12px 30px rgba(5, 31, 32, 0.2)',
                outline: 'none',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              transition={{ duration: 0.2 }}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                background: 'var(--canvas)',
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--forest-950)' }}>
                    Farmer Supply Offers
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    Proposals submitted by farmers for <strong>{proposalsModal.requirement.cropName}</strong> ({proposalsModal.requirement.variety}) · Need: {proposalsModal.requirement.quantity} {proposalsModal.requirement.unit} @ ₹{proposalsModal.requirement.targetPricePerKg}/kg
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseProposals}
                  aria-label="Close"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    padding: '4px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
                {proposalsModal.loading ? (
                  <PageLoader message="Loading received farmer proposals..." />
                ) : proposalsModal.error ? (
                  <div className="alert-box alert-error">
                    <AlertCircle size={16} />
                    <span>{proposalsModal.error}</span>
                  </div>
                ) : proposalsModal.proposals.length === 0 ? (
                  <EmptyState
                    icon={Handshake}
                    title="No Farmer Proposals Received Yet"
                    description={`No farmers have submitted supply proposals for this ${proposalsModal.requirement.cropName} requirement yet. When farmers respond from their harvest, proposals will appear here.`}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {proposalsModal.proposals.map((p) => {
                      const farmerName = p.farmer?.name || 'Farmer';
                      const isVerified = p.farmer?.verificationStatus === 'verified';
                      const status = p.status || 'pending';

                      return (
                        <div
                          key={p._id}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            padding: '16px 18px',
                            background: 'var(--surface)',
                            boxShadow: 'var(--shadow-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong style={{ fontSize: '1.05rem', color: 'var(--forest-950)' }}>{farmerName}</strong>
                                <span className={`status-badge-pill ${isVerified ? 'status-badge-success' : 'status-badge-pending'}`} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                                  {isVerified ? <ShieldCheck size={11} /> : <Clock size={11} />}
                                  <span>{isVerified ? 'Verified Farmer' : 'Verification Pending'}</span>
                                </span>
                              </div>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Harvest lot: {p.crop?.name} ({p.crop?.variety}) · Location: {p.farmer?.location || 'Telangana'}
                              </span>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span className="tabular-nums" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--forest-950)' }}>
                                {formatINR(p.offeredPricePerKg)}
                                <small style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/kg</small>
                              </span>
                            </div>
                          </div>

                          {/* Commercial Specs */}
                          <div style={{
                            margin: '12px 0',
                            padding: '12px 14px',
                            borderRadius: '8px',
                            background: 'var(--canvas)',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                            gap: '10px',
                            fontSize: '0.82rem',
                          }}>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem' }}>Offered Volume</span>
                              <strong>{p.quantity} {p.unit}</strong>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem' }}>Gross Total</span>
                              <span className="tabular-nums font-semibold">{formatINR(p.grossAmount)}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem' }}>Transport Cost</span>
                              <span className="tabular-nums">{p.transportCost > 0 ? formatINR(p.transportCost) : '₹0'}</span>
                            </div>
                            <div>
                              <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.72rem' }}>Other Charges</span>
                              <span className="tabular-nums">{p.otherCharges > 0 ? formatINR(p.otherCharges) : '₹0'}</span>
                            </div>
                            <div style={{ gridColumn: '1 / -1', paddingTop: '6px', borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Farmer Net Realization:</span>
                              <strong className="tabular-nums" style={{ color: 'var(--forest-800)', fontSize: '0.95rem' }}>{formatINR(p.netRealization)}</strong>
                            </div>
                          </div>

                          {p.message && (
                            <p style={{ margin: '8px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                              "{p.message}"
                            </p>
                          )}

                          {/* Status and Action Row */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingTop: '10px',
                            borderTop: '1px solid var(--border)',
                            flexWrap: 'wrap',
                            gap: '10px',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={`status-badge-pill ${
                                status === 'accepted'
                                  ? 'status-badge-success'
                                  : status === 'rejected'
                                  ? 'status-badge-danger'
                                  : 'status-badge-pending'
                              }`}>
                                {status === 'accepted' ? <CheckCircle2 size={12} /> : status === 'rejected' ? <XCircle size={12} /> : <Clock size={12} />}
                                <span style={{ textTransform: 'capitalize' }}>{status === 'rejected' ? 'Declined' : status}</span>
                              </span>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                                {formatDate(p.createdAt)}
                              </span>
                            </div>

                            <div>
                              {status === 'pending' ? (
                                <div style={{ display: 'inline-flex', gap: '8px' }}>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-secondary-action"
                                    style={{ color: 'var(--error-text)' }}
                                    onClick={() => handleOpenActionConfirm(p, 'rejected')}
                                  >
                                    <XCircle size={13} />
                                    <span>Decline</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary-action"
                                    onClick={() => handleOpenActionConfirm(p, 'accepted')}
                                  >
                                    <CheckCircle2 size={13} />
                                    <span>Accept Offer</span>
                                  </button>
                                </div>
                              ) : status === 'accepted' ? (
                                <Link to="/orders" className="btn btn-sm btn-secondary-action">
                                  <span>View in Orders</span>
                                  <ArrowRight size={13} />
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                background: 'var(--canvas)',
              }}>
                <button
                  type="button"
                  className="btn btn-secondary-action"
                  onClick={handleCloseProposals}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog for Accept / Decline Proposal */}
      <AnimatePresence>
        {proposalActionConfirm.isOpen && proposalActionConfirm.proposal && (
          <div className="modal-backdrop" style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 31, 32, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px',
          }} onClick={handleCloseActionConfirm}>
            <motion.div
              className="modal-card"
              style={{
                background: 'var(--surface, #FFFFFF)',
                borderRadius: '12px',
                border: '1px solid var(--border, #E2E8F0)',
                maxWidth: '460px',
                width: '100%',
                padding: '24px',
                boxShadow: '0 12px 30px rgba(5, 31, 32, 0.25)',
                outline: 'none',
              }}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <h3 style={{ margin: '0 0 10px', fontSize: '1.2rem', color: 'var(--forest-950)' }}>
                {proposalActionConfirm.targetStatus === 'accepted'
                  ? 'Accept Farmer Supply Offer?'
                  : 'Decline Farmer Supply Offer?'}
              </h3>

              {proposalActionConfirm.errorMessage && (
                <div className="alert-box alert-error" style={{ marginBottom: '14px' }}>
                  <AlertCircle size={15} />
                  <span>{proposalActionConfirm.errorMessage}</span>
                </div>
              )}

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
                {proposalActionConfirm.targetStatus === 'accepted' ? (
                  <>
                    Accepting this supply offer from <strong>{proposalActionConfirm.proposal.farmer?.name || 'Farmer'}</strong> will lock the agreement, deduct <strong>{proposalActionConfirm.proposal.quantity} {proposalActionConfirm.proposal.unit}</strong> from the farmer's crop inventory, and create a <strong>confirmed procurement order</strong> at <strong>₹{proposalActionConfirm.proposal.offeredPricePerKg}/kg</strong>.
                  </>
                ) : (
                  <>
                    Are you sure you want to decline this supply proposal from <strong>{proposalActionConfirm.proposal.farmer?.name || 'Farmer'}</strong>? This action cannot be reversed.
                  </>
                )}
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary-action"
                  onClick={handleCloseActionConfirm}
                  disabled={proposalActionConfirm.isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${proposalActionConfirm.targetStatus === 'accepted' ? 'btn-primary-action' : 'btn-danger-action'}`}
                  style={{
                    backgroundColor: proposalActionConfirm.targetStatus === 'accepted' ? 'var(--forest-800)' : '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                  }}
                  onClick={handleExecuteProposalStatus}
                  disabled={proposalActionConfirm.isSubmitting}
                >
                  {proposalActionConfirm.isSubmitting
                    ? 'Processing...'
                    : proposalActionConfirm.targetStatus === 'accepted'
                    ? 'Confirm & Create Order'
                    : 'Confirm & Decline'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accessible Confirmation Modal for Delete */}
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
