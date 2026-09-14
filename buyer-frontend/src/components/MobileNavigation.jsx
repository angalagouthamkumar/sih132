import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Search,
  PlusSquare,
  Handshake,
  ShoppingBag,
  User,
  LogOut,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MobileNavigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    setDrawerOpen(false);
    logout();
    navigate('/login');
  };

  const primaryItems = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/browse-crops', label: 'Browse', icon: Search },
    { to: '/create-requirement', label: 'Post', icon: PlusSquare },
    { to: '/offers', label: 'Bids', icon: Handshake },
  ];

  return (
    <>
      {/* Fixed Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <div className="mobile-nav-items-grid">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `mobile-nav-link ${isActive ? 'mobile-nav-active' : ''}`
                }
              >
                <Icon size={19} />
                <span className="mobile-nav-label">{item.label}</span>
              </NavLink>
            );
          })}

          {/* More Drawer Trigger */}
          <button
            type="button"
            className={`mobile-nav-link ${drawerOpen ? 'mobile-nav-active' : ''}`}
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="Open more navigation options"
          >
            <Menu size={19} />
            <span className="mobile-nav-label">More</span>
          </button>
        </div>
      </nav>

      {/* Slide-over More Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="mobile-drawer-backdrop" onClick={() => setDrawerOpen(false)}>
            <motion.div
              className="mobile-drawer-box"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={18} color="var(--forest-700)" />
                  <div>
                    <h3 className="drawer-title">{user?.businessName || 'Buyer Portal'}</h3>
                    <span className="drawer-sub">{user?.name || 'Authorized Buyer'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="drawer-close-btn"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mobile-drawer-body">
                <ul className="drawer-list">
                  <li>
                    <NavLink
                      to="/orders"
                      className="drawer-item"
                      onClick={() => setDrawerOpen(false)}
                    >
                      <ShoppingBag size={18} />
                      <span>Procurement Orders</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/profile"
                      className="drawer-item"
                      onClick={() => setDrawerOpen(false)}
                    >
                      <User size={18} />
                      <span>Enterprise Profile</span>
                    </NavLink>
                  </li>
                </ul>

                <button
                  type="button"
                  className="drawer-logout-btn"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Sign Out of Portal</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
