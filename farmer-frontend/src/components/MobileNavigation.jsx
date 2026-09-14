import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  PlusCircle,
  TrendingUp,
  MoreHorizontal,
  Handshake,
  ShoppingBag,
  User,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileNavigation() {
  const { logout } = useAuth();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const primaryTabs = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/my-crops', label: 'Crops', icon: Sprout },
    { to: '/add-crop', label: 'Add Crop', icon: PlusCircle, isAction: true },
    { to: '/market-prices', label: 'Mandi', icon: TrendingUp },
  ];

  const moreTabs = [
    { to: '/offers', label: 'Buyer Offers', icon: Handshake },
    { to: '/orders', label: 'My Orders', icon: ShoppingBag },
    { to: '/profile', label: 'Farmer Profile', icon: User },
  ];

  return (
    <>
      {/* Drawer overlay for "More" menu */}
      {showMoreMenu && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <span className="drawer-title">Additional Features</span>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setShowMoreMenu(false)}
              >
                <X size={18} />
              </button>
            </div>

            <ul className="drawer-list">
              {moreTabs.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `drawer-item ${isActive ? 'drawer-item-active' : ''}`
                      }
                      onClick={() => setShowMoreMenu(false)}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
              <li>
                <button
                  type="button"
                  className="drawer-item drawer-logout"
                  onClick={() => {
                    setShowMoreMenu(false);
                    logout();
                  }}
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <nav className="mobile-bottom-nav">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `bottom-nav-item ${isActive ? 'active' : ''} ${tab.isAction ? 'action-tab' : ''}`
              }
            >
              <Icon size={tab.isAction ? 22 : 18} />
              <span className="bottom-nav-label">{tab.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          className={`bottom-nav-item ${showMoreMenu ? 'active' : ''}`}
          onClick={() => setShowMoreMenu(!showMoreMenu)}
        >
          <MoreHorizontal size={18} />
          <span className="bottom-nav-label">More</span>
        </button>
      </nav>
    </>
  );
}
