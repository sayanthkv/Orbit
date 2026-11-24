import React from 'react';

export const Table = ({
  headers = [],
  children,
  className = '',
  isEmpty = false,
  emptyMessage = 'No records found.',
}) => {
  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-zinc-200/90 dark:border-white/10 ${className}`}>
      <table className="w-full text-left border-collapse text-sm">
        {headers.length > 0 && (
          <thead>
            <tr className="border-b border-zinc-200/80 dark:border-white/8 bg-zinc-50 dark:bg-[#18181e] text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {headers.map((h, idx) => (
                <th key={idx} className="px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-zinc-100 dark:divide-white/6 bg-white dark:bg-[#141418]">
          {isEmpty ? (
            <tr>
              <td
                colSpan={headers.length || 1}
                className="px-4 py-10 text-center text-xs text-zinc-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
