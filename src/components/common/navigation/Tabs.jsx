import React, { useState } from "react";
import { cn } from "../../../utils/cn";

export function Tabs({
  items = [],
  activeTab,
  defaultActiveTab,
  onChange,
  variant = "line", // 'line' | 'pills' | 'enclosed'
  size = "md", // 'sm' | 'md' | 'lg'
  fullWidth = false,
  className = "",
  tabListClassName = "",
  contentClassName = "",
  ...props
}) {
  const initialTab = defaultActiveTab || (items.length > 0 ? items[0].id : null);
  const [internalTab, setInternalTab] = useState(initialTab);

  const isControlled = activeTab !== undefined;
  const currentTab = isControlled ? activeTab : internalTab;

  const handleTabClick = (tab) => {
    if (tab.disabled) return;
    if (!isControlled) {
      setInternalTab(tab.id);
    }
    onChange?.(tab.id);
  };

  const activeItem = items.find((item) => item.id === currentTab);

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const getTabClasses = (tab) => {
    const isSelected = tab.id === currentTab;

    if (variant === "pills") {
      return cn(
        "rounded-card-sm font-semibold transition-all duration-150 select-none",
        isSelected
          ? "bg-brand-600 text-white shadow-soft"
          : "text-navy-600 hover:bg-slate-200/70 hover:text-navy-900"
      );
    }

    if (variant === "enclosed") {
      return cn(
        "rounded-t-card-sm font-semibold transition-all duration-150 border-t border-l border-r select-none -mb-px",
        isSelected
          ? "bg-white text-brand-600 border-slate-200 font-bold shadow-soft"
          : "bg-slate-50 text-navy-500 border-transparent hover:text-navy-800 hover:bg-slate-100"
      );
    }

    // Default 'line'
    return cn(
      "font-semibold border-b-2 transition-all duration-150 select-none -mb-[2px]",
      isSelected
        ? "border-brand-600 text-brand-700 font-bold"
        : "border-transparent text-navy-500 hover:text-navy-800 hover:border-slate-300"
    );
  };

  return (
    <div className={cn("flex flex-col w-full", className)} {...props}>
      <div
        role="tablist"
        className={cn(
          "flex items-center gap-1.5 overflow-x-auto no-scrollbar",
          variant === "line" && "border-b-2 border-slate-200",
          variant === "enclosed" && "border-b border-slate-200",
          variant === "pills" && "p-1.5 bg-slate-100/90 rounded-card border border-slate-200/80",
          tabListClassName
        )}
      >
        {items.map((tab) => {
          const isSelected = tab.id === currentTab;

          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              id={`tab-${tab.id}`}
              aria-selected={isSelected}
              aria-controls={`panel-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => handleTabClick(tab)}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                sizeClasses[size] || sizeClasses.md,
                fullWidth && "flex-1",
                getTabClasses(tab),
                tab.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-gray-400"
              )}
            >
              {tab.icon && <span className="inline-flex shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "ml-1.5 px-1.5 py-0.5 text-xs font-semibold rounded-full",
                    isSelected
                      ? variant === "pills"
                        ? "bg-blue-700 text-white"
                        : "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-700"
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeItem?.content && (
        <div
          role="tabpanel"
          id={`panel-${activeItem.id}`}
          aria-labelledby={`tab-${activeItem.id}`}
          className={cn("pt-4 focus:outline-none", contentClassName)}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}

export default Tabs;
