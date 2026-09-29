export interface SocialLink {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  colorClass: string;
  hoverClass: string;
  bgClass: string;
}

export const PLATFORM_SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    url: 'https://www.instagram.com/rosewoodclub2026?utm_source=qr&stkn=NHhnemk1Zmd6djBp',
    enabled: true,
    colorClass: 'text-pink-600',
    hoverClass: 'hover:text-pink-600',
    bgClass: 'hover:bg-pink-50 hover:border-pink-200',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    url: '', // Add LinkedIn URL when available
    enabled: false,
    colorClass: 'text-blue-700',
    hoverClass: 'hover:text-blue-700',
    bgClass: 'hover:bg-blue-50 hover:border-blue-200',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    url: '', // Add Facebook URL when available
    enabled: false,
    colorClass: 'text-blue-600',
    hoverClass: 'hover:text-blue-600',
    bgClass: 'hover:bg-blue-50 hover:border-blue-200',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    url: '', // Add TikTok URL when available
    enabled: false,
    colorClass: 'text-slate-900',
    hoverClass: 'hover:text-black',
    bgClass: 'hover:bg-slate-100 hover:border-slate-300',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    url: '', // Add Snapchat URL when available
    enabled: false,
    colorClass: 'text-amber-500',
    hoverClass: 'hover:text-amber-600',
    bgClass: 'hover:bg-amber-50 hover:border-amber-200',
  },
];

export const getActiveSocialLinks = () => PLATFORM_SOCIAL_LINKS.filter((item) => item.enabled && item.url.trim() !== '');
