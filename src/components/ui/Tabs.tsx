import React from 'react';
import clsx from 'clsx';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className = '' }) => {
  return (
    <div className={clsx('border-b border-[#E2E8F0] flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth w-full', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all duration-150 whitespace-nowrap outline-none shrink-0 cursor-pointer rounded-t-lg',
              isActive
                ? 'border-[#6366F1] text-[#6366F1] bg-[#EEF2FF]/50'
                : 'border-transparent text-slate-500 hover:text-[#6366F1] hover:bg-[#EEF2FF]/40 hover:border-slate-300',
              tab.disabled && 'opacity-40 cursor-not-allowed'
            )}
          >
            {tab.icon && <span className="w-3.5 h-3.5">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={clsx(
                  'px-1.5 py-0.5 text-[10px] font-bold rounded-full',
                  isActive ? 'bg-[#EEF2FF] text-[#6366F1]' : 'bg-slate-100 text-slate-600'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;

