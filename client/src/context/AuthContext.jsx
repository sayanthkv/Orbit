import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const saveAccountProfile = (userData) => {
    if (userData?.email) {
      try {
        localStorage.setItem(
          'orbit_saved_account',
          JSON.stringify({
            name: userData.name || '',
            email: userData.email || '',
            currency: userData.currency || 'INR',
            lastLogin: new Date().toISOString(),
          })
        );
      } catch (e) {}
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('orbit_token');
    // If no token stored and no session, user is simply not logged in yet - avoid spamming 401s
    if (!token && !document.cookie.includes('token')) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await authApi.getMe();
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        saveAccountProfile(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // Try refresh token if access token expired
      try {
        const storedRefreshToken = localStorage.getItem('orbit_refresh_token');
        if (storedRefreshToken) {
          const refRes = await authApi.refreshToken({ refreshToken: storedRefreshToken });
          if (refRes?.success && refRes.data?.token) {
            localStorage.setItem('orbit_token', refRes.data.token);
            if (refRes.data.refreshToken) {
              localStorage.setItem('orbit_refresh_token', refRes.data.refreshToken);
            }
            const meRes = await authApi.getMe();
            if (meRes.success && meRes.data?.user) {
              setUser(meRes.data.user);
              saveAccountProfile(meRes.data.user);
              return;
            }
          }
        }
      } catch {}
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await authApi.login(credentials);
      if (res.success && res.data?.user) {
        if (res.data.token) {
          localStorage.setItem('orbit_token', res.data.token);
        }
        if (res.data.refreshToken) {
          localStorage.setItem('orbit_refresh_token', res.data.refreshToken);
        }
        setUser(res.data.user);
        saveAccountProfile(res.data.user);
        toast.success(res.message || 'Logged in successfully!');
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
      return { success: false, message: err.message };
    }
  };

  const attemptOneClickLogin = async () => {
    try {
      setLoading(true);
      const storedToken = localStorage.getItem('orbit_token');
      const storedRefreshToken = localStorage.getItem('orbit_refresh_token');

      // Attempt session restoration via token
      let res;
      if (storedToken) {
        try {
          res = await authApi.getMe();
        } catch {}
      }

      if (!res?.success && storedRefreshToken) {
        try {
          const refRes = await authApi.refreshToken({ refreshToken: storedRefreshToken });
          if (refRes?.success && refRes.data?.token) {
            localStorage.setItem('orbit_token', refRes.data.token);
            if (refRes.data.refreshToken) {
              localStorage.setItem('orbit_refresh_token', refRes.data.refreshToken);
            }
            res = await authApi.getMe();
          }
        } catch {}
      }

      if (res?.success && res?.data?.user) {
        setUser(res.data.user);
        saveAccountProfile(res.data.user);
        toast.success(`Welcome back, ${res.data.user.name || 'there'}!`);
        return { success: true };
      }
      return { success: false, requiresPassword: true };
    } catch {
      return { success: false, requiresPassword: true };
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async () => {
    try {
      setLoading(true);
      const res = await authApi.demoLogin();
      if (res.success && res.data?.user) {
        if (res.data.token) {
          localStorage.setItem('orbit_token', res.data.token);
        }
        setUser(res.data.user);
        toast.success('Welcome to Orbit Demo Mode! Explore preloaded data.');
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      toast.error('Failed to launch demo mode.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const res = await authApi.register(userData);
      if (res.success && res.data?.user) {
        if (res.data.token) {
          localStorage.setItem('orbit_token', res.data.token);
        }
        if (res.data.refreshToken) {
          localStorage.setItem('orbit_refresh_token', res.data.refreshToken);
        }
        setUser(res.data.user);
        saveAccountProfile(res.data.user);
        toast.success(res.message || 'Account created successfully!');
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toast.error(err.message || 'Registration failed.');
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {}
    localStorage.removeItem('orbit_token');
    localStorage.removeItem('orbit_refresh_token');
    setUser(null);
    toast.info('You have been logged out.');
  };

  const updatePreferences = async (preferences) => {
    try {
      const res = await authApi.updatePreferences(preferences);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        toast.success('Preferences saved!');
        return { success: true };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update preferences.');
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        attemptOneClickLogin,
        loginAsDemo,
        register,
        logout,
        updatePreferences,
        refreshUser: checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
