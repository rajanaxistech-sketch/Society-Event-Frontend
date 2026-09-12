import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { AppRoutes } from '../constants/routes';
import { circularsService } from '../../src/api/circularsService';
import { CircularItem } from '../types';
import MobileBottomSheet from '../components/mobile/MobileBottomSheet';
import {
  Home,
  Calendar,
  Users,
  ScrollText,
  Grid,
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  Layers,
  FileText,
  UploadCloud,
  Settings,
  Shield,
  CreditCard,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

export const MobileAppLayout: React.FC = () => {
  const { user, clearAuth, selectedSocietyId, setSelectedSocietyId } = useAuth();
  const { isResident } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();

  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentNotices, setRecentNotices] = useState<CircularItem[]>([]);

  const societies = user?.societies || [];
  const currentSociety = societies.find((s) => s.id === selectedSocietyId) || societies[0];

  // Fetch recent notices for notifications drawer
  useEffect(() => {
    if (selectedSocietyId) {
      circularsService
        .getAll({ societyId: selectedSocietyId, limit: 5 })
        .then((res) => {
          if (res.success && res.data) {
            setRecentNotices(res.data);
          }
        })
        .catch(() => {});
    }
  }, [selectedSocietyId]);

  const handleLogout = () => {
    clearAuth();
    navigate(AppRoutes.LOGIN);
  };

  // Close drawers when route changes
  useEffect(() => {
    setMoreDrawerOpen(false);
    setProfileDrawerOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  // Primary bottom navigation items
  const adminNavItems = [
    { label: 'Home', to: AppRoutes.DASHBOARD, icon: Home },
    { label: 'Events', to: AppRoutes.EVENTS, icon: Calendar },
    { label: 'Residents', to: AppRoutes.RESIDENTS, icon: Users },
    { label: 'Circulars', to: AppRoutes.CIRCULARS, icon: ScrollText },
  ];

  const residentNavItems = [
    { label: 'Home', to: AppRoutes.DASHBOARD, icon: Home },
    { label: 'Events', to: AppRoutes.EVENTS, icon: Calendar },
    { label: 'Circulars', to: AppRoutes.CIRCULARS, icon: ScrollText },
    { label: 'Directory', to: AppRoutes.RESIDENTS, icon: Users },
  ];

  const currentNavItems = isResident ? residentNavItems : adminNavItems;

  // Secondary modules for "More" drawer
  const adminMoreModules = [
    {
      title: 'Towers & Blocks',
      description: 'Manage blocks & wings',
      to: AppRoutes.BLOCKS,
      icon: Layers,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Flats & Units',
      description: 'Apartment units & residents',
      to: AppRoutes.FLATS,
      icon: Building2,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Bungalows & Villas',
      description: 'Independent residential units',
      to: AppRoutes.BUNGALOWS,
      icon: Building2,
      color: 'bg-teal-50 text-teal-600',
    },
    {
      title: 'Payment Methods',
      description: 'UPI QR, Bank accounts & Cash',
      to: AppRoutes.PAYMENT_METHODS,
      icon: CreditCard,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Reports & Analytics',
      description: 'Collections & exportable reports',
      to: AppRoutes.REPORTS_HUB,
      icon: FileText,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Bulk Data Import',
      description: 'Upload residents & unit spreadsheets',
      to: AppRoutes.IMPORTS,
      icon: UploadCloud,
      color: 'bg-amber-50 text-amber-700',
    },
    {
      title: 'User Management',
      description: 'Admin users & staff accounts',
      to: AppRoutes.USERS,
      icon: Users,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Roles & Permissions',
      description: 'Role access matrix',
      to: AppRoutes.ROLES,
      icon: Shield,
      color: 'bg-slate-100 text-slate-700',
    },
    {
      title: 'System Settings',
      description: 'Preferences & configurations',
      to: AppRoutes.SETTINGS,
      icon: Settings,
      color: 'bg-slate-100 text-slate-700',
    },
  ];

  const residentMoreModules = [
    {
      title: 'Society Circulars',
      description: 'Official notices & rules',
      to: AppRoutes.CIRCULARS,
      icon: ScrollText,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      title: 'Community Events',
      description: 'Upcoming festivals & celebrations',
      to: AppRoutes.EVENTS,
      icon: Calendar,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'Resident Directory',
      description: 'Neighbor directory & contacts',
      to: AppRoutes.RESIDENTS,
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600',
    },
  ];

  const moreModules = isResident ? residentMoreModules : adminMoreModules;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900/10 via-slate-800/5 to-slate-900/10 flex items-center justify-center sm:py-3 sm:px-2 antialiased selection:bg-indigo-100 selection:text-indigo-800">
      {/* Mobile Device Canvas Frame */}
      <div className="w-full max-w-[440px] min-h-screen sm:min-h-[94vh] sm:max-h-[94vh] sm:rounded-[32px] sm:shadow-2xl sm:border sm:border-slate-200/80 bg-[#F8F7FC] flex flex-col overflow-hidden relative">
        {/* Top Mobile App Header */}
        <header className="h-14 bg-white border-b border-slate-200/80 px-3.5 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-2xs">
          {/* Society Badge / Selector */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-soft">
              <Sparkles className="w-4 h-4" />
            </div>
            <div
              className="min-w-0 cursor-pointer flex-1"
              onClick={() => setProfileDrawerOpen(true)}
            >
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-xs text-slate-900 truncate leading-tight">
                  {currentSociety?.name || 'Society Portal'}
                </span>
                {societies.length > 1 && <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />}
              </div>
              <p className="text-[10px] text-indigo-600 font-semibold truncate leading-none mt-0.5">
                {user?.role?.name || (isResident ? 'Resident' : 'Society Admin')}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="w-8 h-8 rounded-xl bg-slate-100/90 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors active:scale-95 relative border border-slate-200/60"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {recentNotices.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />
              )}
            </button>

            {/* Profile Avatar Button */}
            <button
              type="button"
              onClick={() => setProfileDrawerOpen(true)}
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs hover:opacity-95 transition-opacity active:scale-95"
              aria-label="User Profile"
            >
              {user?.fullName?.charAt(0) || 'U'}
            </button>
          </div>
        </header>

        {/* Scrollable Main Content Viewport */}
        <main className="flex-1 overflow-y-auto px-3 py-3 sm:px-3.5 sm:py-3.5 space-y-3.5 no-scrollbar bg-[#F8F7FC] relative">
          <Outlet />
        </main>

        {/* Persistent Fixed Mobile Bottom Navigation */}
        <nav className="h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 flex items-center justify-around shrink-0 sticky bottom-0 z-30 shadow-lg">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === AppRoutes.DASHBOARD}
                className={({ isActive }) =>
                  clsx(
                    'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[56px]',
                    isActive
                      ? 'text-indigo-600 font-bold scale-105'
                      : 'text-slate-400 hover:text-slate-600 font-medium'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={clsx(
                        'w-8 h-7 flex items-center justify-center rounded-lg transition-colors',
                        isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] leading-tight mt-0.5">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}

          {/* More Drawer Button */}
          <button
            type="button"
            onClick={() => setMoreDrawerOpen(true)}
            className={clsx(
              'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 min-w-[56px]',
              moreDrawerOpen ? 'text-indigo-600 font-bold scale-105' : 'text-slate-400 hover:text-slate-600 font-medium'
            )}
          >
            <div
              className={clsx(
                'w-8 h-7 flex items-center justify-center rounded-lg transition-colors',
                moreDrawerOpen ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'
              )}
            >
              <Grid className="w-4 h-4" />
            </div>
            <span className="text-[10px] leading-tight mt-0.5">More</span>
          </button>
        </nav>
      </div>

      {/* "More" Modules Drawer Bottom Sheet */}
      <MobileBottomSheet
        isOpen={moreDrawerOpen}
        onClose={() => setMoreDrawerOpen(false)}
        title="All Modules & Services"
        subtitle="Quick access to society management tools"
      >
        <div className="grid grid-cols-2 gap-2.5">
          {moreModules.map((module, idx) => {
            const Icon = module.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  navigate(module.to);
                  setMoreDrawerOpen(false);
                }}
                className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-card text-left hover:border-indigo-200 transition-all duration-200 active:scale-95 group flex flex-col justify-between"
              >
                <div
                  className={clsx(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mb-2 group-hover:scale-105 transition-transform shadow-2xs',
                    module.color
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors leading-tight">
                    {module.title}
                  </h5>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium leading-tight">
                    {module.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </MobileBottomSheet>

      {/* Notifications Drawer Bottom Sheet */}
      <MobileBottomSheet
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Society Updates & Notices"
        subtitle="Recent circulars and announcements"
      >
        <div className="space-y-2">
          {recentNotices.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">
              No recent notifications
            </div>
          ) : (
            recentNotices.map((notice) => (
              <div
                key={notice.id}
                onClick={() => {
                  navigate(AppRoutes.CIRCULARS);
                  setNotificationsOpen(false);
                }}
                className="bg-white p-3 rounded-xl border border-slate-200/70 shadow-2xs hover:border-indigo-200 cursor-pointer transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <ScrollText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className="font-bold text-slate-900 text-xs truncate">
                      {notice.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">
                      {notice.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <button
            type="button"
            onClick={() => {
              navigate(AppRoutes.CIRCULARS);
              setNotificationsOpen(false);
            }}
            className="w-full py-2 text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 mt-2"
          >
            View All Circulars &rarr;
          </button>
        </div>
      </MobileBottomSheet>

      {/* User Profile & Society Switcher Bottom Sheet */}
      <MobileBottomSheet
        isOpen={profileDrawerOpen}
        onClose={() => setProfileDrawerOpen(false)}
        title="My Profile & Society"
      >
        <div className="space-y-3.5">
          {/* User Profile Card */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-extrabold text-base uppercase shadow-soft">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 text-sm truncate">{user?.fullName}</h4>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold mt-1">
                <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                <span>{user?.role?.name || 'Member'}</span>
              </div>
            </div>
          </div>

          {/* Society Switcher List */}
          {societies.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Assigned Societies
              </p>
              <div className="space-y-1">
                {societies.map((s) => {
                  const isSelected = s.id === selectedSocietyId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedSocietyId(s.id);
                        setProfileDrawerOpen(false);
                      }}
                      className={clsx(
                        'w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all',
                        isSelected
                          ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 shadow-2xs font-bold'
                          : 'bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2
                          className={clsx(
                            'w-4 h-4 shrink-0',
                            isSelected ? 'text-indigo-600' : 'text-slate-400'
                          )}
                        />
                        <span className="text-xs truncate">{s.name}</span>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-600 text-white rounded-md">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-rose-100 active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </MobileBottomSheet>
    </div>
  );
};

export default MobileAppLayout;
