import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Scale,
  IndianRupee,
  Sprout,
  UserCheck,
  AlertCircle,
  Package,
  Handshake,
  X,
  Truck,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import { getCropById } from '../services/cropService';
import { createOffer } from '../services/offerService';
import { formatINR, formatDate } from '../utils/formatters';

export default function CropDetails() {
  const { id } = useParams();
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  const [crop, setCrop] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerQuantity, setOfferQuantity] = useState('');
  const [offerPricePerKg, setOfferPricePerKg] = useState('');
  const [transportCost, setTransportCost] = useState('0');
  const [otherCharges, setOtherCharges] = useState('0');
  const [offerMessage, setOfferMessage] = useState('');
  const [modalError, setModalError] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadCrop() {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await getCropById(id);
        const cropItem =
          response?.data?.crop ||
          response?.data ||
          response?.crop;

        if (isMounted) {
          if (response?.success && cropItem) {
            setCrop(cropItem);
            // Default initial offer price to expected price
            if (cropItem.expectedPricePerKg) {
              setOfferPricePerKg(String(cropItem.expectedPricePerKg));
            }
          } else {
            setLoadError(response?.message || 'Crop listing could not be found.');
          }
        }
      } catch (err) {
        if (isMounted) {
          const msg =
            err.response?.status === 404
              ? 'This harvest listing is no longer available or has been removed by the farmer.'
              : err.response?.status === 400
              ? 'The produce ID in the link is invalid. Please return to the catalog and select a valid listing.'
              : err.response?.data?.message || err.message || 'Unable to load crop details.';
          setLoadError(msg);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (id) loadCrop();
    return () => { isMounted = false; };
  }, [id]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOfferModalOpen) {
        setIsOfferModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOfferModalOpen]);

  const formatUnitDisplay = (unit) => {
    if (unit === 'quintal') return 'Quintals';
    if (unit === 'tonne') return 'Tonnes';
    return 'kg';
  };

  const getUnitMultiplier = (unit) => {
    if (unit === 'tonne') return 1000;
    if (unit === 'quintal') return 100;
    return 1;
  };

  const openOfferModal = () => {
    setModalError('');
    setOfferQuantity(crop?.quantity ? String(crop.quantity) : '');
    setOfferPricePerKg(crop?.expectedPricePerKg ? String(crop.expectedPricePerKg) : '');
    setTransportCost('0');
    setOtherCharges('0');
    setOfferMessage('');
    setIsOfferModalOpen(true);
  };

  const closeOfferModal = () => {
    if (!isSubmittingOffer) {
      setIsOfferModalOpen(false);
      setModalError('');
    }
  };

  // Informational live preview calculation (backend remains authoritative)
  const multiplier = crop ? getUnitMultiplier(crop.unit) : 1;
  const parsedOfferQty = parseFloat(offerQuantity) || 0;
  const parsedOfferPrice = parseFloat(offerPricePerKg) || 0;
  const parsedTransport = parseFloat(transportCost) || 0;
  const parsedOther = parseFloat(otherCharges) || 0;

  const previewQtyKg = parsedOfferQty * multiplier;
  const previewGrossAmount = Math.round(parsedOfferPrice * previewQtyKg * 100) / 100;
  const previewDeductions = Math.round((parsedTransport + parsedOther) * 100) / 100;
  const previewNetRealization = Math.round((previewGrossAmount - previewDeductions) * 100) / 100;

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setModalError('');

    // Validations
    if (!parsedOfferQty || parsedOfferQty <= 0) {
      setModalError('Please enter a valid offer quantity greater than 0.');
      return;
    }

    if (parsedOfferQty > crop.quantity) {
      setModalError(`Offered quantity cannot exceed available crop lot (${crop.quantity} ${crop.unit}).`);
      return;
    }

    if (!parsedOfferPrice || parsedOfferPrice <= 0) {
      setModalError('Please enter a valid price per kg greater than 0.');
      return;
    }

    if (parsedTransport < 0) {
      setModalError('Transport cost cannot be negative.');
      return;
    }

    if (parsedOther < 0) {
      setModalError('Other charges cannot be negative.');
      return;
    }

    if (offerMessage && offerMessage.length > 300) {
      setModalError('Message cannot exceed 300 characters.');
      return;
    }

    try {
      setIsSubmittingOffer(true);
      const payload = {
        cropId: crop._id,
        quantity: parsedOfferQty,
        offeredPricePerKg: parsedOfferPrice,
        transportCost: parsedTransport,
        otherCharges: parsedOther,
        message: offerMessage.trim(),
      };

      const res = await createOffer(payload);
      if (res?.success) {
        showToast('Procurement offer submitted successfully!', 'success');
        setIsOfferModalOpen(false);
        navigate('/offers');
      } else {
        setModalError(res?.message || 'Failed to submit offer.');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Error submitting offer. Please try again.';
      setModalError(errorMsg);
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  if (isLoading) return <PageLoader message="Loading produce specification..." />;

  if (loadError || !crop) {
    return (
      <div className="portal-page-container">
        <div style={{ marginBottom: '16px' }}>
          <Link to="/browse-crops" className="back-link">
            <ArrowLeft size={16} />
            <span>Back to Catalog</span>
          </Link>
        </div>
        <EmptyState
          icon={AlertCircle}
          title="Produce Not Found"
          description={loadError || 'This harvest listing could not be located in the marketplace.'}
          actionLabel="Return to Catalog"
          onAction={() => navigate('/browse-crops')}
        />
      </div>
    );
  }

  // Only surface safe farmer fields the backend populates
  const farmerName = crop.farmer?.name;
  const farmerLocation = crop.farmer?.location;
  const farmerVerification = crop.farmer?.verificationStatus || 'pending';
  const totalValue = (Number(crop.expectedPricePerKg) || 0) * (Number(crop.quantity) || 0) * multiplier;
  const imgSrc = crop.imageUrl || crop.image;
  const isAvailable = crop.status === 'available';

  return (
    <div className="portal-page-container">
      {/* Breadcrumb Back Link */}
      <div style={{ marginBottom: '20px' }}>
        <Link to="/browse-crops" className="back-link">
          <ArrowLeft size={16} />
          <span>Back to Crop Catalog</span>
        </Link>
      </div>

      <div className="crop-detail-layout">
        {/* Left: Image & Availability */}
        <motion.div
          className="crop-detail-image-col"
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="crop-detail-media-box">
            {!imageError && imgSrc ? (
              <img
                src={imgSrc}
                alt={`${crop.name} – ${crop.variety}`}
                className={`crop-detail-img ${imageLoaded ? 'loaded' : ''}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="crop-detail-img-placeholder">
                <Sprout size={52} color="var(--forest-600)" />
                <span>No image available</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div className={`crop-detail-status-badge ${isAvailable ? 'status-available-lg' : 'status-unavailable-lg'}`}>
            {isAvailable ? 'Available for Procurement' : 'Not Currently Available'}
          </div>

          {/* Farmer Info Block — only safe populated fields */}
          {(farmerName || farmerLocation) && (
            <div className="crop-detail-farmer-card">
              <div className="farmer-card-header">
                <UserCheck size={16} color="var(--forest-600)" />
                <span className="farmer-card-label">Farmer Details</span>
                <span className={`status-badge ${farmerVerification === 'verified' ? 'status-available' : ''}`}>
                  {farmerVerification === 'verified'
                    ? 'Verified'
                    : farmerVerification === 'rejected'
                    ? 'Verification Rejected'
                    : 'Verification Pending'}
                </span>
              </div>
              {farmerName && (
                <div className="farmer-detail-row">
                  <span className="farmer-detail-key">Farmer:</span>
                  <strong className="farmer-detail-val">{farmerName}</strong>
                </div>
              )}
              {farmerLocation && (
                <div className="farmer-detail-row">
                  <MapPin size={13} style={{ color: 'var(--text-secondary)', marginRight: '4px' }} />
                  <span className="farmer-detail-val">{farmerLocation}</span>
                </div>
              )}
              <p className="farmer-privacy-note">
                Contact information is exchanged upon confirmed acceptance of your offer.
              </p>
            </div>
          )}
        </motion.div>

        {/* Right: Details & CTA */}
        <motion.div
          className="crop-detail-info-col"
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <div className="crop-detail-header">
            <h2 className="crop-detail-title">{crop.name}</h2>
            <p className="crop-detail-variety">{crop.variety}</p>
          </div>

          {/* Price Box */}
          <div className="crop-detail-price-box">
            <div className="crop-detail-price-row">
              <span className="detail-price-label">Expected Price per kg:</span>
              <span className="detail-price-value tabular-nums">
                {formatINR(crop.expectedPricePerKg)} <small>/ kg</small>
              </span>
            </div>
            <div className="crop-detail-price-row est-total-row">
              <span className="detail-price-label">Estimated Lot Value:</span>
              <span className="detail-price-total tabular-nums">{formatINR(totalValue)}</span>
            </div>
          </div>

          {/* Produce Specifications */}
          <div className="crop-detail-specs-grid">
            <div className="spec-item">
              <Package size={16} className="spec-icon" />
              <div className="spec-content">
                <span className="spec-label">Available Quantity</span>
                <strong className="spec-value tabular-nums">
                  {crop.quantity} {formatUnitDisplay(crop.unit)}
                </strong>
              </div>
            </div>

            <div className="spec-item">
              <MapPin size={16} className="spec-icon" />
              <div className="spec-content">
                <span className="spec-label">Dispatch Location</span>
                <strong className="spec-value">{crop.location}</strong>
              </div>
            </div>

            <div className="spec-item">
              <Calendar size={16} className="spec-icon" />
              <div className="spec-content">
                <span className="spec-label">Harvest Date</span>
                <strong className="spec-value">{formatDate(crop.harvestDate)}</strong>
              </div>
            </div>

            <div className="spec-item">
              <Scale size={16} className="spec-icon" />
              <div className="spec-content">
                <span className="spec-label">Unit of Measure</span>
                <strong className="spec-value">{formatUnitDisplay(crop.unit)}</strong>
              </div>
            </div>
          </div>

          {/* Description / Quality Notes */}
          {crop.description && (
            <div className="crop-detail-description-box">
              <h4 className="desc-box-title">Quality & Packaging Notes</h4>
              <p className="desc-box-text">{crop.description}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="crop-detail-actions">
            <button
              type="button"
              className={`btn btn-primary-action btn-large ${!isAvailable ? 'btn-disabled' : ''}`}
              onClick={openOfferModal}
              disabled={!isAvailable}
            >
              <Handshake size={18} />
              <span>
                {isAvailable ? 'Send Procurement Offer' : 'Produce Not Available'}
              </span>
            </button>

            <Link to="/browse-crops" className="btn btn-secondary-action">
              <ArrowLeft size={16} />
              <span>Back to Catalog</span>
            </Link>
          </div>

          {!isAvailable && (
            <p className="unavailable-notice">
              This produce listing is currently marked as{' '}
              <strong>{crop.status === 'sold' ? 'Sold Out' : 'Inactive'}</strong>. Browse other
              available harvest lots in the catalog.
            </p>
          )}
        </motion.div>
      </div>

      {/* Accessible Offer Submission Modal */}
      <AnimatePresence>
        {isOfferModalOpen && (
          <div className="modal-backdrop-overlay" onClick={closeOfferModal}>
            <motion.div
              className="modal-card-dialog"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
            >
              <div className="modal-header-bar">
                <div className="modal-header-titles">
                  <h3 className="modal-dialog-title">Submit Procurement Offer</h3>
                  <p className="modal-dialog-subtitle">
                    {crop.name} ({crop.variety}) — Listed by {farmerName || 'Farmer'}
                  </p>
                </div>
                <button
                  type="button"
                  className="modal-close-icon-btn"
                  onClick={closeOfferModal}
                  disabled={isSubmittingOffer}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div className="alert-box alert-error" style={{ margin: '16px 24px 0' }}>
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitOffer} className="modal-body-form">
                {/* Available Quantity Info */}
                <div className="modal-info-strip">
                  <span>Available Lot Size:</span>
                  <strong>{crop.quantity} {crop.unit}</strong>
                  <span>|</span>
                  <span>Farmer Expected:</span>
                  <strong>₹{crop.expectedPricePerKg}/kg</strong>
                </div>

                <div className="form-grid-two-col">
                  {/* Quantity Field */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="offerQuantity">
                      Procurement Quantity ({crop.unit}) *
                    </label>
                    <input
                      id="offerQuantity"
                      type="number"
                      step="any"
                      min="0.01"
                      max={crop.quantity}
                      required
                      className="form-input tabular-nums"
                      value={offerQuantity}
                      onChange={(e) => setOfferQuantity(e.target.value)}
                      placeholder={`Max: ${crop.quantity}`}
                      disabled={isSubmittingOffer}
                    />
                    <small className="form-hint">
                      Converted: {previewQtyKg.toLocaleString('en-IN')} kg
                    </small>
                  </div>

                  {/* Offered Price per kg */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="offerPrice">
                      Offered Price per kg (₹) *
                    </label>
                    <div className="input-currency-wrapper">
                      <span className="currency-prefix">₹</span>
                      <input
                        id="offerPrice"
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        className="form-input tabular-nums"
                        value={offerPricePerKg}
                        onChange={(e) => setOfferPricePerKg(e.target.value)}
                        placeholder="e.g. 32"
                        disabled={isSubmittingOffer}
                      />
                    </div>
                    <small className="form-hint">Direct farm-gate price</small>
                  </div>

                  {/* Transport Cost */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="transportCost">
                      Logistics / Transport Cost (₹)
                    </label>
                    <div className="input-currency-wrapper">
                      <span className="currency-prefix">₹</span>
                      <input
                        id="transportCost"
                        type="number"
                        step="any"
                        min="0"
                        className="form-input tabular-nums"
                        value={transportCost}
                        onChange={(e) => setTransportCost(e.target.value)}
                        placeholder="0"
                        disabled={isSubmittingOffer}
                      />
                    </div>
                    <small className="form-hint">Freight and truck loading</small>
                  </div>

                  {/* Other Charges */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="otherCharges">
                      Other Handling / Tariffs (₹)
                    </label>
                    <div className="input-currency-wrapper">
                      <span className="currency-prefix">₹</span>
                      <input
                        id="otherCharges"
                        type="number"
                        step="any"
                        min="0"
                        className="form-input tabular-nums"
                        value={otherCharges}
                        onChange={(e) => setOtherCharges(e.target.value)}
                        placeholder="0"
                        disabled={isSubmittingOffer}
                      />
                    </div>
                    <small className="form-hint">Quality assay, weighing, mandi fee</small>
                  </div>
                </div>

                {/* Message Field */}
                <div className="form-group">
                  <label className="form-label" htmlFor="offerMessage">
                    Procurement Terms & Delivery Notes (Optional)
                  </label>
                  <textarea
                    id="offerMessage"
                    rows={2}
                    maxLength={300}
                    className="form-textarea"
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="e.g. Can arrange truck pickup within 48 hours; immediate payment upon weighing."
                    disabled={isSubmittingOffer}
                  />
                  <small className="form-hint" style={{ textAlign: 'right', display: 'block' }}>
                    {offerMessage.length}/300 characters
                  </small>
                </div>

                {/* Live Informational Economics Preview */}
                <div className="offer-preview-economic-box">
                  <div className="economic-preview-title">
                    <span>Offer Economics Summary (Informational Preview)</span>
                  </div>
                  <div className="economic-preview-grid">
                    <div className="economic-stat">
                      <span className="econ-label">Gross Value:</span>
                      <strong className="econ-val tabular-nums">{formatINR(previewGrossAmount)}</strong>
                    </div>
                    <div className="economic-stat">
                      <span className="econ-label">Total Deductions:</span>
                      <span className="econ-val-deduction tabular-nums">- {formatINR(previewDeductions)}</span>
                    </div>
                    <div className="economic-stat highlight">
                      <span className="econ-label">Est. Farmer Net:</span>
                      <strong className="econ-val-net tabular-nums">{formatINR(previewNetRealization)}</strong>
                    </div>
                  </div>
                  <small className="economic-preview-disclaimer">
                    * Server calculates and enforces final financial realization upon dispatch.
                  </small>
                </div>

                {/* Modal Actions */}
                <div className="modal-actions-footer">
                  <button
                    type="button"
                    className="btn btn-secondary-action"
                    onClick={closeOfferModal}
                    disabled={isSubmittingOffer}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary-action"
                    disabled={isSubmittingOffer}
                  >
                    <Handshake size={16} />
                    <span>{isSubmittingOffer ? 'Transmitting Offer...' : 'Transmit Procurement Offer'}</span>
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
