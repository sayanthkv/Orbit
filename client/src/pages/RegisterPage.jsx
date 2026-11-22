import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '../components/common/Logo';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import Button from '../components/common/Button';

const CURRENCIES = [
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'AED', label: 'AED (AED) - UAE Dirham' },
  { value: 'SGD', label: 'SGD (S$) - Singapore Dollar' },
  { value: 'CAD', label: 'CAD (C$) - Canadian Dollar' },
  { value: 'AUD', label: 'AUD (A$) - Australian Dollar' },
];

export const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', currency: 'INR' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const { register, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'At least 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    const result = await register(formData);
    setIsLoading(false);
    if (result.success) navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#09090b' }}
    >
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(16,185,129,0.1) 0%, transparent 65%)',
        }}
      />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-sm relative z-10 py-8">
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
              <h1 className="text-2xl font-black tracking-tight text-white">Create account</h1>
              <p className="text-xs text-zinc-500 mt-1.5">Start your financial journey with Orbit</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input label="Full Name" type="text" autoComplete="name" placeholder="e.g. Maya Patel" icon={User} required
              value={formData.name} error={errors.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Input label="Email" type="email" autoComplete="email" placeholder="you@domain.com" icon={Mail} required
              value={formData.email} error={errors.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input label="Password" type="password" autoComplete="new-password" placeholder="At least 6 characters" icon={Lock} required
              value={formData.password} error={errors.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Select label="Base Currency" options={CURRENCIES} value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
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
                <span className="animate-pulse">Creating account...</span>
              ) : (
                <>Get Started Free <ArrowRight className="w-4 h-4" /></>
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
            <span>Private, personal & fully controlled by you</span>
          </div>

          <div className="text-center pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs text-zinc-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-zinc-200 hover:text-white transition-colors underline underline-offset-4">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
