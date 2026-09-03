import React from 'react';
import clsx from 'clsx';
import SearchInput from './SearchInput';

export interface FilterBarProps {
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters,
  actions,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 sm:p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs mb-4',
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1">
        {onSearchChange !== undefined && (
          <div className="w-full sm:w-72 shrink-0">
            <SearchInput
              value={search || ''}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
            />
          </div>
        )}
        {filters && <div className="flex items-center gap-2 flex-wrap flex-1 w-full sm:w-auto">{filters}</div>}
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0 justify-end">{actions}</div>}
    </div>
  );
};

export default FilterBar;
