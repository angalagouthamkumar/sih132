import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, UserCheck, Phone, Mail, MapPin, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPlaceholder({ portalTitle = 'Farmer Dashboard' }) {
  const { user, logout } = useAuth();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand-group">
          <div className="brand-logo">S</div>
          <div>
            <div className="brand-title">SIH26132 Platform</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="portal-tag">Farmer Portal</span>
          <button type="button" className="btn btn-secondary" onClick={logout}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="main-content">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 className="card-title">{portalTitle}</h1>
              <p className="card-subtitle">
                Authenticated session active with role-based access control.
              </p>
            </div>
            <span className="status-badge online">
              <ShieldCheck size={14} /> Protected Session
            </span>
          </div>

          <div className="user-profile-summary">
            <div className="profile-header-row">
              <div className="profile-avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 className="profile-name">{user?.name}</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <span className="portal-tag">{user?.role}</span>
                  <span className="status-badge online" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                    Active
                  </span>
                </div>
              </div>
            </div>

            <div className="status-grid" style={{ marginTop: '24px' }}>
              <div className="status-tile">
                <div className="status-tile-header">
                  <span className="status-tile-label">Contact Email</span>
                  <Mail size={16} color="var(--forest-600)" />
                </div>
                <div className="status-tile-value" style={{ fontSize: '1rem', wordBreak: 'break-all' }}>
                  {user?.email}
                </div>
              </div>

              <div className="status-tile">
                <div className="status-tile-header">
                  <span className="status-tile-label">Registered Phone</span>
                  <Phone size={16} color="var(--forest-600)" />
                </div>
                <div className="status-tile-value tabular-nums" style={{ fontSize: '1rem' }}>
                  {user?.phone}
                </div>
              </div>

              <div className="status-tile">
                <div className="status-tile-header">
                  <span className="status-tile-label">Location</span>
                  <MapPin size={16} color="var(--forest-600)" />
                </div>
                <div className="status-tile-value" style={{ fontSize: '1rem' }}>
                  {user?.location || 'Not Specified'}
                </div>
              </div>
            </div>

            <div className="meta-panel" style={{ marginTop: '24px' }}>
              <div className="meta-row">
                <span className="meta-key">User ID</span>
                <span className="meta-value tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {user?._id}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Access Level</span>
                <span className="meta-value">Farmer Authorized Access</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Session Persistence</span>
                <span className="meta-value">Valid 7 Days (JWT Bearer)</span>
              </div>
            </div>

            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={logout}>
                <LogOut size={16} />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="footer">
        SIH26132 &bull; Farmer Portal &bull; Authentication & Role Protection Active
      </footer>
    </div>
  );
}
