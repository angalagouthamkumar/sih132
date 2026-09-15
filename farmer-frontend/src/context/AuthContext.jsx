import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children, expectedRole = 'farmer' }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('authUser'));
      return cached?.role === expectedRole ? cached : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session and verify role on initial load
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        const profile = response.data?.user || response.data;

        // Strict role locking: Disallow users from different portals
        if (profile.role !== expectedRole) {
          console.warn(`[Auth] Role mismatch for ${expectedRole} portal: User is ${profile.role}`);
          localStorage.removeItem('token');
          localStorage.removeItem('authUser');
          if (isMounted) {
            setUser(null);
            setToken(null);
            setError(`Access denied. Account is a ${profile.role}, not a ${expectedRole}.`);
          }
        } else {
          if (isMounted) {
            setUser(profile);
            setToken(storedToken);
            setError(null);
            localStorage.setItem('authUser', JSON.stringify(profile));
          }
        }
      } catch (err) {
        const status = err.response?.status;
        if (status === 401 || status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('authUser');
          if (isMounted) {
            setUser(null);
            setToken(null);
          }
        } else if (isMounted) {
          setError('Unable to verify the session because the server is unavailable. Your local session has been preserved.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [expectedRole]);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await loginUser({ email, password, expectedRole });
      const { user: loggedInUser, token: receivedToken } = response.data;

      if (loggedInUser.role !== expectedRole) {
        const roleError = `Access denied. This portal is for ${expectedRole} accounts only.`;
        setError(roleError);
        throw new Error(roleError);
      }

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('authUser', JSON.stringify(loggedInUser));
      setToken(receivedToken);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (formData) => {
    setError(null);
    try {
      const response = await registerUser({ ...formData, role: expectedRole });
      const { user: registeredUser, token: receivedToken } = response.data;

      localStorage.setItem('token', receivedToken);
      localStorage.setItem('authUser', JSON.stringify(registeredUser));
      setToken(receivedToken);
      setUser(registeredUser);
      return registeredUser;
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
    setToken(null);
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    updateUserState: (updatedUser) => setUser((prev) => {
      const nextUser = { ...prev, ...updatedUser };
      localStorage.setItem('authUser', JSON.stringify(nextUser));
      return nextUser;
    }),
    isAuthenticated: !!user && !!token && user.role === expectedRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
