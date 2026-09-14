import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BuyerHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Dynamic header titles based on pathname
  const getPageTitle = (path) => {
    if (path === '/dashboard') return 'Procurement Dashboard';
    if (path === '/browse-crops') return 'Browse Available Crops';
    if (path.startsWith('/crops/')) return 'Produce Specification';
    if (path === '/create-requirement') return 'Post Buying Requirement';
    if (path === '/offers') return 'Submitted Procurement Bids';
    if (path === '/orders') return 'Fulfillment & Dispatch Orders';
    if (path === '/profile') return 'Enterprise Business Profile';
    return 'Buyer Portal';
  };

  const getInitials = (name) => {
    if (!name) return 'BP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const businessLabel = user?.businessName
    ? user.businessName
    : user?.verificationStatus === 'verified'
    ? 'Verified Agribusiness'
    : 'Agribusiness Buyer';

  return (
    <header className="buyer-header-container">
      <div className="header-title-col">
        <h2 className="header-dynamic-title">{getPageTitle(location.pathname)}</h2>
      </div>

      <div className="header-actions-col">
        {/* User Pill / Business Badge */}
        <div className="header-user-badge">
          <div className="header-avatar-circle">{getInitials(user?.name)}</div>
          <div className="header-user-info">
            <span className="header-user-name">{user?.name || 'Buyer'}</span>
            <span className="header-user-business">{businessLabel}</span>
          </div>
        </div>

        {/* Quick Logout */}
        <button
          type="button"
          className="header-logout-btn"
          onClick={handleLogout}
          title="Sign out of buyer portal"
          aria-label="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
