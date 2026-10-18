import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { forgotPasswordUser, verifyOTPUser, resetPasswordUser } from '../services/api';

export default function ForgotPassword() {
  const navigate = useNavigate();

  // State machine: 1 = Email Input, 2 = OTP Verification, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');

  // 60-second countdown timer for OTP resend
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
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
  }, [step, resendTimer]);

  // Step 1: Send OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setApiError('Please enter a valid business email address.');
      return;
    }

    setIsLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      const res = await forgotPasswordUser(email.trim());
      setStep(2);
      setResendTimer(60);
      setCanResend(false);
      setApiSuccess(res.message || 'OTP sent to your email address.');
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to send OTP email. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOTP = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      const res = await forgotPasswordUser(email.trim());
      setResendTimer(60);
      setCanResend(false);
      setApiSuccess(res.message || 'A new 6-digit OTP has been sent to your email address.');
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to resend OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim() || !/^\d{6}$/.test(otp.trim())) {
      setApiError('Please enter the 6-digit numeric OTP.');
      return;
    }

    setIsLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      const res = await verifyOTPUser(email.trim(), otp.trim());
      setStep(3);
      setApiSuccess(res.message || 'OTP verified successfully.');
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Invalid or expired OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setApiError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setApiError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }

    setIsLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      const res = await resetPasswordUser(email.trim(), otp.trim(), newPassword);
      setStep(4);
      setApiSuccess(res.message || 'Password reset successfully.');
    } catch (err) {
      setApiError(err.response?.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
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

      <main className="auth-content">
        <motion.div
          className="auth-card"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        >
          <div className="auth-card-header">
            <h1 className="auth-title">Password Recovery</h1>
            <p className="auth-subtitle">
              {step === 1 && 'Enter your registered buyer email to receive a verification OTP.'}
              {step === 2 && `Enter the 6-digit OTP code sent to ${email}.`}
              {step === 3 && 'Choose a strong new password of at least 8 characters.'}
              {step === 4 && 'Your password has been securely reset!'}
            </p>
          </div>

          {apiError && (
            <div className="alert-box alert-error" role="alert" style={{ marginBottom: '16px' }}>
              <AlertCircle size={16} className="alert-icon" />
              <span>{apiError}</span>
            </div>
          )}

          {apiSuccess && step !== 4 && (
            <div className="alert-box alert-success" style={{ marginBottom: '16px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#166534', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
              <span>{apiSuccess}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestOTP} noValidate>
              <div className="form-group">
                <label htmlFor="recovery-email" className="form-label">
                  Business Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="recovery-email"
                    type="email"
                    className={`form-input ${apiError ? 'form-input-error' : ''}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (apiError) setApiError('');
                    }}
                    placeholder="buyer@enterprise.com"
                    autoComplete="email"
                    disabled={isLoading}
                    required
                  />
                </div>
                {apiError && (
                  <p
                    className="form-error-text"
                    style={{
                      color: '#dc2626',
                      fontSize: '0.84rem',
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                    <span>{apiError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-block"
                disabled={isLoading}
                style={{ marginTop: '20px' }}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    <span>Send Verification OTP</span>
                  </>
                )}
              </button>
            </form>
          )}


          {/* STEP 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP} noValidate>
              <div className="form-group">
                <label htmlFor="otp" className="form-label">
                  6-Digit Verification Code
                </label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  className="form-input"
                  style={{ letterSpacing: '4px', fontSize: '1.2rem', textAlign: 'center', fontWeight: 600 }}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    if (apiError) setApiError('');
                  }}
                  placeholder="000000"
                  disabled={isLoading}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResend || isLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: canResend ? 'var(--forest-600, #15803d)' : 'var(--text-secondary, #9ca3af)',
                    cursor: canResend ? 'pointer' : 'not-allowed',
                    fontWeight: 600,
                  }}
                >
                  {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-block"
                disabled={isLoading || otp.length !== 6}
                style={{ marginTop: '20px' }}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Verify Code</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => setStep(1)}
                style={{ marginTop: '10px' }}
              >
                Change Email Address
              </button>
            </form>
          )}

          {/* STEP 3: Enter New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} noValidate>
              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">
                  New Password (min. 8 characters)
                </label>
                <div className="input-password-wrapper">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (apiError) setApiError('');
                    }}
                    placeholder="Enter new password"
                    disabled={isLoading}
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
              </div>

              <div className="form-group" style={{ marginTop: '14px' }}>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirm New Password
                </label>
                <div className="input-password-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (apiError) setApiError('');
                    }}
                    placeholder="Re-enter new password"
                    disabled={isLoading}
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
              </div>

              <button
                type="submit"
                className="btn btn-block"
                disabled={isLoading}
                style={{ marginTop: '22px' }}
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Resetting Password...</span>
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    <span>Save New Password</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success View */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#16a34a' }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Password Reset Complete</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                Your password has been successfully updated. You can now use your new credentials to access your account.
              </p>
              <button
                type="button"
                className="btn btn-block"
                onClick={() => navigate('/login', { replace: true })}
              >
                Proceed to Sign In
              </button>
            </div>
          )}

          {step !== 4 && (
            <div className="auth-footer-text" style={{ marginTop: '24px' }}>
              <Link to="/login" className="auth-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          )}
        </motion.div>
      </main>

      <footer className="footer">
        SIH26132 &bull; Buyer Portal &bull; Role Protection Active
      </footer>
    </div>
  );
}
