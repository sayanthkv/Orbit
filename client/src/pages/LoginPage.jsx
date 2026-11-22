import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '../components/common/Logo';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

export const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginAsDemo } = useAuth();
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#09090b' }}
    >
      {/* Radial spotlight at top */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.12) 0%, transparent 65%)',
        }}
      />
      {/* Faint grid */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
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
              <h1 className="text-2xl font-black tracking-tight text-white">Welcome back</h1>
              <p className="text-xs text-zinc-500 mt-1.5">Sign in to manage your finances</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-1"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
                color: '#fff',
              }}
            >
              {isLoading ? (
                <span className="animate-pulse">Signing in...</span>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="relative my-2 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative px-3 text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-[#141418]">
                or
              </span>
            </div>

            <button
              type="button"
              onClick={async () => {
                const res = await loginAsDemo();
                if (res.success) navigate('/');
              }}
              className="w-full py-2.5 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Explore Live Demo Mode (1-Click)</span>
            </button>
          </form>

          <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-700">
            <ShieldCheck className="w-3.5 h-3.5 text-zinc-600" />
            <span>Secure 256-bit encrypted login</span>
          </div>

          <div
            className="text-center pt-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-xs text-zinc-600">
              New to Orbit?{' '}
              <Link to="/register" className="font-bold text-zinc-200 hover:text-white transition-colors underline underline-offset-4">
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
