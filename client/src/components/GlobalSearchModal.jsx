import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../lib/api';
import { Search, Tag, ArrowRight, CornerDownLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/formatters';
import { useDebounce } from '../hooks/useDebounce';
import { useNavigate } from 'react-router-dom';

export const GlobalSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [availableTags, setAvailableTags] = useState([]);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 250);
  const navigate = useNavigate();

  // Fetch available tags on mount
  useEffect(() => {
    if (isOpen) {
      api.get('/search/tags')
        .then((res) => {
          if (res.success && res.data?.tags) {
            setAvailableTags(res.data.tags);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Execute search when query or tag changes
  useEffect(() => {
    if (!isOpen) return;
    if (!debouncedQuery && !selectedTag) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams();
    if (debouncedQuery) params.append('q', debouncedQuery);
    if (selectedTag) params.append('tag', selectedTag);
    params.append('limit', '25');

    api.get(`/search?${params.toString()}`)
      .then((res) => {
        if (res.success && res.data?.results) {
          setResults(res.data.results);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [debouncedQuery, selectedTag, isOpen]);

  const handleSelectResult = (item) => {
    onClose();
    if (item.source === 'cash') {
      navigate('/tools/expense-tracker/cash');
    } else {
      navigate('/tools/expense-tracker/expenses');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Transactions & Tags"
      description="Quickly find records across notes, categories, tags, or amounts"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search note, category, or amount... (e.g. dinner, 450, coffee)"
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-100 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
          />
        </div>

        {/* Tag filter chips */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mr-1">
              Tags:
            </span>
            {availableTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(active ? '' : tag)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-white/10'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>#{tag}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Results List */}
        <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar pt-2">
          {isLoading ? (
            <p className="text-center text-xs text-zinc-500 py-6">Searching records...</p>
          ) : results.length > 0 ? (
            results.map((r) => (
              <div
                key={`${r.source}-${r._id}`}
                onClick={() => handleSelectResult(r)}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-white/3 hover:bg-zinc-100 dark:hover:bg-white/8 border border-zinc-200/60 dark:border-white/6 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                      r.type === 'income'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {r.type === 'income' ? '+' : '-'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                      {r.category} {r.note ? `— ${r.note}` : ''}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>{formatDate(r.date, { format: 'short' })}</span>
                      <span>•</span>
                      <span>{r.accountName}</span>
                      {r.tags?.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {r.tags.map((t) => `#${t}`).join(' ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-xs font-black tabular-nums font-mono ${
                      r.type === 'income'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {r.type === 'income' ? '+' : '-'}
                    {formatCurrency(r.amount)}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                </div>
              </div>
            ))
          ) : query || selectedTag ? (
            <p className="text-center text-xs text-zinc-500 py-6">
              No matching records found.
            </p>
          ) : (
            <div className="text-center text-xs text-zinc-400 py-8 space-y-1">
              <p className="font-semibold text-zinc-600 dark:text-zinc-300">Quick Command Palette</p>
              <p>Type keywords or select a tag above to search instantly.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default GlobalSearchModal;
