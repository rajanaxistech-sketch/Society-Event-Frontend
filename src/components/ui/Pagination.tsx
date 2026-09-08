import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { PaginationMeta } from '../../types';

export interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  meta,
  onPageChange,
  onLimitChange,
  className = '',
}) => {
  const { page, limit, total, totalPages } = meta;

  const startRecord = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div
      className={clsx(
        'flex flex-col sm:flex-row items-center justify-between gap-2 py-1.5 px-1 text-[11px] sm:text-xs text-slate-500',
        className
      )}
    >
      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
        <span className="text-center sm:text-left">
          Showing <span className="font-bold text-slate-900">{startRecord}</span> to{' '}
          <span className="font-bold text-slate-900">{endRecord}</span> of{' '}
          <span className="font-bold text-slate-900">{total}</span> records
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 border-l border-[#E2E8F0] pl-2">
            <span className="text-[11px] text-slate-400 font-medium">Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="px-1.5 py-0.5 text-[11px] border border-[#CBD5E1] rounded-md bg-white text-slate-800 font-bold focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1 rounded-lg border border-[#E2E8F0] text-slate-600 bg-white hover:bg-[#EEF2FF] hover:text-[#6366F1] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          title="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div className="px-2 py-0.5 font-bold text-[11px] text-slate-700 bg-white border border-[#E2E8F0] rounded-lg shadow-2xs">
          Page {page} of {Math.max(totalPages, 1)}
        </div>

        <button
          type="button"
          disabled={page >= totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          className="p-1 rounded-lg border border-[#E2E8F0] text-slate-600 bg-white hover:bg-[#EEF2FF] hover:text-[#6366F1] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
          title="Next Page"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

