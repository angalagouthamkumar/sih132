import React, { useState, useEffect, useMemo } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sprout,
  Handshake,
  ShoppingBag,
  IndianRupee,
  PlusCircle,
  TrendingUp,
  ArrowRight,
  Clock,
  Sparkles,
  Warehouse,
  Building2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import OfferCard from '../components/OfferCard';
import CropCard from '../components/CropCard';
import { formatINR } from '../utils/formatters';
import api, { getMyCrops } from '../services/api';
import { getReceivedOffers } from '../services/offerService';
import { getMarketData } from '../services/marketService';
import { getFarmerOrders } from '../services/orderService';
import { compareMarketAndOffers } from '../utils/priceDiscovery';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [marketRecords, setMarketRecords] = useState([]);
  const [loadingMarkets, setLoadingMarkets] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;

    // Load crops
    async function loadCrops() {
      try {
        const res = await getMyCrops();
        const cropsList =
          res?.data?.crops ||
          (Array.isArray(res?.data) ? res.data : []) ||
          res?.crops ||
          [];
        if (isMounted && res?.success) {
          setCrops(cropsList);
        }
      } catch (err) {
        console.warn('Could not fetch real crops for dashboard metrics:', err);
        if (isMounted) setLoadError('Unable to load dashboard data. Check the server connection and try again.');
      } finally {
        if (isMounted) setLoadingCrops(false);
      }
    }

    // Load real received offers
    async function loadOffers() {
      try {
        const res = await getReceivedOffers();
        const offerList =
          res?.data?.offers ||
          (Array.isArray(res?.data) ? res.data : []) ||
          res?.offers ||
          [];
        if (isMounted && res?.success) {
          setOffers(offerList);
        }
      } catch (err) {
        console.warn('Could not fetch real received offers for dashboard:', err);
        if (isMounted) setLoadError('Unable to load dashboard data. Check the server connection and try again.');
      } finally {
        if (isMounted) setLoadingOffers(false);
      }
    }

    // Load demo APMC market records from backend API
    async function loadMarkets() {
      try {
        const res = await getMarketData();
        const list = res?.data?.markets || [];
        if (isMounted && res?.success) {
          setMarketRecords(list);
        }
      } catch (err) {
        console.warn('Could not fetch backend market data for dashboard:', err);
        if (isMounted) setLoadError('Unable to load dashboard data. Check the server connection and try again.');
      } finally {
        if (isMounted) setLoadingMarkets(false);
      }
    }

    // Load real orders
    async function loadOrders() {
      try {
        const res = await getFarmerOrders();
        const list =
          res?.data?.orders ||
          (Array.isArray(res?.data) ? res.data : []) ||
          res?.orders ||
          [];
        if (isMounted && res?.success) {
          setOrders(list);
        }
      } catch (err) {
        console.warn('Could not fetch real orders for dashboard:', err);
        if (isMounted) setLoadError('Unable to load dashboard data. Check the server connection and try again.');
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    }

    loadCrops();
    loadOffers();
    loadMarkets();
    loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute real metrics from crops
  const activeCrops = crops.filter((c) => c.status === 'available');
  const activeCropsCount = activeCrops.length;
  const totalListingsCount = crops.length;

  const realEstimatedValue = activeCrops.reduce((acc, c) => {
    const multiplier =
      c.unit === 'tonne' ? 1000 : c.unit === 'quintal' ? 100 : 1;
    return acc + (Number(c.quantity) || 0) * (Number(c.expectedPricePerKg) || 0) * multiplier;
  }, 0);

  // Real pending offers
  const pendingOffers = offers.filter((o) => o.status === 'pending');
  const pendingOffersCount = pendingOffers.length;
  const recentPendingOffers = pendingOffers.slice(0, 2);

  // Real order metrics
  const activeOrders = orders.filter((o) =>
    ['confirmed', 'in_transit', 'delivered'].includes(o.orderStatus)
  );
  const activeOrdersCount = activeOrders.length;
  const totalOrderEarnings = orders
    .filter((o) => o.orderStatus === 'completed')
    .reduce((sum, o) => sum + (Number(o.netAmount) || 0), 0);
  const recentOrders = orders.slice(0, 2);

  const featuredMarkets = marketRecords.slice(0, 4);
  const recentCrops = crops.slice(0, 3);
  const primaryCrop = crops[0] || null;

  // Price discovery quick analysis for the primary crop
  const quickDecision = useMemo(() => {
    if (!primaryCrop || marketRecords.length === 0) return null;
    return compareMarketAndOffers(primaryCrop, marketRecords, offers);
  }, [primaryCrop, marketRecords, offers]);

  if (!loadingCrops && !loadingOffers && !loadingMarkets && !loadingOrders && loadError) {
    return (
      <div className="portal-page-container">
        <div className="page-title-banner">
          <div>
            <h2 className="page-heading">Dashboard unavailable</h2>
            <p className="page-subheading">Your session is preserved. Reconnect to the server and retry.</p>
          </div>
        </div>
        <div className="alert-box alert-error requirements-error" role="alert">
          <span><AlertCircle size={16} /> {loadError}</span>
          <button type="button" className="btn btn-secondary-action" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-page-container">
      {/* Welcome Banner */}
      <motion.div
        className="welcome-banner"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="welcome-text-col">
          <span className="welcome-badge">Farmer Dashboard</span>
          <h2 className="welcome-heading">
            Namaste, {user?.name || 'Farmer'}!
          </h2>
          <p className="welcome-subtext">
            Here is your live farm harvest overview, transparent APMC mandi benchmarks, and real-time buyer bids awaiting your decision.
          </p>
        </div>

        <div className="welcome-action-col">
          <Link to="/add-crop" className="btn btn-primary-action">
            <PlusCircle size={18} />
            <span>List New Crop</span>
          </Link>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <div className="stats-grid-row">
        <StatCard
          title="Active Listed Crops"
          value={loadingCrops ? '...' : activeCropsCount}
          icon={Sprout}
          trend={activeCropsCount > 0 ? 'up' : 'stable'}
          trendLabel={`${activeCropsCount} Ready for Sale`}
          helperText={`Out of ${totalListingsCount} total farm listings`}
        />
        <StatCard
          title="Pending Buyer Bids"
          value={loadingOffers ? '...' : pendingOffersCount}
          icon={Handshake}
          trend={pendingOffersCount > 0 ? 'up' : 'stable'}
          trendLabel={`${pendingOffersCount} Awaiting Review`}
          helperText="Live procurement offers"
          accentColor="#235347"
        />
        <StatCard
          title="Active Orders"
          value={loadingOrders ? '...' : activeOrdersCount}
          icon={ShoppingBag}
          trend={activeOrdersCount > 0 ? 'up' : 'stable'}
          trendLabel={`${activeOrdersCount} In Progress`}
          helperText="Confirmed buyer purchase orders"
        />
        <StatCard
          title="Estimated Active Value"
          value={loadingCrops ? '...' : formatINR(realEstimatedValue)}
          icon={IndianRupee}
          trend={realEstimatedValue > 0 ? 'up' : 'stable'}
          trendLabel="Inventory Valuation"
          helperText="Across active ready produce"
        />
      </div>

      {/* Real Recent Crops Section */}
      {recentCrops.length > 0 && (
        <div className="dashboard-section-box" style={{ marginBottom: '24px' }}>
          <div className="section-box-header">
            <div>
              <h3 className="section-box-title">Recent Crop Listings</h3>
              <p className="section-box-subtitle">
                Your live registered produce items available for buyer discovery and bids.
              </p>
            </div>
            <Link to="/my-crops" className="section-link">
              <span>View All ({crops.length})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="crops-grid-display">
            {recentCrops.map((crop) => (
              <CropCard
                key={crop._id}
                crop={crop}
                onEdit={(c) => navigate(`/my-crops/${c._id}/edit`)}
                onDelete={() => navigate('/my-crops')}
                onActionNotice={showToast}
              />
            ))}
          </div>
        </div>
      )}

      {/* Decision Support Quick Recommendation Snippet */}
      {quickDecision?.recommendedOption && primaryCrop && (
        <div className="quick-decision-card" style={{ marginBottom: '24px' }}>
          <div className="quick-decision-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="#F57F17" />
              <span className="quick-decision-tag">
                Price Discovery Spotlight · {primaryCrop.name}
              </span>
            </div>
            <Link to={`/market-prices?cropId=${primaryCrop._id}`} className="section-link">
              <span>Full Net Comparison</span>
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="quick-decision-content">
            <div className="quick-decision-body">
              <strong className="quick-rec-title">
                Best Channel: {quickDecision.recommendedOption.name} (
                {quickDecision.recommendedOption.type === 'buyer' ? 'Buyer Offer' : 'APMC Mandi'}
                )
              </strong>
              <p className="quick-rec-text">{quickDecision.explanation}</p>
            </div>
            <div className="quick-decision-val tabular-nums">
              <span className="quick-val-number">
                ₹{quickDecision.recommendedOption.netPerKg.toFixed(2)}
              </span>
              <small>/kg net</small>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Live Market Ticker & Pending Offers */}
      <div className="dashboard-columns-grid">
        {/* Left Column: APMC Mandi Market Snapshot */}
        <div className="dashboard-section-box">
          <div className="section-box-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="section-box-title">Telangana APMC Mandi Rates</h3>
                <span className="badge-pill" style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'var(--sage-100)', color: 'var(--forest-900)', borderRadius: '4px', fontWeight: 600 }}>Market Yard Benchmark</span>
              </div>
              <p className="section-box-subtitle">
                Regional modal wholesale rates across Telangana APMC market yards.
              </p>
            </div>
            <Link to="/market-prices" className="section-link">
              <span>Compare Mandis</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loadingMarkets ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading mandi benchmarks...
            </div>
          ) : (
            <div className="market-ticker-list">
              {featuredMarkets.map((item) => (
                <div key={item._id} className="market-ticker-row">
                  <div className="ticker-crop-info">
                    <span className="ticker-crop-name">{item.crop}</span>
                    <span className="ticker-market-name">{item.marketName} ({item.district})</span>
                  </div>
                  <div className="ticker-price-info">
                    <div className="ticker-modal-price tabular-nums">
                      ₹{item.modalPricePerKg} <small>/ kg</small>
                    </div>
                    <span
                      className={`ticker-trend ${
                        item.trend === 'rising'
                          ? 'trend-up'
                          : item.trend === 'falling'
                          ? 'trend-down'
                          : 'trend-stable'
                      }`}
                    >
                      {item.trend === 'rising' ? '▲ ' : item.trend === 'falling' ? '▼ ' : '■ '}
                      {item.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Real Pending Buyer Offers */}
        <div className="dashboard-section-box">
          <div className="section-box-header">
            <div>
              <h3 className="section-box-title">Recent Buyer Offers</h3>
              <p className="section-box-subtitle">
                Direct procurement bids from registered agribusinesses.
              </p>
            </div>
            <Link to="/offers" className="section-link">
              <span>View All ({pendingOffersCount})</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loadingOffers ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading buyer offers...
            </div>
          ) : recentPendingOffers.length > 0 ? (
            <div className="recent-offers-list">
              {recentPendingOffers.map((offer) => (
                <OfferCard
                  key={offer._id}
                  offer={offer}
                  onAccept={() => navigate('/offers')}
                  onReject={() => navigate('/offers')}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Handshake size={32} color="var(--forest-600)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.88rem' }}>No pending buyer bids at this moment.</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity timeline removed as part of Phase 11 */}
    </div>
  );
}
