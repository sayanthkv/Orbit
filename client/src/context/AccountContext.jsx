import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import accountApi from '../api/accountApi';
import { useAuth } from './AuthContext';

const AccountContext = createContext();

export const AccountProvider = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [combinedSummary, setCombinedSummary] = useState({
    totalNetWorth: 0,
    totalInitialBalance: 0,
    totalAllTimeIncome: 0,
    totalAllTimeExpense: 0,
    monthIncome: 0,
    monthExpense: 0,
    accountsCount: 0,
  });

  // Dedicated Active Dashboard Account (strictly ONE account, never 'all')
  const [activeDashboardAccountId, setActiveDashboardAccountId] = useState(() => {
    return localStorage.getItem('orbit_active_dashboard_account_id') || '';
  });

  // Account selected in accounts manager
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    return localStorage.getItem('orbit_selected_account_id') || '';
  });

  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const fetchAccounts = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      return;
    }
    try {
      setLoadingAccounts(true);
      const res = await accountApi.getAccounts();
      if (res && res.success && res.data) {
        const accs = res.data.accounts || [];
        setAccounts(accs);
        if (res.data.combinedSummary) {
          setCombinedSummary(res.data.combinedSummary);
        }
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Resolve active dashboard account (strictly one account, defaults to primary/first)
  const resolvedDashboardId =
    activeDashboardAccountId && accounts.some((a) => a._id === activeDashboardAccountId)
      ? activeDashboardAccountId
      : accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || '';

  const activeDashboardAccount =
    accounts.find((a) => a._id === resolvedDashboardId) || accounts[0] || null;

  const selectDashboardAccount = (id) => {
    setActiveDashboardAccountId(id);
    localStorage.setItem('orbit_active_dashboard_account_id', id);
  };

  const selectAccount = (id) => {
    setSelectedAccountId(id);
    localStorage.setItem('orbit_selected_account_id', id);
  };

  const selectedAccount =
    selectedAccountId && selectedAccountId !== 'all'
      ? accounts.find((acc) => acc._id === selectedAccountId) || accounts[0] || null
      : accounts[0] || null;

  return (
    <AccountContext.Provider
      value={{
        accounts,
        combinedSummary,
        activeDashboardAccountId: resolvedDashboardId,
        activeDashboardAccount,
        selectDashboardAccount,
        selectedAccountId,
        selectedAccount,
        selectAccount,
        fetchAccounts,
        loadingAccounts,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
};

export const useAccounts = () => {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccounts must be used within an AccountProvider');
  }
  return context;
};

export default AccountContext;
