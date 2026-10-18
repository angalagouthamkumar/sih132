import React, { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, RefreshCw, LogIn } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, loginWithGoogle, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, navigate to dashboard immediately
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      await login(formData.email.trim(), formData.password);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setApiError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setApiError('No credential received from Google.');
      return;
    }
    setIsSubmitting(true);
    setApiError('');
    try {
      await loginWithGoogle(credentialResponse.credential);
      const destination = location.state?.from?.pathname || '/dashboard';
      navigate(destination, { replace: true });
    } catch (err) {
      setApiError(err.message || 'Google sign-in was unsuccessful. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleError = () => {
    setApiError('Google sign-in was unsuccessful. Please try again.');
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
            <h1 className="auth-title">Farmer Login</h1>
            <p className="auth-subtitle">
              Sign in with your farmer credentials or Google to access your portal.
            </p>
          </div>

          {apiError && (
            <div className="alert-box alert-error" role="alert">
              <AlertCircle size={16} className="alert-icon" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                value={formData.email}
                onChange={handleChange}
                placeholder="ravi@example.com"
                autoComplete="email"
                disabled={isSubmitting}
                required
              />
              {errors.email && <p className="form-error-text">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-input ${errors.password ? 'form-input-error' : ''}`}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
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
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.82rem' }}>
                  Forgot Password?
                </Link>
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>

            <div
              className="auth-footer-text"
              style={{
                marginTop: '16px',
                paddingTop: 0,
                borderTop: 'none',
                textAlign: 'center',
                fontSize: '0.88rem',
              }}
            >
              <span>Don't have an account yet? </span>
              <Link to="/signup" className="auth-link">
                Register as Farmer
              </Link>
            </div>
          </form>

          <div className="auth-divider" style={{ display: 'flex', alignItems: 'center', margin: '22px 0 18px', color: 'var(--text-secondary, #6b7280)' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border, #e5e7eb)' }} />
            <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.74rem', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border, #e5e7eb)' }} />
          </div>

          <div className="google-auth-container" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
              shape="rectangular"
            />
          </div>

        </motion.div>
      </main>

      <footer className="footer">
        SIH26132 &bull; Farmer Portal &bull; Role Protection Active
      </footer>
    </div>
  );
}
