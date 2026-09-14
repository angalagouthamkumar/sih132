import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, Mail, MapPin, ShieldCheck, Save, Globe, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/api';

export default function Profile() {
  const { user, updateUserState } = useAuth();
  const { showToast } = useOutletContext();
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    language: 'Telugu',
    farmSizeAcres: '',
    primaryCrops: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateUserProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
      });
      if (res?.success) {
        if (updateUserState && res.data) {
          updateUserState(res.data);
        }
        showToast('Profile updated successfully!', 'success');
      } else {
        showToast(res?.message || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error updating profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="portal-page-container">
      {/* Page Header */}
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">Farmer Account & Farm Details</h2>
          <p className="page-subheading">
            Manage your personal contact details, primary farm location, and agricultural preferences.
          </p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column: Summary Card */}
        <div className="card profile-summary-card">
          <div className="profile-badge-header">
            <div className="profile-large-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'F'}
            </div>
            <h3 className="profile-title-name">{user?.name}</h3>
            <div className="profile-role-row">
              <span className="portal-tag">Verified Farmer</span>
              <span className="status-badge online" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                Active KYC
              </span>
            </div>
          </div>

          <div className="profile-info-list">
            <div className="profile-info-item">
              <Mail size={16} color="var(--forest-600)" />
              <div className="info-text">
                <span className="info-label">Email</span>
                <span className="info-value">{user?.email}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <Phone size={16} color="var(--forest-600)" />
              <div className="info-text">
                <span className="info-label">Mobile</span>
                <span className="info-value tabular-nums">{user?.phone}</span>
              </div>
            </div>

            <div className="profile-info-item">
              <MapPin size={16} color="var(--forest-600)" />
              <div className="info-text">
                <span className="info-label">Dispatch Location</span>
                <span className="info-value">{user?.location || 'Telangana'}</span>
              </div>
            </div>
          </div>

          <div className="meta-panel" style={{ marginTop: '20px' }}>
            <div className="meta-row">
              <span className="meta-key">Farmer ID</span>
              <span className="meta-value tabular-nums" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                {user?._id}
              </span>
            </div>
            <div className="meta-row">
              <span className="meta-key">Portal Tier</span>
              <span className="meta-value">Direct Mandi Access</span>
            </div>
          </div>
        </div>

        {/* Right Column: Editable Form */}
        <motion.div
          className="card profile-form-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="card-header" style={{ marginBottom: '20px' }}>
            <h3 className="card-title">Edit Farm Profile Information</h3>
            <p className="card-subtitle">
              Keep your farm land acreage and primary harvest crops accurate for buyer matchmaking.
            </p>
          </div>

          <form onSubmit={handleSave}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Mobile Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="location" className="form-label">
                  Village / District Location
                </label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  className="form-input"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="language" className="form-label">
                  Preferred Communication Language
                </label>
                <select
                  id="language"
                  name="language"
                  className="form-input"
                  value={formData.language}
                  onChange={handleChange}
                >
                  <option value="Telugu">Telugu (తెలుగు)</option>
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="farmSizeAcres" className="form-label">
                  Total Farm Size (Acres)
                </label>
                <input
                  id="farmSizeAcres"
                  type="number"
                  name="farmSizeAcres"
                  className="form-input"
                  value={formData.farmSizeAcres}
                  onChange={handleChange}
                  min="0.5"
                  step="0.5"
                />
              </div>

              <div className="form-group">
                <label htmlFor="primaryCrops" className="form-label">
                  Primary Cultivated Crops
                </label>
                <input
                  id="primaryCrops"
                  type="text"
                  name="primaryCrops"
                  className="form-input"
                  value={formData.primaryCrops}
                  onChange={handleChange}
                  placeholder="e.g. Paddy, Cotton, Chilli"
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary-action" disabled={isSaving}>
                <Save size={16} />
                <span>{isSaving ? 'Saving Updates...' : 'Save Profile Updates'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
