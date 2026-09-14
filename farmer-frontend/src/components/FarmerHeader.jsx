import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function FarmerHeader({ pageTitle = 'Dashboard' }) {
  const { user, logout } = useAuth();

  return (
    <header className="farmer-header">
      <div className="header-left">
        <h1 className="header-page-title">{pageTitle}</h1>
      </div>

      <div className="header-right">
        {/* Farmer Profile Pill */}
        <Link to="/profile" className="header-profile-pill">
          <div className="header-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
          </div>
          <span className="header-user-name">{user?.name}</span>
        </Link>

        {/* Sign out */}
        <button
          type="button"
          className="header-signout-btn"
          onClick={logout}
          title="Sign Out"
        >
          <LogOut size={16} />
          <span className="header-signout-text">Logout</span>
        </button>
      </div>
    </header>
  );
}
