import React, { useState, useEffect } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, RefreshCw, UserPlus, Mail, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { sendSignupOTPUser } from '../services/api';

export default function Signup() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
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
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Modal & OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // 60-second countdown timer for resending OTP inside modal
  useEffect(() => {
    let interval = null;
    if (showOtpModal && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showOtpModal, resendTimer]);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    }

    const trimmedEmail = formData.email.trim().toLowerCase();
    if (!trimmedEmail) {
      newErrors.email = 'Email address is required';
    } else if (!trimmedEmail.endsWith('@gmail.com') || trimmedEmail.length <= 10) {
      newErrors.email = 'Only valid @gmail.com addresses are accepted.';
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
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

  // Step 1: Validate form, send real Gmail OTP, and open modal
  const handleInitiateSignup = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSendingOtp(true);
    setApiError('');

    try {
      const res = await sendSignupOTPUser(formData.email.trim().toLowerCase());
      setShowOtpModal(true);
      setOtp('');
      setModalError('');
      setModalSuccess(res.message || 'Verification OTP sent to your Gmail inbox.');
      setResendTimer(60);
      setCanResend(false);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to send verification code. Please try again.';
      setApiError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Resend OTP in Step 2 modal
  const handleResendSignupOTP = async () => {
    if (!canResend || isSendingOtp) return;
    setIsSendingOtp(true);
    setModalError('');
    setModalSuccess('');

    try {
      const res = await sendSignupOTPUser(formData.email.trim().toLowerCase());
      setResendTimer(60);
      setCanResend(false);
      setModalSuccess(res.message || 'A new verification code has been sent to your Gmail inbox.');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to resend verification code.';
      setModalError(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Submit OTP and complete registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) {
      setModalError('Please enter the 6-digit numeric verification code.');
      return;
    }

    setIsVerifyingOtp(true);
    setModalError('');

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        password: formData.password,
        otp: otp.trim(),
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check the code and try again.';
      setModalError(msg);
    } finally {
      setIsVerifyingOtp(false);
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
        <span className="portal-tag">Farmer Portal</span>
      </header>

      <main className="auth-content">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="auth-card-header">
            <h1 className="auth-title">Farmer Registration</h1>
            <p className="auth-subtitle">
              Create an account to list crops, view market information, and manage offers.
            </p>
          </div>

          {apiError && (
            <div className="alert-box alert-error" role="alert" style={{ marginBottom: '16px' }}>
              <AlertCircle size={16} className="alert-icon" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleInitiateSignup} noValidate>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name <span className="req-star">*</span>
              </label>
              <input
                id="name"
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                value={formData.name}
                onChange={handleChange}
                placeholder="Ravi Kumar"
                disabled={isSendingOtp}
                required
              />
              {errors.name && <p className="form-error-text">{errors.name}</p>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Gmail Address <span className="req-star">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ravi@gmail.com"
                  autoComplete="email"
                  disabled={isSendingOtp}
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
                  placeholder="9876543210"
                  maxLength={10}
                  disabled={isSendingOtp}
                  required
                />
                {errors.phone && <p className="form-error-text">{errors.phone}</p>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="location" className="form-label">
                Location / District
              </label>
              <input
                id="location"
                type="text"
                name="location"
                className="form-input"
                value={formData.location}
                onChange={handleChange}
                placeholder="Warangal, Telangana"
                disabled={isSendingOtp}
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
                    disabled={isSendingOtp}
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
                    disabled={isSendingOtp}
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
              disabled={isSendingOtp}
              style={{ marginTop: '20px' }}
            >
              {isSendingOtp ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <Mail size={16} />
                  <span>Verify Gmail & Register</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-text">
            <span>Already have an account? </span>
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Step 2: OTP Verification Modal */}
      {showOtpModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '460px',
              width: '100%',
              padding: '28px 24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e5e7eb',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              aria-label="Close modal"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#9ca3af',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <ShieldCheck size={28} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 6px', color: '#111827' }}>
                Verify Your Gmail Address
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                Enter the 6-digit code sent to<br />
                <strong style={{ color: '#15803d' }}>{formData.email}</strong>
              </p>
            </div>

            {modalError && (
              <div className="alert-box alert-error" role="alert" style={{ marginBottom: '16px' }}>
                <AlertCircle size={16} className="alert-icon" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div
                className="alert-box alert-success"
                style={{
                  marginBottom: '16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: '#166534',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              >
                <ShieldCheck size={16} style={{ flexShrink: 0 }} />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifyAndRegister} noValidate>
              <div className="form-group">
                <label htmlFor="signup-otp" className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                  6-Digit Verification Code
                </label>
                <input
                  id="signup-otp"
                  type="text"
                  maxLength={6}
                  className={`form-input ${modalError ? 'form-input-error' : ''}`}
                  style={{
                    letterSpacing: '6px',
                    fontSize: '1.4rem',
                    textAlign: 'center',
                    fontWeight: 700,
                  }}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    if (modalError) setModalError('');
                  }}
                  placeholder="000000"
                  disabled={isVerifyingOtp}
                  autoFocus
                  required
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '8px',
                  marginBottom: '18px',
                  fontSize: '0.84rem',
                  color: 'var(--text-secondary, #6b7280)',
                }}
              >
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendSignupOTP}
                  disabled={!canResend || isSendingOtp || isVerifyingOtp}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: canResend ? 'var(--forest-600, #15803d)' : '#9ca3af',
                    cursor: canResend ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                  }}
                >
                  {isSendingOtp ? 'Sending...' : canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-block"
                disabled={isVerifyingOtp || otp.length !== 6}
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Verifying & Creating Account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Verify & Complete Registration</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => setShowOtpModal(false)}
                style={{ marginTop: '10px' }}
                disabled={isVerifyingOtp}
              >
                Edit Registration Details
              </button>
            </form>
          </motion.div>
        </div>
      )}

      <footer className="footer">
        SIH26132 &bull; Farmer Portal &bull; Role Protection Active
      </footer>
    </div>
  );
}
