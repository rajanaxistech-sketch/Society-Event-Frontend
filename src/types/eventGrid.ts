export interface EventDayColorItem {
  id: string | number;
  dayNumber: number;          // 1 to 9
  formattedNumber: string;    // "01", "02", ... "09"
  dayLabel: string;           // "Day 1", "Day 2", ...
  date: string;               // "Oct 11", "Oct 12", ...
  fullDate?: string;          // "2026-10-11"
  colorName: string;          // "Orange", "White", "Red", etc.
  bgColor: string;            // Hex code or color value
  textColor?: 'light' | 'dark' | 'auto'; // Explicit override or auto-calculated
  borderColor?: string;       // Custom border style
  accentColor?: string;       // Subtle badge accent
  subtitle?: string;          // Optional secondary text
  isActive?: boolean;         // Current day highlight flag
  isDisabled?: boolean;       // Disabled state flag
}

export interface EventColorGridProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  items: EventDayColorItem[];
  columns?: 2 | 3 | 4;
  className?: string;
  onCardClick?: (item: EventDayColorItem) => void;
}
