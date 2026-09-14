import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Briefcase, Phone, Mail, MapPin, ShieldCheck, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPlaceholder({ portalTitle = 'Buyer Dashboard' }) {
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
          <span className="portal-tag">Buyer Portal</span>
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
                Enterprise procurement session active with verified business credentials.
              </p>
            </div>
            <span className="status-badge online">
              <ShieldCheck size={14} /> Protected Session
            </span>
          </div>

          <div className="user-profile-summary">
            <div className="profile-header-row">
              <div className="profile-avatar">
                {user?.businessName ? user.businessName.charAt(0).toUpperCase() : 'B'}
              </div>
              <div>
                <h2 className="profile-name">{user?.businessName || user?.name}</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                  <span className="portal-tag">{user?.role}</span>
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Contact: <strong>{user?.name}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="status-grid" style={{ marginTop: '24px' }}>
              <div className="status-tile">
                <div className="status-tile-header">
                  <span className="status-tile-label">Enterprise Name</span>
                  <Building2 size={16} color="var(--forest-600)" />
                </div>
                <div className="status-tile-value" style={{ fontSize: '1rem' }}>
                  {user?.businessName || 'N/A'}
                </div>
              </div>

              <div className="status-tile">
                <div className="status-tile-header">
                  <span className="status-tile-label">Procurement Email</span>
                  <Mail size={16} color="var(--forest-600)" />
                </div>
                <div className="status-tile-value" style={{ fontSize: '1rem', wordBreak: 'break-all' }}>
                  {user?.email}
                </div>
              </div>

              <div className="status-tile">
                <div className="status-tile-header">
                  <span className="status-tile-label">Business Phone</span>
                  <Phone size={16} color="var(--forest-600)" />
                </div>
                <div className="status-tile-value tabular-nums" style={{ fontSize: '1rem' }}>
                  {user?.phone}
                </div>
              </div>

              <div className="status-tile">
                <div className="status-tile-header">
                  <span className="status-tile-label">Operating City</span>
                  <MapPin size={16} color="var(--forest-600)" />
                </div>
                <div className="status-tile-value" style={{ fontSize: '1rem' }}>
                  {user?.location || 'Not Specified'}
                </div>
              </div>
            </div>

            <div className="meta-panel" style={{ marginTop: '24px' }}>
              <div className="meta-row">
                <span className="meta-key">Buyer Account ID</span>
                <span className="meta-value tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {user?._id}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Access Level</span>
                <span className="meta-value">Commercial Buyer Verified</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Session Expiry</span>
                <span className="meta-value">7 Days (Standard JWT Bearer)</span>
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
        SIH26132 &bull; Buyer Portal &bull; Authentication & Role Protection Active
      </footer>
    </div>
  );
}
