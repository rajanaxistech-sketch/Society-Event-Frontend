import React from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  width?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyText?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  isLoading = false,
  emptyText = 'No data available',
  sortBy,
  sortOrder,
  onSort,
  onRowClick,
  className = '',
}: TableProps<T>) {
  return (
    <div className={clsx('w-full overflow-x-auto border border-[#E2E8F0] rounded-xl bg-white shadow-card no-scrollbar', className)}>
      <table className="w-full min-w-[600px] text-left border-collapse text-xs">
        <thead>
          <tr className="bg-[#F8F7FC] border-b border-[#E2E8F0] text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {columns.map((col) => {
              const isSorted = sortBy === col.key;
              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={clsx(
                    'px-3 py-2 sm:py-2.5 select-none font-bold',
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                    col.sortable && 'cursor-pointer hover:bg-[#EEF2FF]/80 transition-colors',
                    col.className
                  )}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div
                    className={clsx(
                      'inline-flex items-center gap-1.5',
                      col.align === 'center' && 'justify-center',
                      col.align === 'right' && 'justify-end'
                    )}
                  >
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#6366F1]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#6366F1]" />
                          )
                        ) : (
                          <span className="opacity-40 text-[10px]">↕</span>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]/70 text-[#1E293B]">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className="px-3 py-2">
                    <Skeleton className="h-3.5 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-slate-400 text-xs">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={clsx(
                  'transition-colors duration-150 hover:bg-[#EEF2FF]/60',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-3 py-1.5 sm:py-2 whitespace-nowrap text-xs text-slate-700',
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                      col.className
                    )}
                  >
                    {col.render ? col.render(row, idx) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;

