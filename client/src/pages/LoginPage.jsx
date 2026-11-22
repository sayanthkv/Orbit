import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, ShieldCheck, UserCheck, X } from 'lucide-react';
import Logo from '../components/common/Logo';
import Input from '../components/common/Input';

export const LoginPage = () => {
  const [savedAccount, setSavedAccount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('orbit_saved_account') || 'null');
    } catch {
      return null;
    }
  });

  const [useOtherAccount, setUseOtherAccount] = useState(false);
  const [formData, setFormData] = useState({
    email: savedAccount?.email || '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isOneClickLoading, setIsOneClickLoading] = useState(false);

  const { login, attemptOneClickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const validate = () => {
    const errs = {};
    if (!formData.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email';
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
    if (result.success) navigate(from, { replace: true });
  };

  const handleOneClickLogin = async () => {
    setIsOneClickLoading(true);
    const result = await attemptOneClickLogin();
    setIsOneClickLoading(false);
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      // Session needs password entry, prefill email and focus password
      setFormData((prev) => ({ ...prev, email: savedAccount.email }));
      const pwdEl = document.getElementById('login-password-input');
      if (pwdEl) pwdEl.focus();
    }
  };

  const handleForgetAccount = (e) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('orbit_saved_account');
    } catch {}
    setSavedAccount(null);
    setUseOtherAccount(true);
    setFormData({ email: '', password: '' });
  };

  const showSavedQuickLogin = savedAccount && !useOtherAccount;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#09090b' }}
    >
      {/* Radial spotlight at top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.08) 0%, transparent 65%)',
        }}
      />
      {/* Faint grid */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Card */}
        <div
          className="rounded-3xl p-7 sm:p-8 space-y-6"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex flex-col items-center text-center space-y-3">
            <Logo size="lg" showTagline={false} />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                {showSavedQuickLogin ? 'Welcome back' : 'Sign in to Orbit'}
              </h1>
              <p className="text-xs text-zinc-400 mt-1.5">
                {showSavedQuickLogin ? 'Quickly resume where you left off' : 'Enter your credentials to continue'}
              </p>
            </div>
          </div>

          {/* 1-Click Login Suggestion Card (if previously logged in) */}
          {showSavedQuickLogin && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-zinc-950 font-black text-base flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                    {savedAccount.name ? savedAccount.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{savedAccount.name || 'Account User'}</p>
                    <p className="text-xs text-zinc-400 truncate">{savedAccount.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleForgetAccount}
                  title="Remove saved account"
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* One-Click Continue Button */}
              <button
                type="button"
                onClick={handleOneClickLogin}
                disabled={isOneClickLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/25 text-white"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                }}
              >
                {isOneClickLoading ? (
                  <span className="animate-pulse">Resuming session...</span>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Continue as {savedAccount.name?.split(' ')[0] || 'User'}</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </>
                )}
              </button>

              <div className="relative my-1 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10" />
                </div>
                <span className="relative px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-[#121216]">
                  or enter password
                </span>
              </div>
            </div>
          )}

          {/* Standard Form (Or password entry for saved account) */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {(!showSavedQuickLogin || useOtherAccount) && (
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
            )}

            <Input
              id="login-password-input"
              label={showSavedQuickLogin ? `Password for ${savedAccount.email}` : 'Password'}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              icon={Lock}
              required
              value={formData.password}
              error={errors.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-1"
              style={{
                background: showSavedQuickLogin
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                border: showSavedQuickLogin ? '1px solid rgba(255,255,255,0.15)' : 'none',
                boxShadow: showSavedQuickLogin ? 'none' : '0 8px 24px rgba(16,185,129,0.3)',
                color: '#fff',
              }}
            >
              {isLoading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>Sign In With Password <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Switch Account toggle if saved account exists */}
          {savedAccount && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setUseOtherAccount(!useOtherAccount)}
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer underline underline-offset-4"
              >
                {useOtherAccount ? '← Back to one-click sign in' : 'Sign in with a different email'}
              </button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/80" />
            <span>Secure 256-bit encrypted authentication</span>
          </div>

          <div
            className="text-center pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs text-zinc-400">
              New to Orbit?{' '}
              <Link to="/register" className="font-bold text-white hover:text-emerald-400 transition-colors underline underline-offset-4">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
