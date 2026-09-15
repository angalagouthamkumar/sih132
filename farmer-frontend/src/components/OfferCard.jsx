import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  Check,
  X,
  MapPin,
  TrendingUp,
  Tag,
  Sparkles,
  ArrowRight,
  Scale,
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';
import { convertToKg } from '../utils/priceDiscovery';

export default function OfferCard({
  offer,
  onAccept,
  onReject,
  isHighestNetRealization = false,
}) {
  const statusClasses = {
    pending: 'status-badge warning',
    accepted: 'status-badge online',
    rejected: 'status-badge error',
  };

  const buyerCompany =
    offer.buyer?.businessName ||
    offer.buyerCompany ||
    'Registered Agribusiness';

  const buyerName =
    offer.buyer?.name ||
    offer.buyerName ||
    'Commercial Buyer';

  const buyerLocation = offer.buyer?.location || '';

  const cropId = offer.crop?._id || offer.crop || '';
  const cropName = offer.crop?.name || offer.crop || 'Commodity Produce';
  const cropVariety = offer.crop?.variety || '';
  const quantity = offer.quantity;
  const unit = offer.unit || 'kg';
  const pricePerKg = offer.offeredPricePerKg;
  const grossAmount = offer.grossAmount || offer.totalOfferedAmount || 0;
  const transportCost = Number(offer.transportCost) || 0;
  const otherCharges = Number(offer.otherCharges) || 0;
  const totalDeductions = transportCost + otherCharges;
  const netRealization = offer.netRealization || 0;
  const message = offer.message || offer.notes;
  const submissionDate = offer.createdAt || offer.date;

  const isPending = offer.status === 'pending';

  // Calculate Net Realization Per Kilogram
  const quantityKg = convertToKg(quantity, unit);
  const netPerKg = quantityKg > 0 ? (netRealization / quantityKg).toFixed(2) : '0.00';

  return (
    <motion.div
      className={`offer-card ${isHighestNetRealization && isPending ? 'offer-card-recommended' : ''}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Highest Net Realization Recommendation Banner */}
      {isHighestNetRealization && isPending && (
        <div className="recommendation-notice-bar">
          <Sparkles size={14} className="sparkle-icon" />
          <span>
            <strong>Best Offer for this Crop: </strong>
            Recommended because this offer provides the highest net realization per kg (₹{netPerKg}/kg) after freight and deductions.
          </span>
        </div>
      )}

      {/* Card Top: Buyer Information */}
      <div className="offer-card-top">
        <div className="offer-buyer-info">
          <div className="buyer-avatar">
            <Building2 size={18} />
          </div>
          <div>
            <h4 className="buyer-company">{buyerCompany}</h4>
            <div className="buyer-contact-line">
              <span>Contact: {buyerName}</span>
              {buyerLocation && (
                <span className="buyer-location-text">
                  <MapPin size={11} style={{ margin: '0 2px 0 4px' }} />
                  {buyerLocation}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={statusClasses[offer.status] || 'status-badge loading'}>
          {offer.status.toUpperCase()}
        </span>
      </div>

      {/* Crop & Quantity Banner */}
      <div className="offer-crop-banner">
        <div>
          <div className="offer-crop-name">{cropName}</div>
          {cropVariety && <small className="offer-crop-variety">{cropVariety}</small>}
        </div>
        <div className="offer-crop-qty tabular-nums">
          Quantity: <strong>{quantity} {unit}</strong>
          {pricePerKg && (
            <span className="price-tag-sub">(@ ₹{pricePerKg}/kg)</span>
          )}
        </div>
      </div>

      {/* Pricing Breakdown */}
      <div className="offer-pricing-breakdown">
        <div className="price-breakdown-row">
          <span className="breakdown-label">Gross Offered Bid:</span>
          <span className="breakdown-val tabular-nums">
            {formatINR(grossAmount)}
          </span>
        </div>

        {totalDeductions > 0 ? (
          <div className="price-breakdown-row deduction">
            <span className="breakdown-label">
              Logistics & Handling Deductions:
            </span>
            <span className="breakdown-val tabular-nums">
              - {formatINR(totalDeductions)}
            </span>
          </div>
        ) : (
          <div className="price-breakdown-row deduction">
            <span className="breakdown-label">Deductions (Direct Pickup):</span>
            <span className="breakdown-val tabular-nums">₹0</span>
          </div>
        )}

        <div className="price-breakdown-row net-total">
          <span className="breakdown-label">Total Net Realization:</span>
          <span className="breakdown-val-highlight tabular-nums">
            {formatINR(netRealization)}
          </span>
        </div>

        {/* Net Realization Per Kilogram & Fair Comparison Indicator */}
        <div className="price-breakdown-row net-per-kg-row">
          <span className="breakdown-label">
            <Scale size={13} style={{ marginRight: '4px', verticalAlign: '-2px' }} />
            Net Realization / kg:
          </span>
          <span className="breakdown-val-net-kg tabular-nums">
            ₹{netPerKg} <small>/ kg</small>
          </span>
        </div>
      </div>

      {/* Fair Comparison Explanation Note */}
      <div className="offer-fair-comparison-note">
        <small>Evaluated on net realization per kg after freight and deductions.</small>
      </div>

      {/* Buyer Message / Notes */}
      {message && (
        <div className="offer-notes">
          <p>"{message}"</p>
        </div>
      )}

      {/* Card Footer: Date & Interactive Actions */}
      <div className="offer-footer">
        <div className="offer-footer-left">
          <div className="offer-expiry">
            <Calendar size={12} />
            <span>Submitted: {formatDate(submissionDate)}</span>
          </div>
          {cropId && (
            <Link
              to={`/market-prices?cropId=${cropId}`}
              className="compare-mandi-link"
              title="Compare with regional APMC wholesale markets"
            >
              <span>Compare with Mandis</span>
              <ArrowRight size={11} />
            </Link>
          )}
        </div>

        {isPending ? (
          <div className="offer-action-buttons">
            <button
              type="button"
              className="btn btn-sm btn-accept"
              onClick={() => onAccept && onAccept(offer)}
            >
              <Check size={14} />
              <span>Accept</span>
            </button>
            <button
              type="button"
              className="btn btn-sm btn-reject"
              onClick={() => onReject && onReject(offer)}
            >
              <X size={14} />
              <span>Decline</span>
            </button>
          </div>
        ) : (
          <span className={`offer-resolved-text ${offer.status === 'accepted' ? 'text-accepted' : 'text-declined'}`}>
            {offer.status === 'accepted' ? 'Accepted by You' : 'Declined'}
          </span>
        )}
      </div>
    </motion.div>
  );
}
