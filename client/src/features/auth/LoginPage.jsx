import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/AuthContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';
import OrbitLoader from '../../components/OrbitLoader';
import ParallaxBackground from '../../components/parallax/ParallaxBackground';
import ParallaxCard from '../../components/parallax/ParallaxCard';
import { Mail, Lock, ArrowRight, X, ShieldCheck, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUser, setLastUser] = useState(null);

  const { login, quickLogin, checkAuth, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // Read saved user and check if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
      return;
    }

    try {
      const stored = localStorage.getItem('orbit_last_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.email) {
          setLastUser(parsed);
          setFormData((prev) => ({ ...prev, email: parsed.email }));
        }
      }
    } catch {}
  }, [isAuthenticated, navigate, from]);

  // Handle one-click continue without entering password
  const handleOneClickLogin = async () => {
    setIsLoading(true);
    // 1. Check existing active session token
    const res = await checkAuth();
    if (res.success) {
      setIsLoading(false);
      navigate(from, { replace: true });
      return;
    }

    // 2. Auto-resume for remembered user without password
    if (lastUser?.email && quickLogin) {
      const qRes = await quickLogin(lastUser.email);
      setIsLoading(false);
      if (qRes.success) {
        navigate(from, { replace: true });
        return;
      }
    }

    setIsLoading(false);
  };

  const handleRemoveSavedUser = () => {
    localStorage.removeItem('orbit_last_user');
    setLastUser(null);
    setFormData({ email: '', password: '' });
  };

  const validate = () => {
    const errs = {};
    if (!formData.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email address';
    if (!formData.password) errs.password = 'Password is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const result = await login(formData);
    setIsLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  // If initial auth check is in flight with a stored token, show sleek resume loader
  if (loading && localStorage.getItem('orbit_token')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-[#09090b] relative">
        <ParallaxBackground />
        <div className="relative z-10">
          <OrbitLoader size="lg" label="Resuming Orbit session..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-zinc-50 dark:bg-[#09090b] relative overflow-hidden">
      <ParallaxBackground />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm relative z-10"
      >
        <ParallaxCard
          depth={15}
          className="bg-white/90 dark:bg-[#121216]/90 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 rounded-3xl p-7 sm:p-8 shadow-2xl space-y-6"
        >
          {/* Logo & Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-600/30 font-display">
              O
            </div>
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white tracking-tight pt-1 font-display">
              {lastUser ? 'Welcome back' : 'Sign in to Orbit'}
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {lastUser
                ? 'Quickly resume where you left off'
                : 'Your personal life tools suite'}
            </p>
          </div>

          {/* One-Click Resume Card (When Saved User Exists) - NO PASSWORD SECTION */}
          {lastUser ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-100/80 dark:bg-white/5 border border-zinc-200/80 dark:border-white/8">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 uppercase text-sm font-display">
                    {lastUser.name ? lastUser.name[0] : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {lastUser.name}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {lastUser.email}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveSavedUser}
                  title="Sign in with different account"
                  className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white rounded-lg hover:bg-zinc-200/50 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-md shadow-emerald-600/20"
                isLoading={isLoading}
                icon={ArrowRight}
                iconPosition="right"
                onClick={handleOneClickLogin}
              >
                Continue as {lastUser.name ? lastUser.name.split(' ')[0] : 'User'}
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleRemoveSavedUser}
                  className="text-xs text-zinc-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Sign in with a different email
                </button>
              </div>
            </div>
          ) : (
            /* Standard Login Form (For new accounts or different email) */
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@domain.com"
                icon={Mail}
                required
                value={formData.email}
                error={errors.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                icon={Lock}
                required
                value={formData.password}
                error={errors.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2 shadow-md shadow-emerald-600/20"
                isLoading={isLoading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Sign In
              </Button>
            </form>
          )}

          {/* Security badge & Register link */}
          <div className="pt-2 text-center space-y-3">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Secure 256-bit encrypted authentication</span>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              New to Orbit?{' '}
              <Link
                to="/register"
                className="font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/30"
              >
                Create account
              </Link>
            </p>
          </div>
        </ParallaxCard>
      </motion.div>
    </div>
  );
};

export default LoginPage;
