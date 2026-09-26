import React from 'react';
import { Phone, Mail, ExternalLink } from 'lucide-react';

interface AdminFooterProps {
  className?: string;
  showBorder?: boolean;
}

export const AdminFooter: React.FC<AdminFooterProps> = ({ className = '', showBorder = false }) => {
  return (
    <footer
      className={`text-slate-500 max-w-[1600px] mx-auto w-full shrink-0 ${showBorder ? 'border-t border-slate-200/80' : ''} ${className}`}
      role="contentinfo"
      aria-label="Admin Footer"
    >
      <div className="flex items-center justify-center flex-nowrap whitespace-nowrap gap-x-1 sm:gap-x-2 text-center px-0.5 overflow-hidden text-[9px] min-[370px]:text-[9.5px] min-[410px]:text-[10px] sm:text-[11px] leading-tight">
        {/* Powered by AnaxisTech link */}
        <a
          href="https://anaxistech.com/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Powered by AnaxisTech (opens official website in new tab)"
          className="inline-flex items-center gap-0.5 font-medium text-slate-500 hover:text-indigo-600 transition-colors group shrink-0 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xs"
        >
          <span>Powered by</span>
          <span className="font-semibold text-indigo-600 group-hover:text-indigo-700 group-hover:underline">
            AnaxisTech
          </span>
          <ExternalLink className="w-2 h-2 text-indigo-400 group-hover:text-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
        </a>

        {/* Separator dot */}
        <span className="text-slate-300 select-none text-[8px] leading-none shrink-0" aria-hidden="true">
          &bull;
        </span>

        {/* Phone Contact */}
        <a
          href="tel:+919023148808"
          aria-label="Call AnaxisTech support at +91 90231 48808"
          className="inline-flex items-center gap-0.5 font-medium text-slate-500 hover:text-indigo-600 transition-colors shrink-0 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xs"
        >
          <Phone className="w-2.5 h-2.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span>+91 90231 48808</span>
        </a>

        {/* Separator dot */}
        <span className="text-slate-300 select-none text-[8px] leading-none shrink-0" aria-hidden="true">
          &bull;
        </span>

        {/* Email Contact */}
        <a
          href="mailto:info@anaxistech.com"
          aria-label="Send email to AnaxisTech at info@anaxistech.com"
          className="inline-flex items-center gap-0.5 font-medium text-slate-500 hover:text-indigo-600 transition-colors shrink-0 focus:outline-hidden focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xs"
        >
          <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span>info@anaxistech.com</span>
        </a>
      </div>
    </footer>
  );
};

export default AdminFooter;
