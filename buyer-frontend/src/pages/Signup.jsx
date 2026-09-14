import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, RefreshCw, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    location: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Contact person name is required';
    }

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business or company name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmation password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      await register({
        name: formData.name.trim(),
        businessName: formData.businessName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        password: formData.password,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <header className="auth-header">
        <div className="brand-group">
          <div className="brand-logo">S</div>
          <div>
            <div className="brand-title">SIH26132</div>
          </div>
        </div>
        <span className="portal-tag">Buyer Portal</span>
      </header>

      <main className="auth-content" style={{ maxWidth: '520px' }}>
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="auth-card-header">
            <h1 className="auth-title">Buyer Registration</h1>
            <p className="auth-subtitle">
              Register your business entity to source quality produce directly from certified farmers.
            </p>
          </div>

          {apiError && (
            <div className="alert-box alert-error" role="alert">
              <AlertCircle size={16} className="alert-icon" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name" className="form-label">
                  Contact Person Name <span className="req-star">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Sunita Sharma"
                  disabled={isSubmitting}
                  required
                />
                {errors.name && <p className="form-error-text">{errors.name}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="businessName" className="form-label">
                  Business / Company Name <span className="req-star">*</span>
                </label>
                <input
                  id="businessName"
                  type="text"
                  name="businessName"
                  className={`form-input ${errors.businessName ? 'form-input-error' : ''}`}
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Agro Trading Co."
                  disabled={isSubmitting}
                  required
                />
                {errors.businessName && <p className="form-error-text">{errors.businessName}</p>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Business Email <span className="req-star">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="procurement@agrotrading.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                />
                {errors.email && <p className="form-error-text">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number <span className="req-star">*</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  className={`form-input ${errors.phone ? 'form-input-error' : ''}`}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="9876501234"
                  maxLength={10}
                  disabled={isSubmitting}
                  required
                />
                {errors.phone && <p className="form-error-text">{errors.phone}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">
                Operational Headquarters / City
              </label>
              <input
                id="location"
                type="text"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                placeholder="Hyderabad, Telangana"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password <span className="req-star">*</span>
                </label>
                <div className="input-password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 8 chars"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="form-error-text">{errors.password}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm Password <span className="req-star">*</span>
                </label>
                <div className="input-password-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'form-input-error' : ''}`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="form-error-text">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-block"
              disabled={isSubmitting}
              style={{ marginTop: '20px' }}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>Registering Business...</span>
                </>
              ) : (
                <>
                  <Briefcase size={16} />
                  <span>Register Buyer Account</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-text">
            <span>Already registered your business? </span>
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </div>
        </motion.div>
      </main>

      <footer className="footer">
        SIH26132 &bull; Buyer Portal &bull; Role Protection Active
      </footer>
    </div>
  );
}
