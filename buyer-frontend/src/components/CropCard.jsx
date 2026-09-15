import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Sprout, ArrowRight, UserCheck } from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';

export default function CropCard({ crop }) {
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

  const formatUnitDisplay = (unit) => {
    if (!unit) return 'kg';
    if (unit === 'quintal') return 'Quintals';
    if (unit === 'tonne') return 'Tonnes';
    return unit;
  };

  return (
    <motion.div
      className="buyer-crop-card"
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
        <span className="crop-status-pill status-available">
          Available Now
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
            <span className="crop-price-label">Est. Lot Value:</span>
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
          {crop.farmer?.name && (
            <div className="crop-meta-item farmer-meta">
              <UserCheck size={13} className="crop-meta-icon-farmer" />
              <span className="crop-meta-text">
                Farmer: <strong>{crop.farmer.name}</strong>
              </span>
            </div>
          )}
        </div>

        {crop.description && (
          <p className="crop-description-snippet">
            {crop.description.length > 95
              ? `${crop.description.slice(0, 95)}...`
              : crop.description}
          </p>
        )}

        <div className="crop-card-actions">
          <Link
            to={`/crops/${crop._id}`}
            className="btn btn-primary-action btn-full-width"
          >
            <span>View Produce & Offer</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
