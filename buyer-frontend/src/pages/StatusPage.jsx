import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { getHealthStatus } from '../services/api';

export default function StatusPage({ portalName = 'Buyer Portal' }) {
  const [backendState, setBackendState] = useState({
    loading: true,
    error: null,
    data: null,
  });

  const fetchHealth = async () => {
    setBackendState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await getHealthStatus();
      setBackendState({
        loading: false,
        error: null,
        data,
      });
    } catch (err) {
      setBackendState({
        loading: false,
        error: err.response?.data?.message || err.message || 'Unable to connect to backend service',
        data: null,
      });
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="brand-group">
          <div className="brand-logo">S</div>
          <div>
            <div className="brand-title">SIH26132 Platform</div>
          </div>
        </div>
        <span className="portal-tag">{portalName}</span>
      </header>

      <main className="main-content">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="card-header">
            <h1 className="card-title">MERN Foundation Ready</h1>
            <p className="card-subtitle">
              Module 1 core infrastructure status and micro-service connectivity check for {portalName}.
            </p>
          </div>

          <div className="status-grid">
            {/* Frontend Status Tile */}
            <div className="status-tile">
              <div className="status-tile-header">
                <span className="status-tile-label">Frontend Application</span>
                <span className="status-badge online">
                  <CheckCircle2 size={14} /> Operational
                </span>
              </div>
              <div className="status-tile-value">{portalName}</div>
              <p className="status-tile-desc">
                React 18 + Vite running with React Router and scoped design tokens.
              </p>
            </div>

            {/* Backend Status Tile */}
            <div className="status-tile">
              <div className="status-tile-header">
                <span className="status-tile-label">Backend Service</span>
                {backendState.loading ? (
                  <span className="status-badge loading">
                    <RefreshCw size={14} className="spin-animation" /> Connecting...
                  </span>
                ) : backendState.error ? (
                  <span className="status-badge error">
                    <AlertCircle size={14} /> Unreachable
                  </span>
                ) : (
                  <span className="status-badge online">
                    <CheckCircle2 size={14} /> Connected
                  </span>
                )}
              </div>

              <div className="status-tile-value">
                {backendState.loading
                  ? 'Checking Health...'
                  : backendState.error
                  ? 'Connection Failed'
                  : backendState.data?.message || 'Healthy'}
              </div>

              <p className="status-tile-desc">
                {backendState.loading
                  ? 'Querying GET /api/health endpoint...'
                  : backendState.error
                  ? backendState.error
                  : 'Express.js backend responsive with centralized middleware.'}
              </p>
            </div>

            {/* Database Status Tile */}
            <div className="status-tile">
              <div className="status-tile-header">
                <span className="status-tile-label">Database Engine</span>
                {backendState.loading ? (
                  <span className="status-badge loading">
                    <RefreshCw size={14} /> Checking...
                  </span>
                ) : backendState.error ? (
                  <span className="status-badge error">
                    <AlertCircle size={14} /> Unknown
                  </span>
                ) : backendState.data?.database === 'connected' ? (
                  <span className="status-badge online">
                    <CheckCircle2 size={14} /> Connected
                  </span>
                ) : (
                  <span className="status-badge warning">
                    <AlertCircle size={14} /> Disconnected
                  </span>
                )}
              </div>

              <div className="status-tile-value">
                {backendState.loading
                  ? 'Awaiting Backend...'
                  : backendState.error
                  ? 'Unavailable'
                  : `MongoDB ${backendState.data?.database || 'disconnected'}`}
              </div>

              <p className="status-tile-desc">
                {backendState.data?.database === 'connected'
                  ? 'Mongoose ODM active and operational.'
                  : 'Non-blocking database fallback active (server operating).'}
              </p>
            </div>
          </div>

          {/* Connection Error Message & Action */}
          {backendState.error && (
            <div
              style={{
                marginBottom: '24px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--error-bg)',
                border: '1px solid var(--error-border)',
                color: 'var(--error-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <strong>Backend Connection Error: </strong>
                <span>{backendState.error}</span>
              </div>
              <button
                type="button"
                className="btn"
                onClick={fetchHealth}
                style={{
                  backgroundColor: 'var(--error-text)',
                  borderColor: 'var(--error-text)',
                }}
              >
                <RefreshCw size={14} /> Retry Connection
              </button>
            </div>
          )}

          {/* Diagnostics Meta Panel */}
          <div className="meta-panel">
            <div className="meta-row">
              <span className="meta-key">API Base URL</span>
              <span className="meta-value tabular-nums">
                {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Health Endpoint</span>
              <span className="meta-value tabular-nums">/api/health</span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Architecture</span>
              <span className="meta-value">MERN (Express + React 18 + Vite)</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={fetchHealth}
              disabled={backendState.loading}
            >
              <RefreshCw
                size={14}
                style={{
                  animation: backendState.loading ? 'spin 1s linear infinite' : 'none',
                }}
              />
              Re-check Status
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="footer">
        SIH26132 &bull; Module 1 Foundation &bull; Strictly MERN Stack
      </footer>
    </div>
  );
}
