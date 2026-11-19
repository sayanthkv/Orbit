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

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your account profile and display preferences.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          Profile Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-400">Full Name</span>
            <p className="font-medium text-slate-800 dark:text-slate-200">{user?.name}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400">Email Address</span>
            <p className="font-medium text-slate-800 dark:text-slate-200">{user?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-600" />
          Currency & Display Preferences
        </h2>

        <div className="space-y-4">
          <Select
            label="Default Currency"
            options={CURRENCIES}
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />

          <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Interface Theme
              </p>
              <p className="text-xs text-slate-400">
                Switch between Light and Dark mode
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-500" /> Light
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-blue-500" /> Dark
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
