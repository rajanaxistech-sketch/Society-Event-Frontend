import React from 'react';
import { PLATFORM_SOCIAL_LINKS, SocialLink } from '../../constants/socialLinks';
import clsx from 'clsx';

interface SocialMediaLinksProps {
  className?: string;
  iconSize?: number;
  variant?: 'compact' | 'expanded' | 'icons-only';
  showLabel?: boolean;
}

// Instagram SVG Icon
const InstagramIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// LinkedIn SVG Icon
const LinkedinIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

// Facebook SVG Icon
const FacebookIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

// TikTok SVG Icon
const TikTokIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

// Snapchat SVG Icon
const SnapchatIcon: React.FC<{ size?: number; className?: string }> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12.002 2c-3.75 0-6.75 2.85-6.75 6.64 0 .97.2 2.29.83 3.65.17.37.19.53.03.73-.25.32-.78.58-1.44.82-.44.16-.76.32-.76.6 0 .36.43.6 1.05.81.44.15.93.31 1.14.65.15.25.04.64-.17 1.09-.27.58-.69 1.45-.69 2.05 0 .93 1.04 1.34 2.21 1.58.55.11 1.18.24 1.71.59.39.26.74.65 1.31.65.5 0 .86-.33 1.25-.58.54-.35 1.17-.48 1.72-.59 1.17-.24 2.21-.65 2.21-1.58 0-.6-.42-1.47-.69-2.05-.21-.45-.32-.84-.17-1.09.21-.34.7-.5 1.14-.65.62-.21 1.05-.45 1.05-.81 0-.28-.32-.44-.76-.6-.66-.24-1.19-.5-1.44-.82-.16-.2-.14-.36.03-.73.63-1.36.83-2.68.83-3.65 0-3.79-3-6.64-6.75-6.64z" />
  </svg>
);

export const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  className = '',
  iconSize = 13,
  variant = 'icons-only',
  showLabel = false,
}) => {
  const activeLinks = PLATFORM_SOCIAL_LINKS.filter((item) => item.enabled && item.url.trim() !== '');

  if (activeLinks.length === 0) return null;

  const renderIcon = (link: SocialLink) => {
    switch (link.id) {
      case 'instagram':
        return <InstagramIcon size={iconSize} className="shrink-0 transition-transform group-hover:scale-110" />;
      case 'linkedin':
        return <LinkedinIcon size={iconSize} className="shrink-0 transition-transform group-hover:scale-110" />;
      case 'facebook':
        return <FacebookIcon size={iconSize} className="shrink-0 transition-transform group-hover:scale-110" />;
      case 'tiktok':
        return <TikTokIcon size={iconSize} className="shrink-0 transition-transform group-hover:scale-110" />;
      case 'snapchat':
        return <SnapchatIcon size={iconSize} className="shrink-0 transition-transform group-hover:scale-110" />;
      default:
        return <InstagramIcon size={iconSize} className="shrink-0" />;
    }
  };

  return (
    <div className={clsx('inline-flex items-center gap-1.5', className)}>
      {activeLinks.map((link) => (
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`Follow us on ${link.name}`}
          aria-label={`Follow us on ${link.name}`}
          className={clsx(
            'inline-flex items-center justify-center transition-all duration-200 group focus:outline-hidden focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-md',
            variant === 'expanded'
              ? `px-2 py-1 gap-1.5 border border-slate-200/80 bg-white font-semibold text-slate-700 ${link.bgClass} ${link.hoverClass}`
              : `text-slate-400 ${link.hoverClass} hover:opacity-100`
          )}
        >
          <span className={clsx(variant === 'icons-only' && link.hoverClass)}>
            {renderIcon(link)}
          </span>
          {(showLabel || variant === 'expanded') && (
            <span className="text-[10px] sm:text-[11px] font-medium leading-none">
              {link.name}
            </span>
          )}
        </a>
      ))}
    </div>
  );
};

export default SocialMediaLinks;
