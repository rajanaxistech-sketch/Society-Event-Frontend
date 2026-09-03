import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { AppRoutes } from '../constants/routes';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || location.pathname === '/login') return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 sm:mb-4 overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap">
      <Link
        to={AppRoutes.DASHBOARD}
        className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const formatted = value
          .replace(/-/g, ' ')
          .replace(/^[0-9a-fA-F-]{36}$/, 'Details')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 shrink-0">{formatted}</span>
            ) : (
              <Link to={to} className="hover:text-indigo-600 transition-colors shrink-0">
                {formatted}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
