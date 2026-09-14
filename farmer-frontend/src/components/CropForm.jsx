import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sprout,
  Image as ImageIcon,
  Calendar,
  IndianRupee,
  MapPin,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Save,
} from 'lucide-react';

export default function CropForm({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  apiError = '',
  mode = 'create', // 'create' | 'edit'
}) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    quantity: '',
    unit: 'quintal',
    expectedPricePerKg: '',
    location: '',
    harvestDate: new Date().toISOString().split('T')[0],
    imageUrl: '',
    description: '',
    status: 'available',
    ...initialValues,
  });

  // Sync if initialValues arrive asynchronously (e.g. from fetch in EditCrop)
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      let formattedDate = initialValues.harvestDate;
      if (formattedDate) {
        // Format to YYYY-MM-DD if full ISO string
        formattedDate = new Date(formattedDate).toISOString().split('T')[0];
      }
      setFormData((prev) => ({
        ...prev,
        ...initialValues,
        harvestDate: formattedDate || prev.harvestDate,
      }));
    }
  }, [initialValues]);

  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.name || !formData.name.trim()) errs.name = 'Crop name is required';
    if (!formData.variety || !formData.variety.trim()) errs.variety = 'Variety is required';

    const parsedQty = Number(formData.quantity);
    if (!formData.quantity || isNaN(parsedQty) || parsedQty <= 0) {
      errs.quantity = 'Please enter a valid positive quantity';
    }

    const parsedPrice = Number(formData.expectedPricePerKg);
    if (!formData.expectedPricePerKg || isNaN(parsedPrice) || parsedPrice <= 0) {
      errs.expectedPricePerKg = 'Please enter a valid expected rate';
    }

    if (!formData.location || !formData.location.trim()) errs.location = 'Farm location is required';
    if (!formData.harvestDate) errs.harvestDate = 'Harvest date is required';

    if (formData.description && formData.description.length > 500) {
      errs.description = 'Description cannot exceed 500 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'imageUrl') {
      setImagePreviewError(false);
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    // Format clean payload with numbers
    const payload = {
      name: formData.name.trim(),
      variety: formData.variety.trim(),
      quantity: Number(formData.quantity),
      unit: formData.unit,
      expectedPricePerKg: Number(formData.expectedPricePerKg),
      location: formData.location.trim(),
      harvestDate: formData.harvestDate,
      imageUrl: formData.imageUrl ? formData.imageUrl.trim() : '',
      description: formData.description ? formData.description.trim() : '',
    };

    if (mode === 'edit') {
      payload.status = formData.status;
    }

    onSubmit(payload);
  };



  return (
    <div className="add-crop-layout-grid">
      {/* Form Column */}
      <motion.div
        className="card form-card-container"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {apiError && (
          <div className="alert-box alert-error" role="alert">
            <AlertCircle size={16} className="alert-icon" />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Crop Commodity Name <span className="req-star">*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Paddy, Red Chilli, Cotton"
                disabled={isSubmitting}
                required
              />
              {errors.name && <p className="form-error-text">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="variety" className="form-label">
                Variety / Grade <span className="req-star">*</span>
              </label>
              <input
                id="variety"
                type="text"
                name="variety"
                className={`form-input ${errors.variety ? 'form-input-error' : ''}`}
                value={formData.variety}
                onChange={handleChange}
                placeholder="e.g. BPT 5204 (Samba Mahsuri)"
                disabled={isSubmitting}
                required
              />
              {errors.variety && <p className="form-error-text">{errors.variety}</p>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity" className="form-label">
                Available Quantity <span className="req-star">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                name="quantity"
                min="0.01"
                step="any"
                className={`form-input ${errors.quantity ? 'form-input-error' : ''}`}
                value={formData.quantity}
                onChange={handleChange}
                placeholder="e.g. 100"
                disabled={isSubmitting}
                required
              />
              {errors.quantity && <p className="form-error-text">{errors.quantity}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="unit" className="form-label">
                Measurement Unit <span className="req-star">*</span>
              </label>
              <select
                id="unit"
                name="unit"
                className="form-input"
                value={formData.unit}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="quintal">Quintals (100 kg)</option>
                <option value="tonne">Metric Tonnes (1000 kg)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expectedPricePerKg" className="form-label">
                Expected Price (₹ / kg) <span className="req-star">*</span>
              </label>
              <div className="input-currency-wrapper">
                <span className="currency-symbol">₹</span>
                <input
                  id="expectedPricePerKg"
                  type="number"
                  name="expectedPricePerKg"
                  min="0.01"
                  step="any"
                  className={`form-input input-with-symbol ${
                    errors.expectedPricePerKg ? 'form-input-error' : ''
                  }`}
                  value={formData.expectedPricePerKg}
                  onChange={handleChange}
                  placeholder="e.g. 28"
                  disabled={isSubmitting}
                  required
                />
              </div>
              {errors.expectedPricePerKg && (
                <p className="form-error-text">{errors.expectedPricePerKg}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="harvestDate" className="form-label">
                Harvest Date <span className="req-star">*</span>
              </label>
              <input
                id="harvestDate"
                type="date"
                name="harvestDate"
                className={`form-input ${errors.harvestDate ? 'form-input-error' : ''}`}
                value={formData.harvestDate}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
              {errors.harvestDate && (
                <p className="form-error-text">{errors.harvestDate}</p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location" className="form-label">
                Farm Dispatch Location <span className="req-star">*</span>
              </label>
              <input
                id="location"
                type="text"
                name="location"
                className={`form-input ${errors.location ? 'form-input-error' : ''}`}
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. Warangal Rural, Telangana"
                disabled={isSubmitting}
                required
              />
              {errors.location && <p className="form-error-text">{errors.location}</p>}
            </div>

            {mode === 'edit' && (
              <div className="form-group">
                <label htmlFor="status" className="form-label">
                  Inventory Status <span className="req-star">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  className="form-input"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="available">Available for Bidding</option>
                  <option value="sold">Sold Out</option>
                  <option value="inactive">Inactive / Hidden</option>
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="imageUrl" className="form-label">
              Crop Image URL (Optional)
            </label>
            <input
              id="imageUrl"
              type="url"
              name="imageUrl"
              className="form-input"
              value={formData.imageUrl}
              onChange={handleChange}
              placeholder="https://example.com/crop-photo.jpg"
              disabled={isSubmitting}
            />

          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Harvest Details & Quality Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide notes on moisture levels, sorting quality, organic status, or packaging format (max 500 chars)..."
              maxLength={500}
              disabled={isSubmitting}
            />
            {errors.description && <p className="form-error-text">{errors.description}</p>}
          </div>

          <div className="form-actions-row">
            <button
              type="submit"
              className="btn btn-primary-action"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={18} className="spin-animation" />
                  <span>{mode === 'edit' ? 'Saving Changes...' : 'Submitting Listing...'}</span>
                </>
              ) : (
                <>
                  {mode === 'edit' ? <Save size={18} /> : <Sprout size={18} />}
                  <span>{mode === 'edit' ? 'Save Changes' : 'Publish Crop Listing'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/my-crops')}
              disabled={isSubmitting}
            >
              Cancel & Return
            </button>
          </div>
        </form>
      </motion.div>

      {/* Live Preview Column */}
      <div className="crop-preview-col">
        <div className="card preview-card">
          <div className="preview-card-header">
            <Sparkles size={16} color="var(--forest-700)" />
            <span className="preview-label">Live Buyer View Preview</span>
          </div>

          <div className="preview-media-box">
            {formData.imageUrl && !imagePreviewError ? (
              <img
                src={formData.imageUrl}
                alt="Preview"
                className="preview-img"
                onError={() => setImagePreviewError(true)}
              />
            ) : (
              <div className="preview-media-placeholder">
                <ImageIcon size={32} color="var(--forest-600)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                  {imagePreviewError ? 'Image URL unreachable' : 'Add image URL to preview'}
                </span>
              </div>
            )}
            <span
              className={`crop-status-pill status-${formData.status}`}
            >
              {formData.status}
            </span>
          </div>

          <div className="preview-details">
            <h4 className="preview-crop-title">
              {formData.name || 'Crop Name'}
            </h4>
            <p className="preview-crop-sub">
              {formData.variety || 'Variety / Grade'}
            </p>

            <div className="preview-price-tag">
              <span className="preview-rate tabular-nums">
                ₹{formData.expectedPricePerKg || '0'}{' '}
                <small style={{ fontWeight: 400 }}>/ kg</small>
              </span>
              <span className="preview-qty tabular-nums">
                {formData.quantity || '0'} {formData.unit}
              </span>
            </div>

            <div className="preview-meta">
              <div className="preview-meta-row">
                <MapPin size={12} />
                <span>{formData.location || 'Location'}</span>
              </div>
              <div className="preview-meta-row">
                <Calendar size={12} />
                <span>Harvested: {formData.harvestDate || 'Not selected'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
