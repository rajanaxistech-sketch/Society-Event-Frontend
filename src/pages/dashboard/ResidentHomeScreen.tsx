import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventsService } from '../../api/eventsService';
import { circularsService } from '../../api/circularsService';
import { societiesService } from '../../api/societiesService';
import { EventItem, CircularItem, SocietyItem } from '../../types';
import { AppRoutes } from '../../constants/routes';
import { encodeId } from '../../utils/idObfuscator';
import { formatDate } from '../../utils/formatters';
import { getEventTheme } from '../../utils/eventTheme';
import { ModuleGridCard } from '../../components/mobile/MobileCard';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import {
  Calendar,
  ScrollText,
  Users,
  Utensils,
  Shirt,
  Music,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const ResidentHomeScreen: React.FC = () => {
  const { user, selectedSocietyId } = useAuth();
  const navigate = useNavigate();

  const [society, setSociety] = useState<SocietyItem | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [recentCirculars, setRecentCirculars] = useState<CircularItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const loadData = async () => {
    if (!selectedSocietyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [socRes, eventsRes, circRes] = await Promise.all([
        societiesService.getById(selectedSocietyId).catch(() => null),
        eventsService.getAll({ societyId: selectedSocietyId, limit: 4, sortBy: 'start_date', sortOrder: 'asc' }).catch(() => null),
        circularsService.getAll({ societyId: selectedSocietyId, limit: 4, sortBy: 'created_at', sortOrder: 'desc' }).catch(() => null),
      ]);

      if (socRes?.success && socRes.data) setSociety(socRes.data);
      if (eventsRes?.success && eventsRes.data) setUpcomingEvents(eventsRes.data);
      if (circRes?.success && circRes.data) setRecentCirculars(circRes.data);
    } catch (err) {
      console.error('Failed to load resident dashboard data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSocietyId]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner size="md" label="Loading resident dashboard..." />
      </div>
    );
  }

  const primaryEvent = upcomingEvents[0];
  const latestNotice = recentCirculars[0];

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* Resident Welcome Card */}
      <div className="bg-gradient-to-tr from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-4 text-white shadow-soft relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-indigo-200 tracking-wide uppercase">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Resident'}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-bold text-white border border-white/20">
              Resident Member
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight mt-1">
            {society?.name || 'Community Portal'}
          </h2>

          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-200/90 font-medium">
            <MapPin className="w-3 h-3 shrink-0 text-indigo-300" />
            <span className="truncate">
              {[society?.city, society?.state].filter(Boolean).join(', ') || 'Smart Living'}
            </span>
          </div>
        </div>
      </div>

      {/* Important Society Announcement Banner */}
      {latestNotice && (
        <div
          onClick={() => navigate(`/circulars/${encodeId(latestNotice.id)}`)}
          className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-3 shadow-2xs cursor-pointer hover:bg-amber-50 transition-all active:scale-[0.99] flex items-start gap-2.5"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Info className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-200/70 text-amber-900">
                Notice
              </span>
              <span className="text-[10px] text-amber-800/80 font-medium">
                {formatDate(latestNotice.created_at)}
              </span>
            </div>
            <h4 className="font-bold text-slate-900 text-xs truncate mt-0.5">
              {latestNotice.title}
            </h4>
            <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5 font-medium leading-tight">
              {latestNotice.description}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-700 shrink-0 self-center" />
        </div>
      )}

      {/* Resident Quick Services Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Resident Services</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Quick Actions</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <ModuleGridCard
            title="Society Events"
            description="Festivals & gatherings"
            icon={<Calendar className="w-4 h-4" />}
            iconBg="bg-purple-50 text-purple-600"
            badge={upcomingEvents.length}
            badgeColor="purple"
            onClick={() => navigate(AppRoutes.EVENTS)}
          />

          <ModuleGridCard
            title="Notices & Circulars"
            description="Rules & announcements"
            icon={<ScrollText className="w-4 h-4" />}
            iconBg="bg-indigo-50 text-indigo-600"
            badge={recentCirculars.length}
            badgeColor="indigo"
            onClick={() => navigate(AppRoutes.CIRCULARS)}
          />

          <ModuleGridCard
            title="Neighbor Directory"
            description="Residents & contacts"
            icon={<Users className="w-4 h-4" />}
            iconBg="bg-emerald-50 text-emerald-600"
            onClick={() => navigate(AppRoutes.RESIDENTS)}
          />

          {primaryEvent ? (
            <ModuleGridCard
              title="Event Food & Menus"
              description="Dining schedules & items"
              icon={<Utensils className="w-4 h-4" />}
              iconBg="bg-amber-50 text-amber-700"
              onClick={() => navigate(`/events/${encodeId(primaryEvent.id)}/food`)}
            />
          ) : (
            <ModuleGridCard
              title="Community Reports"
              description="Society summaries"
              icon={<ScrollText className="w-4 h-4" />}
              iconBg="bg-teal-50 text-teal-700"
              onClick={() => navigate(AppRoutes.REPORTS_HUB)}
            />
          )}
        </div>
      </div>

      {/* Upcoming Community Celebrations Section */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Community Events</span>
          </h3>
          <button
            onClick={() => navigate(AppRoutes.EVENTS)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center border border-slate-200/80 shadow-card">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-700">No Upcoming Events</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Stay tuned for festival celebrations</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((evt) => {
              const theme = getEventTheme(evt.name, evt.description);
              return (
                <div
                  key={evt.id}
                  onClick={() => navigate(`/events/${encodeId(evt.id)}`)}
                  className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-card hover:border-indigo-200 transition-all cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl ${theme.iconBgClass} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-[13px] group-hover:text-indigo-600 transition-colors truncate">
                            {evt.name}
                          </h4>
                          {evt.is_navratri && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-orange-100 text-orange-800 rounded">
                              Navratri
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDate(evt.start_date)}
                          </span>
                          <span>&bull;</span>
                          <span className="truncate">{evt.venue || 'Clubhouse Lawn'}</span>
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={evt.status} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Circulars Section */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ScrollText className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recent Notices</span>
          </h3>
          <button
            onClick={() => navigate(AppRoutes.CIRCULARS)}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
          >
            <span>View All</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {recentCirculars.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center border border-slate-200/80 shadow-card">
            <ScrollText className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-slate-700">No Circulars Published</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentCirculars.map((circ) => (
              <div
                key={circ.id}
                onClick={() => navigate(`/circulars/${encodeId(circ.id)}`)}
                className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-card hover:border-indigo-200 transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <ScrollText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors truncate">
                      {circ.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium leading-tight">
                      {circ.description}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{formatDate(circ.created_at)}</span>
                      <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
                        Read <ArrowUpRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Emergency & Support Card */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-card flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">Society Helpdesk & Security</p>
            <p className="text-[10px] text-slate-500 truncate font-medium">Contact management committee</p>
          </div>
        </div>
        <button
          onClick={() => navigate(AppRoutes.RESIDENTS)}
          className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 hover:bg-indigo-100 shrink-0 transition-colors"
        >
          Directory
        </button>
      </div>
    </div>
  );
};

export default ResidentHomeScreen;
