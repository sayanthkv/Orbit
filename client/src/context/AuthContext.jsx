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
      // Attempt session restoration via token/refresh
      let res;
      try {
        res = await authApi.getMe();
      } catch {
        // try refresh
        const refRes = await authApi.refreshToken();
        if (refRes.success) {
          res = await authApi.getMe();
        }
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
      setUser(null);
      toast.info('You have been logged out.');
    } catch (err) {
      setUser(null);
    }
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
