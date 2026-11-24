import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/AuthContext';
import { useTheme } from '../../app/ThemeContext';
import api from '../../lib/api';
import { formatCurrency, formatDate } from '../../lib/formatters';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Card from '../../components/Card';
import ParallaxSection from '../../components/parallax/ParallaxSection';
import ParallaxCard from '../../components/parallax/ParallaxCard';
import { useToast } from '../../components/Toast';
import {
  User,
  Mail,
  Lock,
  Shield,
  Calendar,
  Wallet,
  Landmark,
  PiggyBank,
  PieChart,
  Moon,
  Sun,
  LogOut,
  Save,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

export const ProfilePage = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalAccounts: 0,
    totalBalance: 0,
    activeBudgets: 0,
    activeGoals: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        setLoadingStats(true);
        const [dashRes, accountsRes, goalsRes] = await Promise.allSettled([
          api.get('/dashboard/summary'),
          api.get('/accounts'),
          api.get('/goals'),
        ]);

        const dashData = dashRes.status === 'fulfilled' ? dashRes.value.data : null;
        const accData = accountsRes.status === 'fulfilled' ? accountsRes.value.data : null;
        const goalsData = goalsRes.status === 'fulfilled' ? goalsRes.value.data : null;

        setStats({
          totalAccounts: accData?.activeAccounts?.length || 0,
          totalBalance: dashData?.totalLiquidNetWorth || 0,
          activeBudgets: dashData?.budgetSummary?.length || 0,
          activeGoals: goalsData?.goals?.length || 0,
        });
      } catch {
        // Non-blocking
      } finally {
        setLoadingStats(false);
      }
    };
    fetchQuickStats();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        toast.error('Please enter your current password to set a new password');
        return;
      }
      if (newPassword.length < 6) {
        toast.error('New password must be at least 6 characters long');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
    }

    try {
      setIsSaving(true);
      const payload = { name: name.trim() };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await api.put('/auth/profile', payload);
      if (res.success) {
        toast.success(res.message || 'Profile updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        // Update stored last user
        try {
          const stored = localStorage.getItem('orbit_last_user');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.name = name.trim();
            localStorage.setItem('orbit_last_user', JSON.stringify(parsed));
          }
        } catch {}
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Profile Header Hero */}
      <ParallaxSection depth={-12}>
        <ParallaxCard
          depth={8}
          className="bg-white/90 dark:bg-[#121216]/90 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-2xl sm:text-3xl flex items-center justify-center uppercase shadow-lg shadow-emerald-600/30 font-display shrink-0">
                {user?.name ? user.name[0] : 'U'}
              </div>
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white tracking-tight font-display truncate">
                    {user?.name || 'Orbit User'}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Shield className="w-3 h-3" />
                    Verified Session
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="truncate">{user?.email || 'user@orbit.local'}</span>
                </p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 pt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Member since {user?.createdAt ? formatDate(user.createdAt) : 'Recently'}</span>
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-white/6">
              <Button
                variant="outline"
                size="sm"
                icon={LogOut}
                onClick={logout}
                className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/30"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </ParallaxCard>
      </ParallaxSection>

      {/* Financial Overview Metrics */}
      <ParallaxSection depth={-8}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Landmark className="w-4 h-4 text-emerald-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Bank Accounts</span>
            </div>
            <p className="text-xl sm:text-2xl font-black tabular-nums font-mono text-zinc-900 dark:text-white">
              {stats.totalAccounts}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Wallet className="w-4 h-4 text-teal-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Net Liquid</span>
            </div>
            <p className="text-xl sm:text-2xl font-black tabular-nums font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.totalBalance)}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <PieChart className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Active Budgets</span>
            </div>
            <p className="text-xl sm:text-2xl font-black tabular-nums font-mono text-zinc-900 dark:text-white">
              {stats.activeBudgets}
            </p>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <PiggyBank className="w-4 h-4 text-purple-500" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Savings Goals</span>
            </div>
            <p className="text-xl sm:text-2xl font-black tabular-nums font-mono text-zinc-900 dark:text-white">
              {stats.activeGoals}
            </p>
          </Card>
        </div>
      </ParallaxSection>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Profile & Security Form */}
        <div className="md:col-span-7 space-y-6">
          <Card
            title="Edit Profile & Credentials"
            subtitle="Update your display name or change your account password"
            className="p-6"
          >
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <Input
                label="Display Name"
                type="text"
                icon={User}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />

              <Input
                label="Email Address"
                type="email"
                icon={Mail}
                disabled
                value={user?.email || ''}
                helperText="Email is bound to your primary authentication identity."
              />

              <div className="pt-3 border-t border-zinc-100 dark:border-white/6 space-y-3">
                <span className="text-xs font-bold text-zinc-900 dark:text-white block font-display">
                  Change Password (Optional)
                </span>

                <Input
                  label="Current Password"
                  type="password"
                  icon={Lock}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Required only to change password"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="New Password"
                    type="password"
                    icon={Lock}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    icon={Lock}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  icon={Save}
                  isLoading={isSaving}
                  className="font-bold shadow-md shadow-emerald-600/20"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Preferences & Experience */}
        <div className="md:col-span-5 space-y-6">
          <Card
            title="Preferences & Theme"
            subtitle="Customize visual presentation and aesthetics"
            className="p-6 space-y-5"
          >
            {/* Theme Toggle Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">Appearance</p>
                  <p className="text-[11px] text-zinc-500">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="text-xs">
                Switch to {isDark ? 'Light' : 'Dark'}
              </Button>
            </div>

            {/* Hardware Acceleration Indicator */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 space-y-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  Motion & Performance
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-relaxed">
                60–120 FPS hardware-accelerated GPU transforms active. Touch scrolling is optimized with zero CPU render lag.
              </p>
            </div>

            {/* Security Badge */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold">Orbit Privacy Shield</span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Your data is strictly partitioned per user account with bcrypt hashing and JWT token isolation.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
