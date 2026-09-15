import { Users as UiUsers, ShoppingCart as UiShoppingCart, Truck as UiTruck, AlertTriangle as UiAlertTriangle, IndianRupee as UiIndianRupee } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/adminService';
import StatCard from '../components/StatCard';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        if (res.success) {
          setStats(res.data);
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <EmptyState message={error} icon={<UiAlertTriangle size={20} />} />;
  if (!stats) return <EmptyState />;

  const formatCurrency = (value) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const totalRegisteredUsers = (stats.totalFarmers || 0) + (stats.totalBuyers || 0);
  const hasRegisteredUsers = totalRegisteredUsers > 0;
  const farmerRatio = hasRegisteredUsers 
    ? ((stats.totalFarmers || 0) / totalRegisteredUsers) * 100 
    : 0;
  const buyerRatio = hasRegisteredUsers ? 100 - farmerRatio : 0;

  return (
    <div className="admin-page">
      <div className="page-header-row">
        <div>
          <h2 className="admin-page-title">Platform Overview</h2>
          <p className="admin-page-subtitle">Platform metrics and activity overview.</p>
        </div>
      </div>

      {/* Primary KPIs */}
      <div className="admin-kpi-grid">
        <StatCard 
          title="Total Farmers" 
          value={stats.totalFarmers ?? 0} 
          icon={<UiUsers size={20} />} 
          description="Registered farmers"
        />
        <StatCard 
          title="Total Buyers" 
          value={stats.totalBuyers ?? 0} 
          icon={<UiShoppingCart size={20} />} 
          description="Registered buyers"
        />
        <StatCard 
          title="Transaction Value" 
          value={formatCurrency(stats.transactionValue || 0)} 
          icon={<UiIndianRupee size={20} />} 
          description="Paid orders value"
        />
        <StatCard 
          title="Active Orders" 
          value={stats.activeOrders ?? 0} 
          icon={<UiTruck size={20} />} 
          description="Confirmed/In-transit"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="admin-metrics-grid">
        <div className="card admin-metric-card">
          <h3 className="card-section-title">Inventory & Trading</h3>
          <ul className="metrics-list">
            <li className="metrics-list-item">
              <span className="metrics-label">Available Crops</span>
              <span className="metrics-value">{stats.availableCrops ?? 0} listings</span>
            </li>
            <li className="metrics-list-item">
              <span className="metrics-label">Pending Offers</span>
              <span className="metrics-value">{stats.pendingOffers ?? 0} awaiting action</span>
            </li>
            <li className="metrics-list-item">
              <span className="metrics-label">Completed Orders</span>
              <span className="metrics-value text-success">{stats.completedOrders ?? 0} delivered</span>
            </li>
          </ul>
        </div>

        <div className="card admin-activity-card">
          <h3 className="card-section-title">User Activity Breakdown</h3>
          
          <div className="user-ratio-section">
            <div className="ratio-header">
              <span className="ratio-title">Farmers vs Buyers Ratio</span>
              {hasRegisteredUsers ? (
                <span className="ratio-percent-info">
                  {Math.round(farmerRatio)}% Farmers / {Math.round(buyerRatio)}% Buyers
                </span>
              ) : (
                <span className="ratio-percent-info">No users registered yet</span>
              )}
            </div>

            {hasRegisteredUsers ? (
              <>
                <div className="ratio-bar-track" role="progressbar" aria-valuenow={Math.round(farmerRatio)} aria-valuemin="0" aria-valuemax="100">
                  <div 
                    className="ratio-bar-segment-farmer"
                    style={{ width: `${farmerRatio}%` }}
                    title={`Farmers: ${stats.totalFarmers}`}
                  />
                  <div 
                    className="ratio-bar-segment-buyer"
                    style={{ width: `${buyerRatio}%` }}
                    title={`Buyers: ${stats.totalBuyers}`}
                  />
                </div>
                <div className="ratio-legend">
                  <span className="ratio-legend-item farmer">
                    <span className="legend-dot dot-farmer" /> Farmers ({stats.totalFarmers})
                  </span>
                  <span className="ratio-legend-item buyer">
                    <span className="legend-dot dot-buyer" /> Buyers ({stats.totalBuyers})
                  </span>
                </div>
              </>
            ) : (
              <div className="ratio-empty-notice">
                <span>0 registered accounts. Ratio bar will update once accounts are created.</span>
              </div>
            )}
          </div>

          <div className="mini-stat-grid">
            <div className="mini-stat-card">
              <p className="mini-stat-label">Active Accounts</p>
              <p className="mini-stat-value text-success">{stats.activeUsers ?? 0}</p>
            </div>
            <div className="mini-stat-card">
              <p className="mini-stat-label">Pending Verifications</p>
              <p className="mini-stat-value text-warning">{stats.pendingVerifications ?? 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

