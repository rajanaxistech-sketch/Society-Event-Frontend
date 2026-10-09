import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface ThemedSelectOption {
  value: string;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  badge?: string;
}

export interface ThemedSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: ThemedSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  variant?: 'indigo' | 'rose' | 'emerald' | 'blue' | 'slate';
  size?: 'sm' | 'md';
  align?: 'left' | 'right';
  menuWidth?: string;
  className?: string;
  id?: string;
}

export const ThemedSelect: React.FC<ThemedSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  searchable = true,
  clearable = false,
  error,
  helperText,
  required = false,
  disabled = false,
  variant = 'indigo',
  size = 'md',
  align = 'left',
  menuWidth,
  className = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, searchable]);

  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      opt.label.toLowerCase().includes(q) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
      (opt.badge && opt.badge.toLowerCase().includes(q))
    );
  });

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Theme color maps
  const themeStyles = {
    indigo: {
      openBorder: 'border-indigo-500 ring-2 ring-indigo-500/15',
      chevronOpen: 'text-indigo-600',
      selectedItem: 'bg-indigo-50/90 text-indigo-950 font-bold',
      selectedText: 'text-indigo-950 font-bold',
      selectedSubText: 'text-indigo-700/80',
      checkIcon: 'text-indigo-600',
      searchFocus: 'focus:ring-indigo-500 focus:border-indigo-500',
    },
    rose: {
      openBorder: 'border-rose-500 ring-2 ring-rose-500/15',
      chevronOpen: 'text-rose-600',
      selectedItem: 'bg-rose-50/90 text-rose-950 font-bold',
      selectedText: 'text-rose-950 font-bold',
      selectedSubText: 'text-rose-700/80',
      checkIcon: 'text-rose-600',
      searchFocus: 'focus:ring-rose-500 focus:border-rose-500',
    },
    emerald: {
      openBorder: 'border-emerald-500 ring-2 ring-emerald-500/15',
      chevronOpen: 'text-emerald-600',
      selectedItem: 'bg-emerald-50/90 text-emerald-950 font-bold',
      selectedText: 'text-emerald-950 font-bold',
      selectedSubText: 'text-emerald-700/80',
      checkIcon: 'text-emerald-600',
      searchFocus: 'focus:ring-emerald-500 focus:border-emerald-500',
    },
    blue: {
      openBorder: 'border-blue-500 ring-2 ring-blue-500/15',
      chevronOpen: 'text-blue-600',
      selectedItem: 'bg-blue-50/90 text-blue-950 font-bold',
      selectedText: 'text-blue-950 font-bold',
      selectedSubText: 'text-blue-700/80',
      checkIcon: 'text-blue-600',
      searchFocus: 'focus:ring-blue-500 focus:border-blue-500',
    },
    slate: {
      openBorder: 'border-slate-500 ring-2 ring-slate-500/15',
      chevronOpen: 'text-slate-700',
      selectedItem: 'bg-slate-100 text-slate-900 font-bold',
      selectedText: 'text-slate-900 font-bold',
      selectedSubText: 'text-slate-600',
      checkIcon: 'text-slate-700',
      searchFocus: 'focus:ring-slate-500 focus:border-slate-500',
    },
  }[variant];

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs rounded-lg min-h-[32px]',
    md: 'px-3 py-2 text-xs rounded-xl min-h-[38px]',
  }[size];

  return (
    <div className={clsx('w-full flex flex-col gap-1 relative', className)} ref={containerRef} id={id}>
      {label && (
        <label className="text-xs font-semibold text-slate-800 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Box */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={clsx(
          'w-full border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none bg-white',
          sizeStyles,
          isOpen
            ? themeStyles.openBorder
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 shadow-2xs',
          error ? 'border-rose-400 ring-1 ring-rose-400/20 bg-rose-50/10' : '',
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="shrink-0 text-slate-600">{selectedOption.icon}</span>
              )}
              {selectedOption.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-slate-200"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              <div className="flex items-center gap-1.5 min-w-0 truncate">
                <span className="font-semibold text-slate-900 truncate text-xs">
                  {selectedOption.label}
                </span>
                {selectedOption.subLabel && (
                  <span className="text-[11px] text-slate-500 truncate hidden xs:inline">
                    ({selectedOption.subLabel})
                  </span>
                )}
                {selectedOption.badge && (
                  <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium shrink-0">
                    {selectedOption.badge}
                  </span>
                )}
              </div>
            </>
          ) : (
            <span className="text-slate-400 font-normal truncate text-xs">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          {clearable && selectedOption && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
              title="Clear selection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={clsx(
              'w-3.5 h-3.5 transition-transform duration-200',
              isOpen ? `rotate-180 ${themeStyles.chevronOpen}` : ''
            )}
          />
        </div>
      </button>

      {/* Floating Themed Menu Popover */}
      {isOpen && (
        <div
          className={clsx(
            'absolute top-full mt-1 z-50 bg-white rounded-xl border border-slate-200/90 shadow-[0_12px_30px_-4px_rgba(0,0,0,0.15),0_6px_12px_-4px_rgba(0,0,0,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-150',
            menuWidth || (align === 'right' ? 'right-0 min-w-full sm:min-w-[180px]' : 'left-0 min-w-full sm:min-w-[180px]')
          )}
        >
          {/* Optional Quick Search Header */}
          {searchable && options.length > 5 && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/60">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className={clsx(
                    'w-full pl-8 pr-7 py-1.5 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none transition-all',
                    themeStyles.searchFocus
                  )}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-3 text-center text-xs text-slate-400">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={clsx(
                      'w-full px-2.5 py-2 text-left rounded-lg text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer select-none',
                      isSelected
                        ? themeStyles.selectedItem
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.icon && (
                        <span className={clsx('shrink-0', isSelected ? themeStyles.checkIcon : 'text-slate-400')}>
                          {opt.icon}
                        </span>
                      )}
                      {opt.color && (
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 ring-1 ring-slate-200"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={clsx('truncate block', isSelected ? themeStyles.selectedText : 'text-slate-800')}>
                            {opt.label}
                          </span>
                          {opt.badge && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-500 font-medium shrink-0">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.subLabel && (
                          <span className={clsx('text-[10.5px] block truncate mt-0.5', isSelected ? themeStyles.selectedSubText : 'text-slate-400')}>
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className={clsx('w-3.5 h-3.5 shrink-0', themeStyles.checkIcon)} />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error ? (
        <p className="text-[11px] text-rose-600 font-medium mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500 mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
};

export default ThemedSelect;
