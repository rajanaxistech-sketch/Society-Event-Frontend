import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backUrl?: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
  className?: string;
}

export const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backUrl,
  showBack = true,
  rightAction,
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div
      className={clsx(
        'sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between gap-2 shadow-2xs',
        className
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="w-8 h-8 rounded-xl bg-slate-100/90 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center justify-center shrink-0 transition-colors active:scale-95 border border-slate-200/60"
            aria-label="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900 truncate leading-tight tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[10px] text-slate-500 truncate leading-tight font-medium mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {rightAction && <div className="shrink-0 flex items-center gap-1.5">{rightAction}</div>}
    </div>
  );
};

export default MobilePageHeader;
