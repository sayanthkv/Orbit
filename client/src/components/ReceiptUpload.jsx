import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Spinner from './Spinner';

export const ReceiptUpload = ({ value, onChange, disabled = false }) => {
  const [isSupported, setIsSupported] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/uploads/status')
      .then((res) => {
        setIsSupported(Boolean(res.data?.enabled));
      })
      .catch(() => {
        setIsSupported(false);
      });
  }, []);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size < 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5 MB');
      return;
    }

    // Check type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPG, PNG, WEBP, or PDF files allowed');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Make raw axios multipart call
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.success && res.data) {
        onChange({
          url: res.data.url,
          publicId: res.data.publicId,
          fileType: res.data.fileType,
        });
      } else {
        setError(res.message || 'Upload failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to upload receipt');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (value?.publicId) {
      try {
        await api.delete(`/uploads/${value.publicId}`);
      } catch {}
    }
    onChange(null);
  };

  if (!isSupported) {
    return (
      <div className="p-3 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200/60 dark:border-white/6 text-zinc-500 text-[11px] flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-zinc-400 shrink-0" />
        <span>Receipt attachments disabled on server (Cloudinary not configured).</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300">
        Receipt / Bill Attachment (Optional)
      </label>

      {value?.url ? (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2.5 min-w-0">
            {value.fileType === 'pdf' ? (
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <img
                src={value.url}
                alt="Receipt"
                className="w-10 h-10 object-cover rounded-lg border border-emerald-500/30 shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {value.fileType === 'pdf' ? 'PDF Receipt Attached' : 'Image Receipt Attached'}
              </p>
              <a
                href={value.url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-600 dark:text-emerald-400 underline font-medium"
              >
                View Attachment
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-zinc-300 dark:border-white/10 rounded-2xl cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-zinc-50/50 dark:bg-white/2">
          {isUploading ? (
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
              <Spinner size="sm" />
              <span>Uploading to secure storage...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Click to attach receipt (JPG, PNG, PDF up to 5MB)</span>
            </div>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled || isUploading}
          />
        </label>
      )}

      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
};

export default ReceiptUpload;
