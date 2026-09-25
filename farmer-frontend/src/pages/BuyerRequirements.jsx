import React, { useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  ClipboardList,
  IndianRupee,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  X,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  Check,
  Building2,
  Info,
} from 'lucide-react';
import EmptyState from '../components/EmptyState';
import PageLoader from '../components/PageLoader';
import {
  getBuyerRequirements,
  createSupplyOffer,
  getMySupplyProposals,
} from '../services/requirementService';
import { getMyCrops } from '../services/api';
import { formatDate, formatINR } from '../utils/formatters';

export default function BuyerRequirements() {
  const { showToast } = useOutletContext();

  const [activeTab, setActiveTab] = useState('requirements'); // 'requirements' | 'proposals'
  const [requirements, setRequirements] = useState([]);
  const [myProposals, setMyProposals] = useState([]);
  const [myCrops, setMyCrops] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Supply Offer Modal State
  const [offerModal, setOfferModal] = useState({
    isOpen: false,
    requirement: null,
    selectedCropId: '',
    quantity: '',
    offeredPricePerKg: '',
    transportCost: '0',
    otherCharges: '0',
    message: '',
    isSubmitting: false,
    errorMessage: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [reqRes, propRes, cropRes] = await Promise.allSettled([
        getBuyerRequirements(),
        getMySupplyProposals(),
        getMyCrops(),
      ]);

      if (reqRes.status === 'fulfilled') {
        const reqList = Array.isArray(reqRes.value?.data) ? reqRes.value.data : [];
        setRequirements(reqList);
      } else {
        setError(reqRes.reason?.response?.data?.message || 'Failed to load active buyer requirements.');
      }

      if (propRes.status === 'fulfilled') {
        const propList = Array.isArray(propRes.value?.data?.proposals)
          ? propRes.value.data.proposals
          : Array.isArray(propRes.value?.data)
          ? propRes.value.data
          : [];
        setMyProposals(propList);
      }

      if (cropRes.status === 'fulfilled') {
        const rawCrops =
          cropRes.value?.data?.crops ||
          (Array.isArray(cropRes.value?.data) ? cropRes.value.data : []) ||
          cropRes.value?.crops ||
          [];
        // Filter only available crops owned by farmer with positive inventory
        setMyCrops(rawCrops.filter((c) => c.status === 'available' && Number(c.quantity) > 0));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map of requirementId -> existing pending/accepted proposal submitted by this farmer
  const proposalByRequirement = useMemo(() => {
    const map = {};
    myProposals.forEach((p) => {
      const reqId = p.requirement?._id || p.requirement;
      if (reqId) {
        map[reqId] = p;
      }
    });
    return map;
  }, [myProposals]);

  // Filter requirements
  const filteredRequirements = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return requirements;
    return requirements.filter((item) =>
      [item.cropName, item.variety, item.deliveryLocation, item.buyer?.businessName, item.buyer?.name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [requirements, search]);

  // Filter proposals
  const filteredProposals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return myProposals;
    return myProposals.filter((p) =>
      [
        p.requirement?.cropName,
        p.requirement?.variety,
        p.crop?.name,
        p.crop?.variety,
        p.buyer?.businessName,
        p.buyer?.name,
        p.status,
      ]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(query))
    );
  }, [myProposals, search]);

  // Get eligible crops for a requirement (exact crop name match + available inventory)
  const getEligibleCropsForReq = (req) => {
    if (!req?.cropName) return [];
    const normalizedReqName = req.cropName.trim().toLowerCase();
    return myCrops.filter((c) => c.name.trim().toLowerCase() === normalizedReqName);
  };

  // Handle opening supply offer modal
  const handleOpenOfferModal = (req) => {
    const eligibleCrops = getEligibleCropsForReq(req);
    if (eligibleCrops.length === 0) {
      return; // Safeguard: disabled when no eligible crop exists
    }

    // Auto-select exact variety match if available, otherwise first eligible lot
    const exactVarietyMatch = eligibleCrops.find(
      (c) => c.variety.trim().toLowerCase() === req.variety.trim().toLowerCase()
    );
    const chosenCrop = exactVarietyMatch || eligibleCrops[0];

    const initialQuantity = chosenCrop
      ? Math.min(Number(chosenCrop.quantity) || 0, Number(req.quantity) || 0)
      : '';
    const initialPrice = req.targetPricePerKg ? String(req.targetPricePerKg) : '';

    setOfferModal({
      isOpen: true,
      requirement: req,
      selectedCropId: chosenCrop ? chosenCrop._id : '',
      quantity: initialQuantity ? String(initialQuantity) : '',
      offeredPricePerKg: initialPrice,
      transportCost: '0',
      otherCharges: '0',
      message: '',
      isSubmitting: false,
      errorMessage: '',
    });
  };

  const handleCloseOfferModal = () => {
    if (!offerModal.isSubmitting) {
      setOfferModal((prev) => ({
        ...prev,
        isOpen: false,
        requirement: null,
        errorMessage: '',
      }));
    }
  };

  // Selected crop for calculation preview
  const selectedCrop = useMemo(() => {
    return myCrops.find((c) => c._id === offerModal.selectedCropId) || null;
  }, [myCrops, offerModal.selectedCropId]);

  // Eligible crops for current modal requirement
  const modalEligibleCrops = useMemo(() => {
    return getEligibleCropsForReq(offerModal.requirement);
  }, [myCrops, offerModal.requirement]);

  // Live financial calculations in modal
  const financialPreview = useMemo(() => {
    const unit = selectedCrop?.unit || 'kg';
    const multiplier = unit === 'tonne' ? 1000 : unit === 'quintal' ? 100 : 1;
    const qty = Number(offerModal.quantity) || 0;
    const price = Number(offerModal.offeredPricePerKg) || 0;
    const transport = Number(offerModal.transportCost) || 0;
    const other = Number(offerModal.otherCharges) || 0;

    const quantityKg = qty * multiplier;
    const gross = Math.round(price * quantityKg * 100) / 100;
    const net = Math.max(0, Math.round((gross - transport - other) * 100) / 100);
    const netPerKg = quantityKg > 0 ? Math.round((net / quantityKg) * 100) / 100 : 0;

    return {
      quantityKg,
      unit,
      gross,
      transport,
      other,
      net,
      netPerKg,
    };
  }, [selectedCrop, offerModal.quantity, offerModal.offeredPricePerKg, offerModal.transportCost, offerModal.otherCharges]);

  // Submit supply offer
  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    const req = offerModal.requirement;
    if (!req) return;

    if (!offerModal.selectedCropId) {
      setOfferModal((prev) => ({ ...prev, errorMessage: 'Please select an available crop from your harvest.' }));
      return;
    }

    const qty = Number(offerModal.quantity);
    if (!offerModal.quantity || isNaN(qty) || qty <= 0) {
      setOfferModal((prev) => ({ ...prev, errorMessage: 'Please enter a valid positive quantity.' }));
      return;
    }

    if (selectedCrop && qty > selectedCrop.quantity) {
      setOfferModal((prev) => ({
        ...prev,
        errorMessage: `Offered quantity cannot exceed your available crop quantity (${selectedCrop.quantity} ${selectedCrop.unit}).`,
      }));
      return;
    }

    const price = Number(offerModal.offeredPricePerKg);
    if (!offerModal.offeredPricePerKg || isNaN(price) || price <= 0) {
      setOfferModal((prev) => ({ ...prev, errorMessage: 'Please enter a valid offered price per kg greater than 0.' }));
      return;
    }

    const transport = Number(offerModal.transportCost);
    if (isNaN(transport) || transport < 0) {
      setOfferModal((prev) => ({ ...prev, errorMessage: 'Transport cost cannot be negative.' }));
      return;
    }

    const other = Number(offerModal.otherCharges);
    if (isNaN(other) || other < 0) {
      setOfferModal((prev) => ({ ...prev, errorMessage: 'Other charges cannot be negative.' }));
      return;
    }

    if (offerModal.message && offerModal.message.length > 300) {
      setOfferModal((prev) => ({ ...prev, errorMessage: 'Message cannot exceed 300 characters.' }));
      return;
    }

    setOfferModal((prev) => ({ ...prev, isSubmitting: true, errorMessage: '' }));

    try {
      const payload = {
        requirementId: req._id,
        cropId: offerModal.selectedCropId,
        quantity: qty,
        offeredPricePerKg: price,
        transportCost: transport || 0,
        otherCharges: other || 0,
        message: offerModal.message.trim(),
      };

      const response = await createSupplyOffer(payload);
      if (response?.success) {
        showToast(`Supply proposal for ${req.cropName} submitted successfully to ${req.buyer?.businessName || 'buyer'}!`, 'success');
        handleCloseOfferModal();
        await loadData();
      } else {
        setOfferModal((prev) => ({
          ...prev,
          isSubmitting: false,
          errorMessage: response?.message || 'Failed to submit supply offer.',
        }));
      }
    } catch (err) {
      setOfferModal((prev) => ({
        ...prev,
        isSubmitting: false,
        errorMessage: err.response?.data?.message || err.message || 'Failed to submit supply proposal. Please try again.',
      }));
    }
  };

  if (loading) return <PageLoader message="Loading active buyer requirements..." />;

  return (
    <div className="portal-page-container">
      {/* Page Header */}
      <div className="page-title-banner requirements-page-header">
        <div>
          <h2 className="page-heading">Buyer Procurement Requirements</h2>
          <p className="page-subheading">
            Review active procurement demand from verified commercial buyers and submit supply proposals directly from your harvest.
          </p>
        </div>
        <button type="button" className="btn btn-secondary-action" onClick={loadData}>
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs & Search Toolbar */}
      <div className="filter-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div className="filter-tabs-group">
          <button
            type="button"
            className={`filter-tab-btn ${activeTab === 'requirements' ? 'active' : ''}`}
            onClick={() => setActiveTab('requirements')}
          >
            <span>Active Buyer Requirements</span>
            <span className="tab-count-badge tabular-nums">({requirements.length})</span>
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${activeTab === 'proposals' ? 'active' : ''}`}
            onClick={() => setActiveTab('proposals')}
          >
            <span>My Submitted Proposals</span>
            <span className="tab-count-badge tabular-nums">({myProposals.length})</span>
          </button>
        </div>

        <div className="filter-search-box" style={{ width: 'min(100%, 360px)' }}>
          <Search size={16} className="search-icon" />
          <label className="sr-only" htmlFor="requirement-search">Search</label>
          <input
            id="requirement-search"
            className="filter-search-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={activeTab === 'requirements' ? 'Search crop, variety, buyer or location' : 'Search proposals'}
          />
        </div>
      </div>

      {error && (
        <div className="alert-box alert-error requirements-error" role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button type="button" className="btn btn-secondary-action" onClick={loadData}>Retry</button>
        </div>
      )}

      {/* TAB 1: ACTIVE REQUIREMENTS */}
      {activeTab === 'requirements' && (
        <>
          {!error && filteredRequirements.length > 0 ? (
            <div className="requirements-grid">
              {filteredRequirements.map((item) => {
                const existingProposal = proposalByRequirement[item._id];
                const matchingCrops = getEligibleCropsForReq(item);
                const hasMatchingCrops = matchingCrops.length > 0;

                return (
                  <article className="requirement-card" key={item._id}>
                    <div className="requirement-card-head">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="requirement-status">Active Requirement</span>
                          {hasMatchingCrops ? (
                            <span className="badge-match" title="You have matching crop listings in your inventory">
                              <Sparkles size={11} />
                              <span>{matchingCrops.length} Matching Crop Lot{matchingCrops.length > 1 ? 's' : ''}</span>
                            </span>
                          ) : (
                            <span className="badge-no-match" title="No matching produce currently listed in My Crops">
                              <Info size={11} />
                              <span>No Matching Crop</span>
                            </span>
                          )}
                        </div>
                        <h3>{item.cropName}</h3>
                        <p>{item.variety}</p>
                      </div>
                      <div className="requirement-price tabular-nums">
                        {formatINR(item.targetPricePerKg)}<small>/kg</small>
                      </div>
                    </div>

                    <dl className="requirement-details">
                      <div><dt><Package size={15} /> Quantity</dt><dd>{item.quantity} {item.unit}</dd></div>
                      <div><dt><MapPin size={15} /> Delivery</dt><dd>{item.deliveryLocation}</dd></div>
                      <div><dt><Calendar size={15} /> Required by</dt><dd>{formatDate(item.requiredDate)}</dd></div>
                      <div><dt><IndianRupee size={15} /> Buyer</dt><dd>{item.buyer?.businessName || item.buyer?.name || 'Registered buyer'}</dd></div>
                    </dl>

                    {item.qualityNotes && <p className="requirement-notes">{item.qualityNotes}</p>}

                    <div className="requirement-verification">
                      Buyer status: {item.buyer?.verificationStatus === 'verified' ? 'Verified Buyer' : 'Verification pending'}
                    </div>

                    {/* Action Bar */}
                    <div className="requirement-card-footer">
                      {existingProposal ? (
                        <div className="proposal-existing-pill">
                          {existingProposal.status === 'pending' ? (
                            <>
                              <Clock size={14} style={{ color: '#d97706' }} />
                              <span>Proposal Pending (₹{existingProposal.offeredPricePerKg}/kg)</span>
                            </>
                          ) : existingProposal.status === 'accepted' ? (
                            <>
                              <CheckCircle2 size={14} style={{ color: '#059669' }} />
                              <span>Proposal Accepted · Order Created</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={14} style={{ color: '#dc2626' }} />
                              <span>Proposal Declined</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: hasMatchingCrops ? 'var(--forest-800)' : 'var(--text-muted)' }}>
                          {hasMatchingCrops
                            ? `✓ Ready to fulfill (${matchingCrops.reduce((acc, c) => acc + c.quantity, 0)} ${matchingCrops[0]?.unit} in stock)`
                            : `Add ${item.cropName} to My Crops to offer`}
                        </div>
                      )}

                      <div className="requirement-card-actions">
                        {existingProposal ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary-action"
                            onClick={() => setActiveTab('proposals')}
                          >
                            <span>View Proposal</span>
                          </button>
                        ) : hasMatchingCrops ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary-action"
                            onClick={() => handleOpenOfferModal(item)}
                          >
                            <Send size={14} />
                            <span>Submit Supply Offer</span>
                          </button>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary-action"
                              disabled
                              title={`You do not have active ${item.cropName} in your harvest inventory`}
                              style={{ opacity: 0.6, cursor: 'not-allowed' }}
                            >
                              <span>No Eligible Crop</span>
                            </button>
                            <Link
                              to="/add-crop"
                              className="btn btn-sm btn-secondary-action"
                              title={`List ${item.cropName} in your harvest`}
                            >
                              <PlusCircle size={13} />
                              <span>List Crop</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : !error ? (
            <EmptyState
              icon={ClipboardList}
              title={requirements.length ? 'No matching requirements' : 'No active buyer requirements'}
              description={requirements.length
                ? 'Try a different crop, buyer or location search.'
                : 'New requirements will appear here when buyers publish active procurement needs.'}
              actionLabel={requirements.length ? 'Clear Search' : 'Refresh'}
              onAction={requirements.length ? () => setSearch('') : loadData}
            />
          ) : null}
        </>
      )}

      {/* TAB 2: MY SUBMITTED PROPOSALS */}
      {activeTab === 'proposals' && (
        <>
          {filteredProposals.length > 0 ? (
            <div className="proposals-grid-display">
              {filteredProposals.map((proposal) => {
                const reqCrop = proposal.requirement?.cropName || 'Crop';
                const reqVariety = proposal.requirement?.variety || '';
                const buyerName = proposal.buyer?.businessName || proposal.buyer?.name || 'Buyer';
                const status = proposal.status || 'pending';

                return (
                  <article className="proposal-card-display" key={proposal._id}>
                    <div className="proposal-card-head">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`status-badge-pill status-badge-${status}`}>
                            {status === 'accepted' ? <CheckCircle2 size={13} /> : status === 'rejected' ? <XCircle size={13} /> : <Clock size={13} />}
                            <span style={{ textTransform: 'capitalize' }}>
                              {status === 'accepted' ? 'Accepted by Buyer' : status === 'rejected' ? 'Declined by Buyer' : 'Pending Review'}
                            </span>
                          </span>
                        </div>
                        <h3>{reqCrop} {reqVariety && <small>({reqVariety})</small>}</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '2px' }}>
                          Procurement requirement by <strong>{buyerName}</strong>
                        </p>
                      </div>

                      <div className="proposal-price-head tabular-nums">
                        {formatINR(proposal.offeredPricePerKg)}<small>/kg</small>
                      </div>
                    </div>

                    <div className="proposal-breakdown-box">
                      <div className="proposal-stat-row">
                        <span className="p-key">Offered Harvest Lot:</span>
                        <strong className="p-val">{proposal.crop?.name || 'Crop'} ({proposal.quantity} {proposal.unit})</strong>
                      </div>
                      <div className="proposal-stat-row">
                        <span className="p-key">Gross Amount:</span>
                        <span className="p-val tabular-nums">{formatINR(proposal.grossAmount)}</span>
                      </div>
                      <div className="proposal-stat-row">
                        <span className="p-key">Transport / Deductions:</span>
                        <span className="p-val tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                          {(Number(proposal.transportCost) || 0) + (Number(proposal.otherCharges) || 0) > 0
                            ? `- ${formatINR((Number(proposal.transportCost) || 0) + (Number(proposal.otherCharges) || 0))}`
                            : '₹0'}
                        </span>
                      </div>
                      <div className="proposal-stat-row highlight-net">
                        <span className="p-key">Net Farmer Realization:</span>
                        <strong className="p-val tabular-nums" style={{ color: 'var(--forest-800)' }}>{formatINR(proposal.netRealization)}</strong>
                      </div>
                    </div>

                    {proposal.message && (
                      <p className="requirement-notes" style={{ margin: '10px 0 0', fontStyle: 'italic' }}>
                        "{proposal.message}"
                      </p>
                    )}

                    {status === 'rejected' && (
                      <div className="proposal-status-guidance guidance-declined">
                        <span>This supply proposal was not accepted by the buyer. Your harvest inventory remains available to fulfill other orders.</span>
                      </div>
                    )}

                    {status === 'accepted' && (
                      <div className="proposal-status-guidance guidance-accepted">
                        <span>Agreement confirmed! An official dispatch order was generated from this proposal.</span>
                      </div>
                    )}

                    <div className="proposal-card-footer">
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                        Submitted on {formatDate(proposal.createdAt)}
                      </span>

                      {status === 'accepted' && (
                        <Link to="/orders" className="btn btn-sm btn-primary-action">
                          <span>View Dispatch Order</span>
                          <ArrowRight size={14} />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Send}
              title={myProposals.length ? 'No matching proposals' : 'No Supply Proposals Submitted Yet'}
              description={
                myProposals.length
                  ? 'Try a different search query.'
                  : 'You have not submitted any supply offers to buyers yet. Review active requirements and submit offers from your available crops.'
              }
              actionLabel={myProposals.length ? 'Clear Search' : 'Browse Active Requirements'}
              onAction={() => (myProposals.length ? setSearch('') : setActiveTab('requirements'))}
            />
          )}
        </>
      )}

      {/* SUBMIT SUPPLY OFFER MODAL */}
      <AnimatePresence>
        {offerModal.isOpen && offerModal.requirement && (
          <div className="modal-backdrop-overlay" onClick={handleCloseOfferModal}>
            <motion.div
              className="modal-card-dialog modal-dialog-supply-offer"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-header-bar">
                <div className="modal-header-titles">
                  <h3 className="modal-dialog-title">Submit Supply Offer</h3>
                  <p className="modal-dialog-subtitle">
                    Fulfill {offerModal.requirement.cropName} procurement for {offerModal.requirement.buyer?.businessName || 'Buyer'}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-icon-btn"
                  onClick={handleCloseOfferModal}
                  disabled={offerModal.isSubmitting}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {offerModal.errorMessage && (
                <div className="alert-box alert-error" style={{ margin: '14px 24px 0' }}>
                  <AlertCircle size={16} />
                  <span>{offerModal.errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmitOffer} className="modal-form-content">
                {/* Requirement Overview Card */}
                <div className="confirm-summary-card" style={{ marginBottom: '16px' }}>
                  <div className="confirm-row">
                    <span className="confirm-key">Buyer Requirement:</span>
                    <strong className="confirm-val">
                      {offerModal.requirement.cropName} ({offerModal.requirement.variety})
                    </strong>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Buyer's Target Need:</span>
                    <span className="confirm-val tabular-nums">
                      {offerModal.requirement.quantity} {offerModal.requirement.unit} @ ₹{offerModal.requirement.targetPricePerKg}/kg
                    </span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Delivery Destination:</span>
                    <span className="confirm-val">{offerModal.requirement.deliveryLocation}</span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Required By:</span>
                    <span className="confirm-val">{formatDate(offerModal.requirement.requiredDate)}</span>
                  </div>
                </div>

                {/* Available Crop Selection (strictly matching lots) */}
                <div className="form-group-field" style={{ marginBottom: '16px' }}>
                  <label className="form-label-header">
                    <span>Select Harvest from My Crops *</span>
                  </label>

                  {modalEligibleCrops.length === 0 ? (
                    <div className="alert-box alert-warning" style={{ fontSize: '0.85rem' }}>
                      <span>You have no active {offerModal.requirement.cropName} listings. Please </span>
                      <Link to="/add-crop" style={{ textDecoration: 'underline', fontWeight: 600 }}>
                        add a crop listing first
                      </Link>
                      <span> before submitting supply offers.</span>
                    </div>
                  ) : (
                    <div className="crop-selection-list">
                      {modalEligibleCrops.map((c) => {
                        const isSelected = offerModal.selectedCropId === c._id;
                        const isExactVariety = c.variety.trim().toLowerCase() === offerModal.requirement.variety.trim().toLowerCase();

                        return (
                          <div
                            key={c._id}
                            className={`crop-select-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setOfferModal((prev) => ({
                                ...prev,
                                selectedCropId: c._id,
                                quantity: String(Math.min(c.quantity, offerModal.requirement.quantity)),
                              }));
                            }}
                          >
                            <div className="crop-option-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong>{c.name}</strong>
                                <span className="crop-variety-sub">({c.variety})</span>
                                {isExactVariety && (
                                  <span className="badge-match-sm">
                                    <Sparkles size={10} />
                                    <span>Exact Grade Match</span>
                                  </span>
                                )}
                              </div>
                              <span className="crop-option-avail tabular-nums">
                                Available: {c.quantity} {c.unit} · Your Listed Base Price: ₹{c.expectedPricePerKg}/kg
                              </span>
                            </div>
                            <div className={`radio-dot ${isSelected ? 'checked' : ''}`}>
                              {isSelected && <Check size={12} color="#fff" />}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Offer Numeric Inputs */}
                <div className="modal-input-grid">
                  <div className="form-field-group">
                    <label className="form-input-label" htmlFor="offer-quantity">
                      Supply Volume ({financialPreview.unit}) *
                    </label>
                    <input
                      id="offer-quantity"
                      type="number"
                      step="any"
                      min="0.01"
                      max={selectedCrop?.quantity || undefined}
                      className="form-text-input"
                      value={offerModal.quantity}
                      onChange={(e) => setOfferModal((prev) => ({ ...prev, quantity: e.target.value }))}
                      placeholder="e.g. 100"
                      required
                    />
                    {selectedCrop && (
                      <small className="form-input-hint">Available in stock: {selectedCrop.quantity} {selectedCrop.unit}</small>
                    )}
                  </div>

                  <div className="form-field-group">
                    <label className="form-input-label" htmlFor="offer-price">
                      Offered Price (₹/kg) *
                    </label>
                    <input
                      id="offer-price"
                      type="number"
                      step="any"
                      min="0.01"
                      className="form-text-input"
                      value={offerModal.offeredPricePerKg}
                      onChange={(e) => setOfferModal((prev) => ({ ...prev, offeredPricePerKg: e.target.value }))}
                      placeholder="e.g. 30"
                      required
                    />
                    <small className="form-input-hint">Buyer target price: ₹{offerModal.requirement.targetPricePerKg}/kg</small>
                  </div>
                </div>

                <div className="modal-input-grid" style={{ marginTop: '12px' }}>
                  <div className="form-field-group">
                    <label className="form-input-label" htmlFor="offer-transport">
                      Estimated Transport Cost (₹)
                    </label>
                    <input
                      id="offer-transport"
                      type="number"
                      min="0"
                      step="any"
                      className="form-text-input"
                      value={offerModal.transportCost}
                      onChange={(e) => setOfferModal((prev) => ({ ...prev, transportCost: e.target.value }))}
                      placeholder="0"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="form-input-label" htmlFor="offer-other">
                      Other Handling / Loading Charges (₹)
                    </label>
                    <input
                      id="offer-other"
                      type="number"
                      min="0"
                      step="any"
                      className="form-text-input"
                      value={offerModal.otherCharges}
                      onChange={(e) => setOfferModal((prev) => ({ ...prev, otherCharges: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Message to Buyer */}
                <div className="form-field-group" style={{ marginTop: '12px' }}>
                  <label className="form-input-label" htmlFor="offer-message">
                    Note to Buyer (Optional, max 300 chars)
                  </label>
                  <input
                    id="offer-message"
                    type="text"
                    maxLength={300}
                    className="form-text-input"
                    value={offerModal.message}
                    onChange={(e) => setOfferModal((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="e.g. Moisture level checked at 8%, ready for warehouse intake."
                  />
                </div>

                {/* Live Realization Calculation Preview */}
                <div className="confirm-summary-card highlight-box" style={{ marginTop: '16px' }}>
                  <div className="confirm-row">
                    <span className="confirm-key">Gross Produce Value:</span>
                    <span className="confirm-val tabular-nums">
                      {formatINR(financialPreview.gross)}
                      {financialPreview.unit !== 'kg' && (
                        <small style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
                          ({financialPreview.quantityKg} kg @ ₹{offerModal.offeredPricePerKg}/kg)
                        </small>
                      )}
                    </span>
                  </div>
                  <div className="confirm-row">
                    <span className="confirm-key">Estimated Deductions:</span>
                    <span className="confirm-val tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      − {formatINR(financialPreview.transport + financialPreview.other)}
                    </span>
                  </div>
                  <div className="confirm-row highlight-net">
                    <span className="confirm-key">Net Farmer Realization:</span>
                    <strong className="confirm-val tabular-nums" style={{ color: 'var(--forest-800)', fontSize: '1.1rem' }}>
                      {formatINR(financialPreview.net)}
                    </strong>
                  </div>
                  <div className="confirm-row" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <span>Estimated Net per kg:</span>
                    <span className="tabular-nums font-semibold">₹{financialPreview.netPerKg.toFixed(2)}/kg</span>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="modal-actions-footer" style={{ marginTop: '20px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary-action"
                    onClick={handleCloseOfferModal}
                    disabled={offerModal.isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary-action"
                    disabled={offerModal.isSubmitting || modalEligibleCrops.length === 0}
                  >
                    {offerModal.isSubmitting ? (
                      <span>Submitting Proposal...</span>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Confirm & Send Proposal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
