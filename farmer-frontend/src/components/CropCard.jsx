import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Tag, Edit3, Trash2, Sprout } from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';

export default function CropCard({ crop, onEdit, onDelete, onActionNotice }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const imgSrc = crop.imageUrl || crop.image;

  // Calculate estimated total value based on unit
  const multiplier =
    crop.unit === 'tonne' ? 1000 : crop.unit === 'quintal' ? 100 : 1;
  const totalValue =
    crop.expectedPriceTotal != null
      ? crop.expectedPriceTotal
      : (Number(crop.expectedPricePerKg) || 0) * (Number(crop.quantity) || 0) * multiplier;

  const statusClass =
    crop.status === 'available'
      ? 'status-available'
      : crop.status === 'sold'
      ? 'status-sold'
      : 'status-inactive';

  const statusLabel =
    crop.status === 'available'
      ? 'Available'
      : crop.status === 'sold'
      ? 'Sold Out'
      : 'Inactive';

  const formatUnitDisplay = (unit) => {
    if (!unit) return 'kg';
    if (unit === 'quintal') return 'Quintals';
    if (unit === 'tonne') return 'Tonnes';
    return unit;
  };

  return (
    <motion.div
      className="crop-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div className="crop-card-media">
        {!imageError && imgSrc ? (
          <img
            src={imgSrc}
            alt={`${crop.name} - ${crop.variety}`}
            className={`crop-card-img ${imageLoaded ? 'loaded' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="crop-card-placeholder">
            <Sprout size={36} color="var(--forest-600)" />
          </div>
        )}
        <span className={`crop-status-pill ${statusClass}`}>
          {statusLabel}
        </span>
      </div>

      <div className="crop-card-body">
        <div className="crop-header-row">
          <div>
            <h3 className="crop-title">{crop.name}</h3>
            <p className="crop-variety">{crop.variety}</p>
          </div>
          <span className="crop-quantity-tag tabular-nums">
            {crop.quantity} {formatUnitDisplay(crop.unit)}
          </span>
        </div>

        <div className="crop-price-box">
          <div className="crop-price-row">
            <span className="crop-price-label">Expected Rate:</span>
            <span className="crop-price-val tabular-nums">
              {formatINR(crop.expectedPricePerKg)} <small>/ kg</small>
            </span>
          </div>
          <div className="crop-price-row total-est">
            <span className="crop-price-label">Estimated Value:</span>
            <span className="crop-price-total tabular-nums">
              {formatINR(totalValue)}
            </span>
          </div>
        </div>

        <div className="crop-meta-details">
          <div className="crop-meta-item">
            <MapPin size={13} className="crop-meta-icon" />
            <span className="crop-meta-text">{crop.location}</span>
          </div>
          <div className="crop-meta-item">
            <Calendar size={13} className="crop-meta-icon" />
            <span className="crop-meta-text">Harvested: {formatDate(crop.harvestDate)}</span>
          </div>
        </div>

        {crop.description && (
          <p className="crop-description">{crop.description}</p>
        )}

        <div className="crop-card-actions">
          <button
            type="button"
            className="btn-card-action btn-edit"
            onClick={() => {
              if (onEdit) {
                onEdit(crop);
              } else if (onActionNotice) {
                onActionNotice('Edit crop action triggered');
              }
            }}
          >
            <Edit3 size={14} />
            <span>Edit</span>
          </button>
          <button
            type="button"
            className="btn-card-action btn-delete"
            onClick={() => {
              if (onDelete) {
                onDelete(crop);
              } else if (onActionNotice) {
                onActionNotice('Delete crop action triggered');
              }
            }}
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
