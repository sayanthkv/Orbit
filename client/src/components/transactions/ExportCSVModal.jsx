import React, { useState } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import exportApi from '../../api/exportApi';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';

export const ExportCSVModal = ({ isOpen, onClose, accounts = [], categories = [] }) => {
  const [filters, setFilters] = useState({
    accountId: '',
    startDate: '',
    endDate: '',
    type: '',
    categoryId: '',
  });

  const handleDownload = () => {
    const url = exportApi.getExportUrl(filters);
    window.open(url, '_blank');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Transactions"
      description="Download your financial transactions into a sanitized, Excel-ready CSV spreadsheet."
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        {/* Account Selector */}
        <Select
          label="Account"
          value={filters.accountId}
          onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
          options={[
            { value: '', label: 'All Accounts (Combined)' },
            ...accounts.map((a) => ({
              value: a._id,
              label: `${a.bankName || a.name}${a.accountNumber ? ` (•••• ${a.accountNumber})` : ''}`,
            })),
          ]}
        />

        {/* Type Selector */}
        <Select
          label="Transaction Type"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          options={[
            { value: '', label: 'All Types (Expenses, Income & Transfers)' },
            { value: 'expense', label: 'Expenses Only' },
            { value: 'income', label: 'Income Only' },
            { value: 'transfer', label: 'Transfers Only' },
          ]}
        />

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="From Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          />
          <Input
            label="To Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>

        {/* Security / Injection note */}
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          🔒 Formulas and executable prefixes are automatically sanitized to prevent CSV injection vulnerabilities.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-white/8">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleDownload}
          >
            Download CSV
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ExportCSVModal;
