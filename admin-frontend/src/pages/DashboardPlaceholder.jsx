import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Shield, Phone, Mail, ShieldCheck, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPlaceholder({ portalTitle = 'Admin Dashboard' }) {
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
          <span className="portal-tag">Admin Console</span>
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
                System administration console with full regulatory and supervisory privileges.
              </p>
            </div>
            <span className="status-badge online">
              <ShieldCheck size={14} /> System Root Session
            </span>
          </div>

          <div className="user-profile-summary">
            <div className="profile-header-row">
              <div className="profile-avatar" style={{ backgroundColor: 'var(--forest-950)' }}>
                <Shield size={24} color="var(--sage-100)" />
              </div>
              <div>
                <h2 className="profile-name">{user?.name}</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                  <span className="portal-tag" style={{ backgroundColor: 'var(--forest-900)', color: 'var(--sage-100)' }}>
                    {user?.role}
                  </span>
                  <span className="status-badge online" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                    Active Root
                  </span>
                </div>
              </div>
            </div>

            <div className="status-grid" style={{ marginTop: '24px' }}>
              <div className="status-tile">
                <div className="status-tile-header">
                  <span className="status-tile-label">Administrative Email</span>
                  <Mail size={16} color="var(--forest-600)" />
                </div>
                <div className="status-tile-value" style={{ fontSize: '1rem', wordBreak: 'break-all' }}>
                  {user?.email}
                </div>
              </div>

              <div className="status-tile">
                <div className="status-tile-header">
                  <span className="status-tile-label">Security Contact Phone</span>
                  <Phone size={16} color="var(--forest-600)" />
                </div>
                <div className="status-tile-value tabular-nums" style={{ fontSize: '1rem' }}>
                  {user?.phone}
                </div>
              </div>

              <div className="status-tile">
                <div className="status-tile-header">
                  <span className="status-tile-label">Security Tier</span>
                  <Key size={16} color="var(--forest-600)" />
                </div>
                <div className="status-tile-value" style={{ fontSize: '1rem' }}>
                  Tier 1 Administrator
                </div>
              </div>
            </div>

            <div className="meta-panel" style={{ marginTop: '24px' }}>
              <div className="meta-row">
                <span className="meta-key">Administrator ID</span>
                <span className="meta-value tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {user?._id}
                </span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Assigned Role</span>
                <span className="meta-value">Global Administrator</span>
              </div>
              <div className="meta-row">
                <span className="meta-key">Token Lifespan</span>
                <span className="meta-value">7 Days (Cryptographic JWT Bearer)</span>
              </div>
            </div>

            <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={logout}>
                <LogOut size={16} />
                <span>Terminate Admin Session</span>
              </button>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="footer">
        SIH26132 &bull; Admin Portal &bull; Role Protection Active
      </footer>
    </div>
  );
}
