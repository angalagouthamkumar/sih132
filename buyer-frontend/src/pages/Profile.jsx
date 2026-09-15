import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useOutletContext } from 'react-router-dom';
import { User, Building2, Mail, Phone, MapPin, Edit3, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/api';

export default function Profile() {
  const { user, updateUserState } = useAuth();
  const { showToast } = useOutletContext();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    businessName: user?.businessName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateUserProfile({
        name: formData.name.trim(),
        businessName: formData.businessName.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
      });
      if (res?.success) {
        if (updateUserState && res.data) {
          updateUserState(res.data);
        }
        setSaved(true);
        setEditMode(false);
        showToast('Enterprise profile updated successfully!', 'success');
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
      <div className="page-title-banner">
        <div>
          <h2 className="page-heading">Enterprise Business Profile</h2>
          <p className="page-subheading">
            Your verified procurement entity details as registered on the SIH26132 platform.
          </p>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Main Profile Card */}
        <motion.div
          className="card profile-main-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Profile Header */}
          <div className="profile-card-header">
            <div className="profile-avatar-lg">
              <span>
                {(user?.name || 'BP').trim().split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
              </span>
            </div>
            <div className="profile-header-info">
              <h3 className="profile-user-name">{user?.name || 'Buyer Account'}</h3>
              <div className="profile-business-line">
                <Building2 size={14} color="var(--forest-600)" />
                <span>{user?.businessName || 'Business Account'}</span>
              </div>
              <div className="profile-role-badge">Authorized Buyer</div>
            </div>

            {!editMode && (
              <button
                type="button"
                className="btn btn-secondary-action profile-edit-btn"
                onClick={() => setEditMode(true)}
              >
                <Edit3 size={15} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>

          {/* Profile Form */}
          {saved && !editMode && (
            <div className="alert-box alert-success" style={{ marginBottom: '20px' }}>
              <CheckCircle2 size={16} />
              <span>Enterprise profile details updated and saved successfully.</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="profile-fields-grid">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  <User size={14} style={{ marginRight: '6px' }} />
                  Contact Name
                </label>
                {editMode ? (
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="profile-field-display">{formData.name || '—'}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="businessName" className="form-label">
                  <Building2 size={14} style={{ marginRight: '6px' }} />
                  Business / Enterprise Name
                </label>
                {editMode ? (
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    className="form-input"
                    value={formData.businessName}
                    onChange={handleChange}
                  />
                ) : (
                  <div className="profile-field-display">{formData.businessName || '—'}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  <Mail size={14} style={{ marginRight: '6px' }} />
                  Registered Email
                </label>
                <div className="profile-field-display profile-field-locked">
                  {formData.email}
                  <span className="locked-badge">Verified</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  <Phone size={14} style={{ marginRight: '6px' }} />
                  Contact Phone Number
                </label>
                {editMode ? (
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 9XXXXXXXXX"
                  />
                ) : (
                  <div className="profile-field-display">{formData.phone || '—'}</div>
                )}
              </div>

              <div className="form-group profile-full-width">
                <label htmlFor="location" className="form-label">
                  <MapPin size={14} style={{ marginRight: '6px' }} />
                  Business Location / Head Office
                </label>
                {editMode ? (
                  <input
                    id="location"
                    name="location"
                    type="text"
                    className="form-input"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Hyderabad, Telangana"
                  />
                ) : (
                  <div className="profile-field-display">{formData.location || '—'}</div>
                )}
              </div>
            </div>

            {editMode && (
              <div className="form-actions-row" style={{ marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary-action">
                  <CheckCircle2 size={16} />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary-action"
                  onClick={() => {
                    setEditMode(false);
                    setFormData({
                      name: user?.name || '',
                      businessName: user?.businessName || '',
                      email: user?.email || '',
                      phone: user?.phone || '',
                      location: user?.location || '',
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </motion.div>

        {/* Security Sidebar */}
        <div>
          <motion.div
            className="card profile-security-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="security-card-header">
              <Shield size={18} color="var(--forest-600)" />
              <h4 className="security-card-title">Account Security</h4>
            </div>
            <ul className="security-list">
              <li className="security-item security-item-ok">
                <CheckCircle2 size={14} color="var(--success-text)" />
                <span>Buyer role verified</span>
              </li>
              <li className="security-item security-item-ok">
                <CheckCircle2 size={14} color="var(--success-text)" />
                <span>JWT session active</span>
              </li>
              <li className="security-item security-item-ok">
                <CheckCircle2 size={14} color="var(--success-text)" />
                <span>Business entity registered</span>
              </li>
              <li className="security-item security-item-ok">
                <CheckCircle2 size={14} color="var(--success-text)" />
                <span>Session managed securely</span>
              </li>
            </ul>
            <p className="security-note">
              Passwords are managed securely. Contact support to update your account credentials.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
