import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import { Save, User, Moon, Sun, DollarSign } from 'lucide-react';

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

export const SettingsPage = () => {
  const { user, updatePreferences } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await updatePreferences({ currency });
    setIsSaving(false);
  };

  const sectionClass = 'bg-white border border-zinc-200/90 shadow-sm dark:bg-[#111113] dark:border-white/8 rounded-2xl p-6 space-y-5 transition-colors';
  const labelClass = 'text-xs font-semibold text-zinc-500 uppercase tracking-wider';

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">Settings</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Manage your account profile and display preferences.
        </p>
      </div>

      {/* Profile Details */}
      <div className={sectionClass}>
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600 dark:text-zinc-500" />
          Profile Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className={labelClass}>Full Name</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-200 mt-1">{user?.name}</p>
          </div>
          <div>
            <span className={labelClass}>Email Address</span>
            <p className="font-semibold text-zinc-900 dark:text-zinc-200 mt-1">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Currency & Display */}
      <form onSubmit={handleSave} className={sectionClass}>
        <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600 dark:text-zinc-500" />
          Currency & Display Preferences
        </h2>

        <div className="space-y-4">
          <Select
            label="Default Currency"
            options={CURRENCIES}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />

          <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 dark:bg-white/[0.03] dark:border-white/8 transition-colors">
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-200">Interface Theme</p>
              <p className="text-xs text-zinc-500 mt-0.5">Switch between Light and Dark mode</p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-300 bg-white hover:bg-zinc-100 text-xs font-semibold text-zinc-800 shadow-xs dark:border-white/12 dark:bg-[#1c1c20] dark:hover:bg-[#27272a] dark:text-zinc-300 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" /> Light Mode
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-zinc-700" /> Dark Mode
                </>
              )}
            </button>
          </div>
        </div>

        <Button type="submit" size="md" isLoading={isSaving} icon={Save}>
          Save Changes
        </Button>
      </form>
    </div>
  );
};

export default SettingsPage;
