import { EventDayColorItem } from '../types/eventGrid';

/**
 * Calculates text color, badge background style, and luminance based on the card background hex.
 * Adheres to WCAG contrast standards.
 */
export function getContrastTextColor(hexColor: string, explicitTheme?: 'light' | 'dark' | 'auto'): {
  textColor: string;
  subtextColor: string;
  badgeBg: string;
  badgeText: string;
  isLight: boolean;
  borderClass: string;
} {
  if (explicitTheme === 'dark') {
    return {
      textColor: 'text-slate-900',
      subtextColor: 'text-slate-600',
      badgeBg: 'bg-black/10',
      badgeText: 'text-slate-800',
      isLight: true,
      borderClass: 'border-slate-200/90 shadow-2xs',
    };
  }

  if (explicitTheme === 'light') {
    return {
      textColor: 'text-white',
      subtextColor: 'text-white/85',
      badgeBg: 'bg-white/20',
      badgeText: 'text-white',
      isLight: false,
      borderClass: 'border-white/10 shadow-xs',
    };
  }

  // Auto-calculate relative luminance
  const cleanHex = hexColor.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;

  // Relative luminance calculation
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const isLight = luminance > 0.62;

  return {
    textColor: isLight ? 'text-slate-900' : 'text-white',
    subtextColor: isLight ? 'text-slate-600' : 'text-white/85',
    badgeBg: isLight ? 'bg-black/10' : 'bg-white/20',
    badgeText: isLight ? 'text-slate-800' : 'text-white',
    isLight,
    borderClass: isLight ? 'border-slate-200/90 shadow-2xs' : 'border-white/10 shadow-xs',
  };
}

/**
 * Navratri 2026 9-Day Color Schedule
 */
export const NAVRATRI_2026_DAYS: EventDayColorItem[] = [
  {
    id: 1,
    dayNumber: 1,
    formattedNumber: '01',
    dayLabel: 'Day 1',
    date: 'Oct 11',
    fullDate: '2026-10-11',
    colorName: 'Orange',
    bgColor: '#EA580C',
  },
  {
    id: 2,
    dayNumber: 2,
    formattedNumber: '02',
    dayLabel: 'Day 2',
    date: 'Oct 12',
    fullDate: '2026-10-12',
    colorName: 'White',
    bgColor: '#FFFFFF',
    textColor: 'dark',
    borderColor: 'border-slate-200/90',
  },
  {
    id: 3,
    dayNumber: 3,
    formattedNumber: '03',
    dayLabel: 'Day 3',
    date: 'Oct 13',
    fullDate: '2026-10-13',
    colorName: 'Red',
    bgColor: '#DC2626',
  },
  {
    id: 4,
    dayNumber: 4,
    formattedNumber: '04',
    dayLabel: 'Day 4',
    date: 'Oct 14',
    fullDate: '2026-10-14',
    colorName: 'Royal Blue',
    bgColor: '#1D4ED8',
  },
  {
    id: 5,
    dayNumber: 5,
    formattedNumber: '05',
    dayLabel: 'Day 5',
    date: 'Oct 15',
    fullDate: '2026-10-15',
    colorName: 'Yellow',
    bgColor: '#FACC15',
    textColor: 'dark',
  },
  {
    id: 6,
    dayNumber: 6,
    formattedNumber: '06',
    dayLabel: 'Day 6',
    date: 'Oct 16',
    fullDate: '2026-10-16',
    colorName: 'Green',
    bgColor: '#15803D',
  },
  {
    id: 7,
    dayNumber: 7,
    formattedNumber: '07',
    dayLabel: 'Day 7',
    date: 'Oct 17',
    fullDate: '2026-10-17',
    colorName: 'Grey',
    bgColor: '#64748B',
  },
  {
    id: 8,
    dayNumber: 8,
    formattedNumber: '08',
    dayLabel: 'Day 8',
    date: 'Oct 18',
    fullDate: '2026-10-18',
    colorName: 'Purple',
    bgColor: '#7E22CE',
  },
  {
    id: 9,
    dayNumber: 9,
    formattedNumber: '09',
    dayLabel: 'Day 9',
    date: 'Oct 19',
    fullDate: '2026-10-19',
    colorName: 'Peacock Green',
    bgColor: '#0F766E',
  },
];
