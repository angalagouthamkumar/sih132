import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  PlusSquare,
  Handshake,
  ShoppingBag,
  User,
  LogOut,
  Building2,
  Sprout,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function BuyerSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/browse-crops', label: 'Browse Crops', icon: Search },
    { to: '/create-requirement', label: 'Post Requirement', icon: PlusSquare },
    { to: '/offers', label: 'Submitted Bids', icon: Handshake },
    { to: '/orders', label: 'Procurement Orders', icon: ShoppingBag },
    { to: '/profile', label: 'Enterprise Profile', icon: User },
  ];

  const getInitials = (name) => {
    if (!name) return 'BP';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <aside className="buyer-sidebar-container">
      {/* Brand Identity */}
      <div className="sidebar-brand-box">
        <div className="sidebar-brand-icon">
          <Building2 size={20} />
        </div>
        <div className="sidebar-brand-text">
          <h1 className="brand-title">SIH26132</h1>
          <span className="brand-subtitle">Buyer Procurement Portal</span>
        </div>
      </div>

      {/* Enterprise Identity Pill */}
      <div className="buyer-business-badge-card">
        <div className="business-avatar-badge">
          {getInitials(user?.businessName || user?.name)}
        </div>
        <div className="business-info-text">
          <div className="business-name-text">
            {user?.businessName || 'Procurement Partner'}
          </div>
          <div className="business-buyer-name">{user?.name || 'Authorized Buyer'}</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav-menu" aria-label="Buyer Navigation">
        <ul className="sidebar-nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="sidebar-nav-item">
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-nav-link ${isActive ? 'nav-link-active' : ''}`
                  }
                >
                  <Icon size={18} className="nav-icon" />
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Footer & Logout */}
      <div className="sidebar-footer-box">
        <div className="user-profile-sm">
          <div className="user-avatar-sm">{getInitials(user?.name)}</div>
          <div className="user-info-sm">
            <span className="user-name-sm">{user?.name || 'Buyer Account'}</span>
            <span className="user-role-sm">{user?.location || 'Buyer'}</span>
          </div>
        </div>

        <button
          type="button"
          className="sidebar-logout-btn"
          onClick={handleLogout}
          aria-label="Sign Out"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
