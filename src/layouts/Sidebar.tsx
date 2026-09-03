import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { useUIStore } from '../store/uiStore';
import { AppRoutes } from '../constants/routes';
import { Permissions } from '../constants/permissions';
import {
  LayoutDashboard,
  Building2,
  Layers,
  Grid,
  Home,
  Users,
  Calendar,
  Wallet,
  CreditCard,
  FileText,
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
        {
          label: 'Blocks',
          to: AppRoutes.BLOCKS,
          icon: <Layers className="w-4 h-4" />,
          permission: Permissions.BLOCK_READ,
        },
        {
          label: 'Floors',
          to: AppRoutes.FLOORS,
          icon: <Grid className="w-4 h-4" />,
          permission: Permissions.FLOOR_READ,
        },
        {
          label: 'Flats',
          to: AppRoutes.FLATS,
          icon: <Home className="w-4 h-4" />,
          permission: Permissions.FLAT_READ,
        },
        {
          label: 'Bungalows',
          to: AppRoutes.BUNGALOWS,
          icon: <Building2 className="w-4 h-4" />,
          permission: Permissions.BUNGALOW_READ,
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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:static top-0 bottom-0 left-0 z-40 w-64 max-w-[80vw] sm:max-w-xs bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-800 shadow-2xl lg:shadow-none shrink-0 h-full',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-ml-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-tight">
                SocietyEvent
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
                Enterprise Hub
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section, sIdx) => {
            const visibleItems = section.items.filter(
              (item) => isSuperAdmin || !item.permission || can(item.permission)
            );

            if (visibleItems.length === 0) return null;

            return (
              <div key={sIdx} className="space-y-1">
                {section.title && (
                  <p className="px-3 text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2">
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
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150',
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
                      )
                    }
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>

        {/* Footer Version Tag */}
        <div className="px-5 py-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between shrink-0">
          <span>v1.0.0 Production</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="API Connected" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
