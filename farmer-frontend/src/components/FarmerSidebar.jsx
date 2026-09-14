import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  PlusCircle,
  TrendingUp,
  Handshake,
  ShoppingBag,
  User,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function FarmerSidebar() {
  const { user, logout } = useAuth();

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/my-crops', label: 'My Crops', icon: Sprout },
    { to: '/add-crop', label: 'Add Crop', icon: PlusCircle },
    { to: '/market-prices', label: 'Market Prices', icon: TrendingUp },
    { to: '/offers', label: 'Buyer Offers', icon: Handshake },
    { to: '/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/profile', label: 'Farmer Profile', icon: User },
  ];

  return (
    <aside className="farmer-sidebar">
      <div className="sidebar-brand">
        <div className="brand-group">
          <div className="brand-logo">S</div>
          <div>
            <div className="brand-title">SIH26132</div>
            <div className="sidebar-portal-badge">Farmer Portal</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        <ul className="nav-list">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="nav-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                >
                  <Icon size={18} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                  <ChevronRight size={14} className="nav-arrow" />
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-pill">
          <div className="user-avatar-sm">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
          </div>
          <div className="user-info-sm">
            <div className="user-name-sm">{user?.name || 'Farmer'}</div>
            <div className="user-role-sm">{user?.location || 'Telangana'}</div>
          </div>
        </div>
        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={logout}
          title="Sign out of farmer portal"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
