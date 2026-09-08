import React from 'react';
import { Search, X } from 'lucide-react';
import clsx from 'clsx';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={clsx('relative flex items-center', className)}>
      <div className="absolute left-2.5 text-slate-400 pointer-events-none flex items-center justify-center">
        <Search className="w-3.5 h-3.5" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#6366F1] transition-all placeholder:text-slate-400 shadow-2xs hover:border-slate-400 text-[#1E293B] h-8 sm:h-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-[#EEF2FF] transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default SearchInput;

