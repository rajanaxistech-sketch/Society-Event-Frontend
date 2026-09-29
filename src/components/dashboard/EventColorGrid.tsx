import React from 'react';
import { EventDayColorItem, EventColorGridProps } from '../../types/eventGrid';
import { getContrastTextColor } from '../../constants/navratriSchedule';
import { Sparkles } from 'lucide-react';

export const EventColorGrid: React.FC<EventColorGridProps> = ({
  title = 'Navratri 2026 Colors',
  subtitle = '9-Day Festive Theme',
  badge = '9 Days',
  items,
  columns = 3,
  className = '',
  onCardClick,
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  const gridColsClass =
    columns === 2
      ? 'grid-cols-2'
      : columns === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : 'grid-cols-3';

  return (
    <section aria-label={title} className={`space-y-2.5 pt-2 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-[14px] sm:text-[15px] font-bold text-slate-900 tracking-tight leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-slate-500 font-medium leading-none mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {badge && (
          <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/10 to-purple-500/10 text-orange-700 text-[10.5px] font-bold border border-orange-200/60 shadow-2xs">
            {badge}
          </span>
        )}
      </div>

      {/* 3x3 Responsive Grid */}
      <div className={`grid ${gridColsClass} gap-2 sm:gap-2.5`}>
        {items.map((item) => {
          const styling = getContrastTextColor(item.bgColor, item.textColor);
          const isClickable = typeof onCardClick === 'function';

          const CardComponent = isClickable ? 'button' : 'div';
          const cardProps = isClickable
            ? {
                type: 'button' as const,
                onClick: () => onCardClick(item),
                'aria-label': `${item.dayLabel}: ${item.date}, Color ${item.colorName}`,
              }
            : {
                role: 'article',
                'aria-label': `${item.dayLabel}: ${item.date}, Color ${item.colorName}`,
              };

          return (
            <CardComponent
              key={item.id || item.dayNumber}
              {...cardProps}
              style={{ backgroundColor: item.bgColor }}
              className={`relative rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between min-h-[92px] sm:min-h-[100px] text-left transition-all duration-150 border ${
                item.borderColor || styling.borderClass
              } ${
                isClickable
                  ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1'
                  : 'hover:scale-[1.01]'
              }`}
            >
              {/* Top Row: Number Badge (Top Left) */}
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] sm:text-[10.5px] font-mono font-bold leading-none tracking-tight ${styling.badgeBg} ${styling.badgeText}`}
                >
                  {item.formattedNumber}
                </span>

                {item.isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
                )}
              </div>

              {/* Bottom/Body: Day, Date, and Color Name */}
              <div className="space-y-0.5">
                <div className="flex flex-col">
                  <span
                    className={`text-[11px] sm:text-[12px] font-bold leading-tight ${styling.textColor}`}
                  >
                    {item.dayLabel}
                  </span>
                  <span
                    className={`text-[9.5px] sm:text-[10.5px] font-medium leading-tight ${styling.subtextColor}`}
                  >
                    {item.date}
                  </span>
                </div>

                <div className="pt-1">
                  <span
                    className={`text-[10.5px] sm:text-[11.5px] font-extrabold uppercase tracking-wider block truncate ${styling.textColor}`}
                  >
                    {item.colorName}
                  </span>
                </div>
              </div>
            </CardComponent>
          );
        })}
      </div>
    </section>
  );
};

export default EventColorGrid;
