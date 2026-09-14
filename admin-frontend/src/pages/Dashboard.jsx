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
  if (error) return <EmptyState message={error} icon="⚠️" />;
  if (!stats) return <EmptyState />;

  const formatCurrency = (value) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  // Simple CSS activity bars data (mocked from stats logically to fit)
  const userRatio = stats.totalFarmers + stats.totalBuyers > 0 
    ? (stats.totalFarmers / (stats.totalFarmers + stats.totalBuyers)) * 100 
    : 50;

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h2 className="text-2xl font-heading font-bold text-primary-900 mb-1">Platform Overview</h2>
        <p className="text-text-secondary">Real-time statistics from MongoDB.</p>
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Farmers" 
          value={stats.totalFarmers} 
          icon="🧑‍🌾" 
          description="Registered farmers"
        />
        <StatCard 
          title="Total Buyers" 
          value={stats.totalBuyers} 
          icon="🛒" 
          description="Registered buyers"
        />
        <StatCard 
          title="Transaction Value" 
          value={formatCurrency(stats.transactionValue)} 
          icon="💰" 
          description="Paid orders value"
        />
        <StatCard 
          title="Active Orders" 
          value={stats.activeOrders} 
          icon="🚚" 
          description="Confirmed/In-transit"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="text-lg font-heading font-semibold text-primary-900 mb-4">Inventory & Trading</h3>
          <ul className="space-y-4">
            <li className="flex justify-between items-center">
              <span className="text-text-secondary">Available Crops</span>
              <span className="font-semibold text-primary-900 kpi-value">{stats.availableCrops} listings</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-text-secondary">Pending Offers</span>
              <span className="font-semibold text-primary-900 kpi-value">{stats.pendingOffers} awaiting action</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-text-secondary">Completed Orders</span>
              <span className="font-semibold text-success kpi-value">{stats.completedOrders} delivered</span>
            </li>
          </ul>
        </div>

        <div className="card md:col-span-2">
          <h3 className="text-lg font-heading font-semibold text-primary-900 mb-4">User Activity Breakdown</h3>
          
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold text-primary-900">Farmers vs Buyers</span>
            </div>
            <div className="h-4 w-full bg-canvas rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-primary-600 transition-all duration-1000 ease-out"
                style={{ width: `${userRatio}%` }}
                title="Farmers"
              ></div>
              <div 
                className="h-full bg-primary-400 transition-all duration-1000 ease-out"
                style={{ width: `${100 - userRatio}%` }}
                title="Buyers"
              ></div>
            </div>
            <div className="flex justify-between text-xs text-text-secondary mt-1">
              <span>Farmers ({stats.totalFarmers})</span>
              <span>Buyers ({stats.totalBuyers})</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-canvas p-4 rounded-lg">
              <p className="text-sm text-text-secondary mb-1">Active Accounts</p>
              <p className="text-2xl font-bold text-success kpi-value">{stats.activeUsers}</p>
            </div>
            <div className="bg-canvas p-4 rounded-lg">
              <p className="text-sm text-text-secondary mb-1">Pending Verifications</p>
              <p className="text-2xl font-bold text-warning kpi-value">{stats.pendingVerifications}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
