import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import { AppRoutes } from '../constants/routes';
import { circularsService } from '../../src/api/circularsService';
import { eventsService } from '../../src/api/eventsService';
import { CircularItem, EventItem } from '../types';
import { encodeId } from '../utils/idObfuscator';
import MobileBottomSheet from '../components/mobile/MobileBottomSheet';
import AdminFooter from './AdminFooter';
import SocialMediaLinks from '../components/common/SocialMediaLinks';
import societyLogo from '../assets/society-logo.png';
import ChangePasswordModal from '../components/auth/ChangePasswordModal';
import {
  Home,
  ScrollText,
  DollarSign,
  Utensils,
  Megaphone,
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import clsx from 'clsx';

export const MobileAppLayout: React.FC = () => {
  const { user, clearAuth, selectedSocietyId, setSelectedSocietyId } = useAuth();
  const { isResident } = usePermission();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [recentNotices, setRecentNotices] = useState<CircularItem[]>([]);
  const [primaryEvent, setPrimaryEvent] = useState<EventItem | null>(null);

  const societies = user?.societies || [];
  const currentSociety = societies.find((s) => s.id === selectedSocietyId) || societies[0];

  // Fetch recent notices for notifications drawer and upcoming events for tab routing
  useEffect(() => {
    if (selectedSocietyId) {
      circularsService
        .getAll({ societyId: selectedSocietyId, limit: 5 })
        .then((res) => {
          if (res.success && res.data) {
            setRecentNotices(res.data);
          }
        })
        .catch(() => { });

      eventsService
        .getAll({ societyId: selectedSocietyId, limit: 10, sortBy: 'start_date', sortOrder: 'asc' })
        .then((res) => {
          if (res?.success && res.data && res.data.length > 0) {
            setPrimaryEvent(res.data[0]);
          } else {
            setPrimaryEvent(null);
          }
        })
        .catch(() => {
          setPrimaryEvent(null);
        });
    }
  }, [selectedSocietyId]);

  const handleLogout = () => {
    clearAuth();
    navigate(AppRoutes.LOGIN);
  };

  // Close drawers when route changes
  useEffect(() => {
    setProfileDrawerOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const getEventTabPath = (tab: string, fallback: string) => {
    return primaryEvent ? `/events/${encodeId(primaryEvent.id)}?tab=${tab}` : fallback;
  };

  // 5 Footer Navigation items (Home + 4 Quick Launcher Modules)
  const navItems = [
    {
      label: 'Home',
      icon: Home,
      to: AppRoutes.DASHBOARD,
      isActive: location.pathname === AppRoutes.DASHBOARD || location.pathname === '/',
      onClick: () => navigate(AppRoutes.DASHBOARD),
    },
    {
      label: 'Circulars',
      icon: ScrollText,
      to: getEventTabPath('circulars', AppRoutes.CIRCULARS),
      isActive:
        location.pathname.startsWith('/circulars') ||
        (location.pathname.startsWith('/events') && location.search.includes('tab=circulars')),
      onClick: () => {
        navigate(getEventTabPath('circulars', AppRoutes.CIRCULARS));
      },
    },
    {
      label: 'Flat Collections',
      icon: DollarSign,
      to: getEventTabPath('collections', AppRoutes.FLAT_COLLECTIONS),
      isActive:
        location.pathname.startsWith('/flat-collections') ||
        (location.pathname.startsWith('/events') && location.search.includes('tab=collections')),
      onClick: () => {
        navigate(getEventTabPath('collections', AppRoutes.FLAT_COLLECTIONS));
      },
    },
    {
      label: 'Food Menu',
      icon: Utensils,
      to: getEventTabPath('food', AppRoutes.EVENTS),
      isActive:
        (location.pathname.startsWith('/events') && location.search.includes('tab=food')) ||
        location.pathname.startsWith('/food'),
      onClick: () => {
        navigate(getEventTabPath('food', AppRoutes.EVENTS));
      },
    },
    {
      label: 'Advertising',
      icon: Megaphone,
      to: AppRoutes.ADVERTISING,
      isActive: location.pathname.startsWith('/advertising'),
      onClick: () => {
        navigate(AppRoutes.ADVERTISING);
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900/10 via-slate-800/5 to-slate-900/10 flex items-center justify-center sm:py-3 sm:px-2 antialiased selection:bg-indigo-100 selection:text-indigo-800">
      {/* Mobile Device Canvas Frame */}
      <div className="w-full max-w-[440px] h-screen h-[100dvh] sm:h-auto sm:min-h-[94vh] sm:max-h-[94vh] sm:rounded-[32px] sm:shadow-2xl sm:border sm:border-slate-200/80 bg-[#F8F7FC] flex flex-col overflow-hidden relative">
        {/* Top Mobile App Header */}
        <header className="h-[58px] bg-white border-b border-slate-200/80 px-3.5 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
          {/* Society Branding */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-xl bg-amber-50/70 flex items-center justify-center shrink-0 border border-amber-200/70 overflow-hidden shadow-xs p-0.5">
              <img src={societyLogo} alt="Society Logo" className="w-full h-full object-contain transform scale-110" />
            </div>
            <div
              className="min-w-0 cursor-pointer flex-1"
              onClick={() => setProfileDrawerOpen(true)}
            >
              <div className="flex items-center gap-1">
                <span className="font-semibold text-xs text-slate-800 truncate leading-tight">
                  {currentSociety?.name || 'Palm Meadows Co-op Housing Society'}
                </span>
                {societies.length > 1 && <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />}
              </div>
              <p className="text-[10px] text-slate-400 font-normal truncate leading-none mt-0.5">
                {isResident ? 'Resident' : 'Admin'}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setNotificationsOpen(true)}
              className="w-9 h-9 rounded-full bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200/80 flex items-center justify-center transition-all duration-150 active:scale-95 relative shadow-2xs"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* Profile Avatar Button */}
            <button
              type="button"
              onClick={() => setProfileDrawerOpen(true)}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-2xs ring-2 ring-indigo-50 hover:ring-indigo-100 hover:opacity-95 transition-all duration-150 active:scale-95 shrink-0"
              aria-label="User Profile"
            >
              {user?.fullName?.charAt(0) || (isResident ? 'R' : 'A')}
            </button>
          </div>
        </header>

        {/* Scrollable Main Content Viewport */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 py-3.5 space-y-3.5 no-scrollbar bg-[#F8FAFC] relative"
          style={{
            paddingBottom: 'calc(6.8rem + env(safe-area-inset-bottom, 0px))',
          }}
        >
          <Outlet />
        </main>

        {/* Persistent Fixed Mobile Bottom Navigation & Contact Footer */}
        <div
          className="fixed sm:absolute bottom-0 left-0 right-0 z-40 max-w-[440px] mx-auto bg-white/98 backdrop-blur-md border-t border-slate-200/80 shadow-lg flex flex-col"
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          {/* Navigation Buttons Row */}
          <nav className="px-1.5 grid grid-cols-5 items-center pt-1 pb-0.5" aria-label="Footer Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className={clsx(
                    'flex flex-col items-center justify-center py-1 rounded-xl transition-all duration-150 cursor-pointer group focus:outline-hidden',
                    item.isActive
                      ? 'text-indigo-600 font-bold'
                      : 'text-slate-400 hover:text-slate-600 font-medium'
                  )}
                  aria-label={item.label}
                  aria-current={item.isActive ? 'page' : undefined}
                >
                  <div
                    className={clsx(
                      'w-7 h-6 flex items-center justify-center rounded-lg transition-colors',
                      item.isActive ? 'text-indigo-600' : 'text-slate-400'
                    )}
                  >
                    <Icon className="w-[19px] h-[19px]" />
                  </div>
                  <span className="text-[9.5px] min-[380px]:text-[10px] leading-tight mt-0.5 text-center truncate max-w-full px-0.5">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Contact Section Directly Underneath Navigation Buttons */}
          <div className="border-t border-slate-100/80 py-1 px-1 bg-slate-50/40 overflow-hidden">
            <AdminFooter />
          </div>
        </div>
      </div>

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

          {/* Security / Change Password Button */}
          <button
            type="button"
            onClick={() => {
              setProfileDrawerOpen(false);
              setChangePasswordModalOpen(true);
            }}
            className="w-full p-2.5 rounded-xl border border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-between transition-colors shadow-2xs group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <span>Change Password</span>
            </div>
            <span className="text-[10px] text-slate-400 group-hover:text-indigo-600 font-medium">Update &rarr;</span>
          </button>

          {/* Social Media Links Section */}
          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Follow Us
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <SocialMediaLinks variant="expanded" iconSize={14} />
            </div>
          </div>

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

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default MobileAppLayout;
