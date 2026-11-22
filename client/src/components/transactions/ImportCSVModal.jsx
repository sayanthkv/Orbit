import React, { useState } from 'react';
import Modal from '../common/Modal';
import Select from '../common/Select';
import Button from '../common/Button';
import exportApi from '../../api/exportApi';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Layers,
} from 'lucide-react';

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine).filter((r) => r.length > 1);
  return { headers, rows };
};

export const ImportCSVModal = ({ isOpen, onClose, onSuccess, accounts = [] }) => {
  const toast = useToast();

  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview
  const [file, setFile] = useState(null);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvRows, setCsvRows] = useState([]);

  const [mapping, setMapping] = useState({
    date: '',
    amount: '',
    note: '',
    type: '',
    category: '',
    account: '',
  });

  const [defaultAccountId, setDefaultAccountId] = useState(
    accounts.find((a) => a.isDefault)?._id || accounts[0]?._id || ''
  );

  const [previewData, setPreviewData] = useState(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setStep(1);
    setFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setPreviewData(null);
    setMapping({ date: '', amount: '', note: '', type: '', category: '', account: '' });
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.endsWith('.csv')) {
      toast.error('Only .csv files are supported.');
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds the 5MB limit.');
      return;
    }

    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const { headers, rows } = parseCSV(text);

        if (headers.length === 0 || rows.length === 0) {
          toast.error('CSV file appears empty or unreadable.');
          return;
        }

        setCsvHeaders(headers);
        setCsvRows(rows);

        // Auto-detect mappings
        const detected = { date: '', amount: '', note: '', type: '', category: '', account: '' };
        headers.forEach((h) => {
          const lower = h.toLowerCase().trim();
          if (!detected.date && (lower.includes('date') || lower.includes('time'))) detected.date = h;
          if (!detected.amount && (lower.includes('amount') || lower.includes('cost') || lower.includes('spent') || lower.includes('price'))) detected.amount = h;
          if (!detected.note && (lower.includes('note') || lower.includes('desc') || lower.includes('detail') || lower.includes('memo') || lower.includes('merchant'))) detected.note = h;
          if (!detected.type && lower.includes('type')) detected.type = h;
          if (!detected.category && lower.includes('category')) detected.category = h;
          if (!detected.account && (lower.includes('account') || lower.includes('bank'))) detected.account = h;
        });

        setMapping(detected);
        setStep(2);
      } catch (err) {
        toast.error('Failed to parse CSV file.');
      }
    };
    reader.readAsText(selected);
  };

  const handleGeneratePreview = async () => {
    if (!mapping.date || !mapping.amount) {
      toast.error('Please map at least Date and Amount columns.');
      return;
    }

    try {
      setIsLoading(true);

      const mappedRows = csvRows.map((row) => {
        const rowObj = {};
        csvHeaders.forEach((header, idx) => {
          rowObj[header] = row[idx] || '';
        });

        return {
          date: rowObj[mapping.date],
          amount: rowObj[mapping.amount],
          note: mapping.note ? rowObj[mapping.note] : '',
          type: mapping.type ? rowObj[mapping.type] : 'expense',
          category: mapping.category ? rowObj[mapping.category] : '',
          account: mapping.account ? rowObj[mapping.account] : '',
        };
      });

      const res = await exportApi.previewImport({
        rows: mappedRows,
        defaultAccountId,
      });

      if (res.success) {
        setPreviewData(res.data);
        setStep(3);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to analyze CSV preview.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData || !previewData.rows) return;

    try {
      setIsLoading(true);

      const readyToImport = previewData.rows
        .filter((r) => r.isValid && (!skipDuplicates || !r.isDuplicate))
        .map((r) => r.parsed);

      if (readyToImport.length === 0) {
        toast.error('No transactions to import (all invalid or duplicate).');
        return;
      }

      const res = await exportApi.commitImport({
        transactions: readyToImport,
      });

      if (res.success) {
        toast.success(res.message || 'Transactions imported successfully!');
        resetState();
        onClose();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetState();
        onClose();
      }}
      title="Import Transactions from CSV"
      description="Upload a CSV export from your bank, splitwise, or another finance app with column mapping and duplicate detection."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2 pb-2 border-b border-zinc-100 dark:border-white/5 text-xs font-bold text-zinc-500">
          <span className={step === 1 ? 'text-zinc-950 dark:text-white' : ''}>1. Upload File</span>
          <span>→</span>
          <span className={step === 2 ? 'text-zinc-950 dark:text-white' : ''}>2. Map Columns</span>
          <span>→</span>
          <span className={step === 3 ? 'text-zinc-950 dark:text-white' : ''}>3. Preview & Commit</span>
        </div>

        {/* STEP 1: Upload File */}
        {step === 1 && (
          <div className="py-6">
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-white/15 rounded-3xl p-8 hover:border-zinc-400 dark:hover:border-white/30 transition-all cursor-pointer bg-zinc-50/50 dark:bg-white/[0.02]">
              <Upload className="w-10 h-10 text-zinc-400 mb-2" />
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Click to browse or drop your .csv file here
              </span>
              <span className="text-xs text-zinc-400 mt-1">
                Supports bank statements, credit card CSVs, or Mint/Splitwise exports (up to 5MB)
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}

        {/* STEP 2: Column Mapping */}
        {step === 2 && (
          <div className="space-y-3.5">
            <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-white/5 text-xs text-zinc-600 dark:text-zinc-300 flex items-center justify-between">
              <span>Found <strong>{csvRows.length}</strong> rows in <strong>{file?.name}</strong></span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                Change File
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Date Column *"
                value={mapping.date}
                onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
                options={[
                  { value: '', label: 'Select Date Column' },
                  ...csvHeaders.map((h) => ({ value: h, label: h })),
                ]}
                required
              />

              <Select
                label="Amount Column *"
                value={mapping.amount}
                onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
                options={[
                  { value: '', label: 'Select Amount Column' },
                  ...csvHeaders.map((h) => ({ value: h, label: h })),
                ]}
                required
              />

              <Select
                label="Description / Note Column"
                value={mapping.note}
                onChange={(e) => setMapping({ ...mapping, note: e.target.value })}
                options={[
                  { value: '', label: 'None (Optional)' },
                  ...csvHeaders.map((h) => ({ value: h, label: h })),
                ]}
              />

              <Select
                label="Category Column"
                value={mapping.category}
                onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
                options={[
                  { value: '', label: 'None (Auto-Categorize)' },
                  ...csvHeaders.map((h) => ({ value: h, label: h })),
                ]}
              />

              <Select
                label="Default Bank / Account"
                value={defaultAccountId}
                onChange={(e) => setDefaultAccountId(e.target.value)}
                options={accounts.map((a) => ({
                  value: a._id,
                  label: `${a.bankName || a.name}${a.accountNumber ? ` (•••• ${a.accountNumber})` : ''}`,
                }))}
              />

              <Select
                label="Type Column (Expense / Income)"
                value={mapping.type}
                onChange={(e) => setMapping({ ...mapping, type: e.target.value })}
                options={[
                  { value: '', label: 'Default to Expense' },
                  ...csvHeaders.map((h) => ({ value: h, label: h })),
                ]}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-white/8">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isLoading}
                onClick={handleGeneratePreview}
                icon={ArrowRight}
              >
                Analyze & Preview
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview & Duplicate Detection */}
        {step === 3 && previewData && (
          <div className="space-y-4">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-2xl bg-zinc-100 dark:bg-white/5 text-center">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Total Rows</span>
                <p className="text-lg font-black text-zinc-900 dark:text-white">{previewData.totalRows}</p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Ready</span>
                <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{previewData.validCount}</p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-center">
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Duplicates</span>
                <p className="text-lg font-black text-amber-700 dark:text-amber-300">{previewData.duplicateCount}</p>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-center">
                <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">Errors</span>
                <p className="text-lg font-black text-rose-700 dark:text-rose-300">{previewData.errorCount}</p>
              </div>
            </div>

            {/* Skip duplicates toggle */}
            {previewData.duplicateCount > 0 && (
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 cursor-pointer">
                <input
                  type="checkbox"
                  checked={skipDuplicates}
                  onChange={(e) => setSkipDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 border-zinc-300"
                />
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                  Skip {previewData.duplicateCount} duplicate transaction(s) that match existing records
                </span>
              </label>
            )}

            {/* Preview Table */}
            <div className="border border-zinc-200 dark:border-white/10 rounded-2xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-zinc-100 dark:bg-white/5 font-bold text-zinc-500">
                  <tr>
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Note</th>
                    <th className="p-2.5 text-right">Amount</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
                  {previewData.rows.slice(0, 20).map((r) => (
                    <tr key={r.rowNumber} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02]">
                      <td className="p-2.5 text-zinc-400">{r.rowNumber}</td>
                      <td className="p-2.5 text-zinc-900 dark:text-zinc-100">
                        {r.parsed.date ? formatDate(r.parsed.date) : 'Invalid'}
                      </td>
                      <td className="p-2.5 truncate max-w-[140px] text-zinc-700 dark:text-zinc-300">
                        {r.parsed.note || 'Untitled'}
                      </td>
                      <td className="p-2.5 text-right font-black">
                        {formatCurrency(r.parsed.amount || 0)}
                      </td>
                      <td className="p-2.5">
                        {!r.isValid ? (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                            {r.errors[0] || 'Error'}
                          </span>
                        ) : r.isDuplicate ? (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                            Duplicate
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                            Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-zinc-100 dark:border-white/8">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                Back to Mapping
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isLoading}
                onClick={handleCommitImport}
                icon={CheckCircle2}
              >
                Import {previewData.validCount - (skipDuplicates ? previewData.duplicateCount : 0)} Transactions
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ImportCSVModal;
