import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from './Toast';

export const MonthlyReportModal = ({ isOpen, onClose }) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getUTCMonth() + 1);
  const [year, setYear] = useState(now.getUTCFullYear());
  const [downloading, setDownloading] = useState({ csv: false, pdf: false });
  const toast = useToast();

  const handleDownload = async (format) => {
    try {
      setDownloading((prev) => ({ ...prev, [format]: true }));
      const token = localStorage.getItem('orbit_token');
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/${format}?month=${month}&year=${year}`;

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!res.ok) throw new Error(`Export failed (${res.status})`);

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Orbit_Statement_${year}_${month}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      toast.success(`Exported ${format.toUpperCase()} statement for ${month}/${year}`);
    } catch (err) {
      toast.error(err.message || 'Export failed');
    } finally {
      setDownloading((prev) => ({ ...prev, [format]: false }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Financial Statement"
      description="Download your monthly summary, bank balances, and transactions"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>
                  {new Date(2026, m - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 font-bold"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            disabled={downloading.pdf}
            onClick={() => handleDownload('pdf')}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 font-bold text-xs transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-400 dark:text-emerald-600" />
              <div className="text-left">
                <p className="font-bold">Branded PDF Statement</p>
                <p className="text-[10px] opacity-75 font-normal">
                  Summary box, liquidity breakdown, budgets, and transactions
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 shrink-0" />
          </button>

          <button
            type="button"
            disabled={downloading.csv}
            onClick={() => handleDownload('csv')}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 font-bold text-xs text-zinc-800 dark:text-zinc-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <div className="text-left">
                <p className="font-bold">Spreadsheet (CSV)</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                  Raw data format for Excel or Google Sheets
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 shrink-0 text-zinc-400" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default MonthlyReportModal;
