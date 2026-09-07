export interface EventTheme {
  type: string;
  label: string;
  badgeClass: string;
  borderClass: string;
  bgLightClass: string;
  textAccentClass: string;
  iconBgClass: string;
  dotColor: string;
}

export function getEventTheme(
  eventName?: string | null,
  description?: string | null
): EventTheme {
  const text = `${eventName || ''} ${description || ''}`.toLowerCase();

  // 1. Navratri / Garba / Dandiya -> Lavender + Amber
  if (
    text.includes('navratri') ||
    text.includes('garba') ||
    text.includes('dandiya') ||
    text.includes('durga')
  ) {
    return {
      type: 'navratri',
      label: 'Navratri Festive',
      badgeClass: 'bg-[#EEF2FF] text-[#D97706] border-amber-200/80',
      borderClass: 'border-indigo-200/70',
      bgLightClass: 'bg-[#EEF2FF]/60',
      textAccentClass: 'text-[#D97706]',
      iconBgClass: 'bg-gradient-to-br from-indigo-100 to-amber-100 text-[#D97706]',
      dotColor: 'bg-[#F59E0B]',
    };
  }

  // 2. Diwali / Deepavali / New Year / Lights -> Warm Cream + Amber
  if (
    text.includes('diwali') ||
    text.includes('deepavali') ||
    text.includes('lights') ||
    text.includes('new year') ||
    text.includes('laxmi')
  ) {
    return {
      type: 'diwali',
      label: 'Diwali Festival',
      badgeClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      borderClass: 'border-[#FDE68A]',
      bgLightClass: 'bg-[#FFFBEB]/70',
      textAccentClass: 'text-[#B45309]',
      iconBgClass: 'bg-[#FEF3C7] text-[#D97706]',
      dotColor: 'bg-[#F59E0B]',
    };
  }

  // 3. Holi / Dhuleti / Colors -> Soft Pink + Purple + Blue
  if (
    text.includes('holi') ||
    text.includes('dhuleti') ||
    text.includes('colors') ||
    text.includes('colour')
  ) {
    return {
      type: 'holi',
      label: 'Holi Celebration',
      badgeClass: 'bg-pink-50 text-purple-700 border-pink-200',
      borderClass: 'border-pink-200/80',
      bgLightClass: 'bg-pink-50/40',
      textAccentClass: 'text-purple-600',
      iconBgClass: 'bg-gradient-to-tr from-pink-100 via-purple-100 to-blue-100 text-purple-700',
      dotColor: 'bg-pink-500',
    };
  }

  // 4. Sports / Fitness / Cricket / Tournament -> Soft Blue + Teal
  if (
    text.includes('sport') ||
    text.includes('cricket') ||
    text.includes('tournament') ||
    text.includes('marathon') ||
    text.includes('badminton') ||
    text.includes('football') ||
    text.includes('fitness') ||
    text.includes('yoga')
  ) {
    return {
      type: 'sports',
      label: 'Sports & Fitness',
      badgeClass: 'bg-blue-50 text-teal-800 border-teal-200',
      borderClass: 'border-teal-200/80',
      bgLightClass: 'bg-teal-50/40',
      textAccentClass: 'text-teal-700',
      iconBgClass: 'bg-gradient-to-tr from-blue-100 to-teal-100 text-teal-700',
      dotColor: 'bg-teal-500',
    };
  }

  // 5. Cultural Events / Music / Drama / Celebration -> Soft Purple
  if (
    text.includes('cultural') ||
    text.includes('annual') ||
    text.includes('music') ||
    text.includes('dance') ||
    text.includes('drama') ||
    text.includes('independence') ||
    text.includes('republic') ||
    text.includes('celebration')
  ) {
    return {
      type: 'cultural',
      label: 'Cultural Event',
      badgeClass: 'bg-[#FAF5FF] text-[#7C3AED] border-purple-200',
      borderClass: 'border-purple-200/80',
      bgLightClass: 'bg-[#FAF5FF]/70',
      textAccentClass: 'text-[#7C3AED]',
      iconBgClass: 'bg-purple-100/90 text-[#7C3AED]',
      dotColor: 'bg-[#8B5CF6]',
    };
  }

  // 6. Community Gathering / Default -> Soft Teal & Soft Lavender
  return {
    type: 'community',
    label: 'Community Gathering',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    borderClass: 'border-slate-200',
    bgLightClass: 'bg-[#EEF2FF]/60',
    textAccentClass: 'text-[#6366F1]',
    iconBgClass: 'bg-[#EEF2FF] text-[#6366F1]',
    dotColor: 'bg-[#14B8A6]',
  };
}
