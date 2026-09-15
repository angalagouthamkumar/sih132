import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sprout,
  Handshake,
  ShoppingBag,
  IndianRupee,
  Search,
  PlusSquare,
  ArrowRight,
  Clock,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import CropCard from '../components/CropCard';
import { formatINR, formatDate } from '../utils/formatters';
import { getAvailableCrops } from '../services/cropService';
import { getSentOffers } from '../services/offerService';
import { getBuyerOrders } from '../services/orderService';

export default function Dashboard() {
  const { user } = useAuth();
  const { showToast } = useOutletContext();
  const navigate = useNavigate();

  const [crops, setCrops] = useState([]);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      // 1. Fetch live available crops
      try {
        const cropRes = await getAvailableCrops();
        const cropList =
          cropRes?.data?.crops ||
          (Array.isArray(cropRes?.data) ? cropRes.data : []) ||
          cropRes?.crops ||
          [];
        if (isMounted) {
          setCrops(cropList);
        }
      } catch (err) {
        console.warn('Could not fetch real crops for buyer dashboard:', err);
      } finally {
        if (isMounted) setLoadingCrops(false);
      }

      // 2. Fetch real submitted offers
      try {
        const offerRes = await getSentOffers();
        const offerList =
          offerRes?.data?.offers ||
          (Array.isArray(offerRes?.data) ? offerRes.data : []) ||
          offerRes?.offers ||
          [];
        if (isMounted) {
          setOffers(offerList);
        }
      } catch (err) {
        console.warn('Could not fetch real sent offers for buyer dashboard:', err);
      } finally {
        if (isMounted) setLoadingOffers(false);
      }

      // 3. Fetch real orders
      try {
        const orderRes = await getBuyerOrders();
        const orderList =
          orderRes?.data?.orders ||
          (Array.isArray(orderRes?.data) ? orderRes.data : []) ||
          orderRes?.orders ||
          [];
        if (isMounted) {
          setOrders(orderList);
        }
      } catch (err) {
        console.warn('Could not fetch real orders for buyer dashboard:', err);
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    }

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, []);

  const recentCrops = crops.slice(0, 3);
  const totalAvailableCount = crops.length;
  const submittedOffersCount = offers.length;
  const pendingOffersCount = offers.filter((o) => o.status === 'pending').length;

  const activeOrdersCount = orders.filter((o) =>
    ['confirmed', 'in_transit', 'delivered'].includes(o.orderStatus)
  ).length;
  const totalProcurement = orders.reduce(
    (sum, o) => sum + (Number(o.netAmount) || 0),
    0
  );

  // Derive live activity log from real orders and submitted offers
  const realActivities = [
    ...orders.map((o) => ({
      id: `ord-${o._id}`,
      title: `Order #${o._id.slice(-6).toUpperCase()} · ${o.cropName}`,
      description: `${o.quantity} ${o.unit} · ${formatINR(o.netAmount)} · Status: ${o.orderStatus}`,
      timestamp: formatDate(o.createdAt),
      type: o.orderStatus === 'delivered' || o.orderStatus === 'completed' ? 'success' : 'info',
    })),
    ...offers.map((off) => ({
      id: `off-${off._id}`,
      title: `Procurement Bid · ${off.crop?.name || 'Produce'}`,
      description: `Offered ₹${off.offeredPricePerKg}/kg for ${off.quantity} ${off.unit || 'quintals'} (${off.status}).`,
      timestamp: formatDate(off.createdAt),
      type: off.status === 'accepted' ? 'success' : off.status === 'rejected' ? 'notice' : 'info',
    })),
  ].slice(0, 4);

  return (
    <div className="portal-page-container">
      {/* Welcome Banner */}
      <motion.div
        className="buyer-welcome-banner"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="welcome-text-col">
          <div className="welcome-badge-group">
            <span className="welcome-badge">Procurement Hub</span>
            <span className="business-tag">
              <Building2 size={13} style={{ marginRight: '4px' }} />
              {user?.businessName || 'Agribusiness Partner'}
            </span>
          </div>
          <h2 className="welcome-heading">
            Welcome back, {user?.name || 'Procurement Officer'}!
          </h2>
          <p className="welcome-subtext">
            Source quality harvests directly from registered farmers, monitor active procurement contracts, and track grain shipments in transit.
          </p>
        </div>

        <div className="welcome-action-col">
          <Link to="/browse-crops" className="btn btn-primary-action">
            <Search size={17} />
            <span>Browse All Crops</span>
          </Link>
          <Link to="/create-requirement" className="btn btn-secondary-action">
            <PlusSquare size={17} />
            <span>Post Requirement</span>
          </Link>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <div className="stats-grid-row">
        <StatCard
          title="Available Harvest Lots"
          value={loadingCrops ? '...' : totalAvailableCount}
          icon={Sprout}
          trend="up"
          trendLabel={`${totalAvailableCount} Lots Ready`}
          helperText="Available farmer produce listings"
        />
        <StatCard
          title="Submitted Bids"
          value={loadingOffers ? '...' : submittedOffersCount}
          icon={Handshake}
          trend={submittedOffersCount > 0 ? 'up' : 'stable'}
          trendLabel={`${pendingOffersCount} Pending Response`}
          helperText="Direct farmer negotiations"
          accentColor="#235347"
        />
        <StatCard
          title="Active Orders"
          value={loadingOrders ? '...' : activeOrdersCount}
          icon={ShoppingBag}
          trend={activeOrdersCount > 0 ? 'up' : 'stable'}
          trendLabel={`${activeOrdersCount} In Progress`}
          helperText="Confirmed purchase orders"
        />
        <StatCard
          title="Total Procurement"
          value={loadingOrders ? '...' : formatINR(totalProcurement)}
          icon={IndianRupee}
          trend={totalProcurement > 0 ? 'up' : 'stable'}
          trendLabel="All Orders"
          helperText="Net amount across all orders"
        />
      </div>

      {/* Real Available Crops Section */}
      <div className="dashboard-section-box" style={{ marginBottom: '28px' }}>
        <div className="section-box-header">
          <div>
            <h3 className="section-box-title">Recently Listed Harvest Produce</h3>
            <p className="section-box-subtitle">
              Live agricultural commodities listed by verified regional farmers on the platform.
            </p>
          </div>
          <Link to="/browse-crops" className="section-link">
            <span>Explore All Harvests ({totalAvailableCount})</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loadingCrops ? (
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading live harvest catalog...
          </div>
        ) : recentCrops.length > 0 ? (
          <div className="crops-grid-display">
            {recentCrops.map((crop) => (
              <CropCard key={crop._id} crop={crop} />
            ))}
          </div>
        ) : (
          <div className="empty-mini-card">
            <Sprout size={32} color="var(--forest-600)" />
            <p style={{ marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No crops are currently available in the marketplace.
            </p>
          </div>
        )}
      </div>

      {/* Procurement Activity & Guidelines */}
      <div className="dashboard-columns-grid">
        {/* Left Column: Procurement Activity Log */}
        <div className="dashboard-section-box">
          <div className="section-box-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="section-box-title">Procurement Activity Log</h3>
              </div>
              <p className="section-box-subtitle">
                Audit trail of offer negotiations, transit dispatches, and warehouse receiving.
              </p>
            </div>
          </div>

          {realActivities.length > 0 ? (
            <div className="activity-timeline">
              {realActivities.map((act) => (
                <div key={act.id} className="activity-row">
                  <div className={`activity-bullet bullet-${act.type}`}></div>
                  <div className="activity-body">
                    <div className="activity-title-row">
                      <h4 className="activity-title">{act.title}</h4>
                      <span className="activity-time">
                        <Clock size={12} /> {act.timestamp}
                      </span>
                    </div>
                    <p className="activity-desc">{act.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <Clock size={32} color="var(--forest-600)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.88rem' }}>No recent procurement transactions or bids.</p>
            </div>
          )}
        </div>

        {/* Right Column: Procurement Quick Actions & Guidelines */}
        <div className="dashboard-section-box">
          <div className="section-box-header">
            <div>
              <h3 className="section-box-title">Direct Procurement Guidelines</h3>
              <p className="section-box-subtitle">
                How direct buying works on the SIH26132 trading platform.
              </p>
            </div>
          </div>

          <div className="guidelines-list">
            <div className="guideline-card">
              <div className="guideline-num">1</div>
              <div className="guideline-content">
                <h4 className="guideline-title">Browse Available Harvests</h4>
                <p className="guideline-text">
                  Filter by commodity grade, APMC mandi dispatch district, and moisture test specifications.
                </p>
              </div>
            </div>

            <div className="guideline-card">
              <div className="guideline-num">2</div>
              <div className="guideline-content">
                <h4 className="guideline-title">Negotiate Direct Offers</h4>
                <p className="guideline-text">
                  Submit customized price bids directly to farmers without intermediate mandi broker deductions.
                </p>
              </div>
            </div>

            <div className="guideline-card">
              <div className="guideline-num">3</div>
              <div className="guideline-content">
                <h4 className="guideline-title">Secure Order Settlement</h4>
                <p className="guideline-text">
                  Payments and shipments are monitored through verified status updates until delivery is confirmed at your warehouse.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
