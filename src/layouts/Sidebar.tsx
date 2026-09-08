import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { useUIStore } from '../store/uiStore';
import { AppRoutes } from '../constants/routes';
import { Permissions } from '../constants/permissions';
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  Wallet,
  CreditCard,
  FileText,
  ScrollText,
  UploadCloud,
  UserCheck,
  Shield,
  Settings,
  History,
  X,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  permission?: string;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const { can, isSuperAdmin } = usePermission();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  const navSections: NavSection[] = [
    {
      items: [
        {
          label: 'Dashboard',
          to: AppRoutes.DASHBOARD,
          icon: <LayoutDashboard className="w-4 h-4" />,
          permission: Permissions.DASHBOARD_READ,
        },
      ],
    },
    {
      title: 'PROPERTY STRUCTURE',
      items: [
        {
          label: 'Societies',
          to: AppRoutes.SOCIETIES,
          icon: <Building2 className="w-4 h-4" />,
          permission: Permissions.SOCIETY_READ,
        },
      ],
    },
    {
      title: 'COMMUNITY',
      items: [
        {
          label: 'Residents',
          to: AppRoutes.RESIDENTS,
          icon: <Users className="w-4 h-4" />,
          permission: Permissions.PERSON_READ,
        },
        {
          label: 'Circulars',
          to: AppRoutes.CIRCULARS,
          icon: <ScrollText className="w-4 h-4" />,
          permission: Permissions.CIRCULAR_READ,
        },
      ],
    },
    {
      title: 'EVENTS & FINANCE',
      items: [
        {
          label: 'Events',
          to: AppRoutes.EVENTS,
          icon: <Calendar className="w-4 h-4" />,
          permission: Permissions.EVENT_READ,
        },
        {
          label: 'Collections',
          to: AppRoutes.COLLECTIONS,
          icon: <Wallet className="w-4 h-4" />,
          permission: Permissions.COLLECTION_READ,
        },
        {
          label: 'Payments',
          to: AppRoutes.PAYMENTS,
          icon: <CreditCard className="w-4 h-4" />,
          permission: Permissions.PAYMENT_READ,
        },
        {
          label: 'Payment Methods',
          to: AppRoutes.PAYMENT_METHODS,
          icon: <CreditCard className="w-4 h-4" />,
          permission: Permissions.PAYMENT_METHOD_READ,
        },
      ],
    },
    {
      title: 'DATA & OPERATIONS',
      items: [
        {
          label: 'Reports Hub',
          to: AppRoutes.REPORTS,
          icon: <FileText className="w-4 h-4" />,
          permission: Permissions.REPORT_READ,
        },
        {
          label: 'Bulk Import',
          to: AppRoutes.IMPORTS,
          icon: <UploadCloud className="w-4 h-4" />,
          permission: Permissions.IMPORT_READ,
        },
      ],
    },
    {
      title: 'SYSTEM ADMIN',
      items: [
        {
          label: 'User Management',
          to: AppRoutes.USERS,
          icon: <UserCheck className="w-4 h-4" />,
          permission: Permissions.USER_READ,
        },
        {
          label: 'Roles & Access',
          to: AppRoutes.ROLES,
          icon: <Shield className="w-4 h-4" />,
          permission: Permissions.ROLE_READ,
        },
        {
          label: 'System Settings',
          to: AppRoutes.SETTINGS,
          icon: <Settings className="w-4 h-4" />,
          permission: Permissions.SETTING_READ,
        },
        {
          label: 'Audit Logs',
          to: AppRoutes.AUDIT_LOGS,
          icon: <History className="w-4 h-4" />,
          permission: Permissions.AUDIT_READ,
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile & Tablet Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:static top-0 bottom-0 left-0 z-40 w-56 max-w-[80vw] sm:max-w-xs bg-[#EEF2FF] text-slate-700 flex flex-col transition-all duration-300 ease-in-out border-r border-[#E2E8F0] shadow-sm lg:shadow-none shrink-0 h-full',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-56'
        )}
      >
        {/* Brand Header */}
        <div className="h-12 px-3.5 flex items-center justify-between border-b border-indigo-100/70 bg-[#EEF2FF] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-soft">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xs text-slate-900 tracking-tight leading-tight">
                SocietyEvent
              </span>
              <span className="text-[9px] text-indigo-600 font-bold tracking-wider uppercase">
                Community Hub
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-white/60 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-3">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(
              (item) => isSuperAdmin || !item.permission || can(item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-0.5">
                {section.title && (
                  <p className="px-2.5 text-[9px] font-bold text-indigo-900/60 tracking-wider uppercase mb-1">
                    {section.title}
                  </p>
                )}
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === AppRoutes.DASHBOARD}
                    onClick={() => {
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                        isActive
                          ? 'bg-[#E0E7FF] text-[#6366F1] shadow-2xs border border-indigo-200/60'
                          : 'text-[#475569] hover:text-[#1E293B] hover:bg-white/60'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={clsx(
                            'shrink-0 p-0.5 rounded transition-colors',
                            isActive ? 'text-[#6366F1]' : 'text-indigo-500/70 group-hover:text-indigo-600'
                          )}
                        >
                          {item.icon}
                        </span>
                        <span className="truncate text-[12px]">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer Version & Branding Tag */}
        <div className="px-3.5 py-2 border-t border-indigo-100/70 bg-indigo-50/50 text-[10px] text-slate-500 flex flex-col gap-0.5 shrink-0">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-600">v1.0.0 Production</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
              <span className="text-[9px] text-slate-500 font-medium">Live</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-400">
            Powered by <span className="text-[#6366F1] font-semibold">AnaxisTech</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

