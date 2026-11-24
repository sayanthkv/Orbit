import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';
import { useToast } from '../components/Toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem(
          'orbit_last_user',
          JSON.stringify({ name: res.data.user.name, email: res.data.user.email })
        );
        return { success: true, user: res.data.user };
      } else {
        setUser(null);
        return { success: false };
      }
    } catch {
      setUser(null);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await api.post('/auth/login', credentials);
      if (res.success && res.data?.user) {
        if (res.data.token) {
          localStorage.setItem('orbit_token', res.data.token);
        }
        localStorage.setItem(
          'orbit_last_user',
          JSON.stringify({ name: res.data.user.name, email: res.data.user.email })
        );
        setUser(res.data.user);
        toast.success(res.message || 'Logged in successfully!');
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toast.error(err.message || 'Invalid email or password');
      return { success: false, message: err.message };
    }
  };

  const quickLogin = async (email) => {
    try {
      const res = await api.post('/auth/quick-login', { email });
      if (res.success && res.data?.user) {
        if (res.data.token) {
          localStorage.setItem('orbit_token', res.data.token);
        }
        localStorage.setItem(
          'orbit_last_user',
          JSON.stringify({ name: res.data.user.name, email: res.data.user.email })
        );
        setUser(res.data.user);
        toast.success(res.message || `Welcome back, ${res.data.user.name}!`);
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toast.error(err.message || 'Quick sign in failed');
      return { success: false, message: err.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      if (res.success && res.data?.user) {
        if (res.data.token) {
          localStorage.setItem('orbit_token', res.data.token);
        }
        localStorage.setItem(
          'orbit_last_user',
          JSON.stringify({ name: res.data.user.name, email: res.data.user.email })
        );
        setUser(res.data.user);
        toast.success(res.message || 'Account created successfully!');
        return { success: true };
      }
      return { success: false, message: res.message };
    } catch (err) {
      toast.error(err.message || 'Registration failed');
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('orbit_token');

    // Clear runtime API caches so a shared device never shows previous user data
    if (typeof window !== 'undefined' && 'caches' in window) {
      try {
        const cacheKeys = await window.caches.keys();
        await Promise.all(
          cacheKeys
            .filter((key) => key.includes('orbit') || key.includes('api'))
            .map((key) => window.caches.delete(key))
        );
      } catch (err) {
        console.warn('Cache clearing on logout:', err);
      }
    }

    setUser(null);
    toast.info('You have been logged out.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        quickLogin,
        register,
        logout,
        checkAuth,
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
