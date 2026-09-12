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
  ScrollText,
  Calendar,
  Layers,
  Home as HomeIcon,
  Building2,
  Users,
  CreditCard,
  FileText,
  UploadCloud,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Sparkles,
  MapPin,
  Clock,
  RefreshCw,
} from 'lucide-react';

export const SocietyAdminHomeScreen: React.FC = () => {
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
        circularsService.getAll({ societyId: selectedSocietyId, limit: 3, sortBy: 'created_at', sortOrder: 'desc' }).catch(() => null),
      ]);

      if (socRes?.success && socRes.data) {
        setSociety(socRes.data);
      }
      if (eventsRes?.success && eventsRes.data) {
        setUpcomingEvents(eventsRes.data);
      }
      if (circRes?.success && circRes.data) {
        setRecentCirculars(circRes.data);
      }
    } catch (err) {
      console.error('Failed to load society admin dashboard data', err);
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
        <Spinner size="md" label="Loading society overview..." />
      </div>
    );
  }

  const counts = society?._count || {};
  const totalUnits = (counts.flats || 0) + (counts.bungalows || 0);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200">
      {/* Society Hero Welcome Banner */}
      <div className="bg-gradient-to-tr from-indigo-900 via-indigo-800 to-indigo-700 rounded-3xl p-4 text-white shadow-soft relative overflow-hidden">
        {/* Ambient Decorative Shapes */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-indigo-500/30 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold text-indigo-200 tracking-wide uppercase">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Admin'}
            </span>
            <button
              onClick={loadData}
              className="p-1 rounded-lg text-indigo-300 hover:text-white hover:bg-white/10 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight">
            {society?.name || 'My Society'}
          </h2>

          <div className="flex items-center gap-2 mt-1 text-[11px] text-indigo-200/90 font-medium">
            <MapPin className="w-3 h-3 shrink-0 text-indigo-300" />
            <span className="truncate">
              {[society?.city, society?.state].filter(Boolean).join(', ') || 'Smart Society'}
            </span>
            {society?.code && (
              <span className="bg-white/15 px-1.5 py-0.2 rounded text-[10px] font-bold text-white border border-white/20">
                {society.code}
              </span>
            )}
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/15 text-center">
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-1.5">
              <span className="text-[10px] text-indigo-200 block font-medium">Units</span>
              <span className="text-sm font-extrabold text-white">{totalUnits}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-1.5">
              <span className="text-[10px] text-indigo-200 block font-medium">Residents</span>
              <span className="text-sm font-extrabold text-white">{counts.persons || 0}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-1.5">
              <span className="text-[10px] text-indigo-200 block font-medium">Events</span>
              <span className="text-sm font-extrabold text-white">{counts.events || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Management Modules Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Society Modules</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">Quick Access</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <ModuleGridCard
            title="Circulars & Notices"
            description="Official announcements"
            icon={<ScrollText className="w-4 h-4" />}
            iconBg="bg-indigo-50 text-indigo-600"
            badge={recentCirculars.length || undefined}
            badgeColor="indigo"
            onClick={() => navigate(AppRoutes.CIRCULARS)}
          />

          <ModuleGridCard
            title="Events & Festivals"
            description="Cultural celebrations"
            icon={<Calendar className="w-4 h-4" />}
            iconBg="bg-purple-50 text-purple-600"
            badge={counts.events}
            badgeColor="purple"
            onClick={() => navigate(AppRoutes.EVENTS)}
          />

          <ModuleGridCard
            title="Residents Directory"
            description="Owners & member directory"
            icon={<Users className="w-4 h-4" />}
            iconBg="bg-emerald-50 text-emerald-600"
            badge={counts.persons}
            badgeColor="emerald"
            onClick={() => navigate(AppRoutes.RESIDENTS)}
          />

          <ModuleGridCard
            title="Towers & Blocks"
            description="Wings & floor layouts"
            icon={<Layers className="w-4 h-4" />}
            iconBg="bg-blue-50 text-blue-600"
            badge={counts.blocks}
            badgeColor="indigo"
            onClick={() => navigate(AppRoutes.BLOCKS)}
          />

          <ModuleGridCard
            title="Flats & Units"
            description="Apartment units & mapping"
            icon={<HomeIcon className="w-4 h-4" />}
            iconBg="bg-indigo-50 text-indigo-600"
            badge={counts.flats}
            badgeColor="indigo"
            onClick={() => navigate(AppRoutes.FLATS)}
          />

          <ModuleGridCard
            title="Bungalows / Villas"
            description="Independent units"
            icon={<Building2 className="w-4 h-4" />}
            iconBg="bg-teal-50 text-teal-600"
            badge={counts.bungalows}
            badgeColor="teal"
            onClick={() => navigate(AppRoutes.BUNGALOWS)}
          />

          <ModuleGridCard
            title="Payment Methods"
            description="UPI QR, Bank & Accounts"
            icon={<CreditCard className="w-4 h-4" />}
            iconBg="bg-amber-50 text-amber-700"
            onClick={() => navigate(AppRoutes.PAYMENT_METHODS)}
          />

          <ModuleGridCard
            title="Reports & Analytics"
            description="Download PDF & spreadsheets"
            icon={<FileText className="w-4 h-4" />}
            iconBg="bg-purple-50 text-purple-600"
            onClick={() => navigate(AppRoutes.REPORTS_HUB)}
          />
        </div>
      </div>

      {/* Upcoming Events Section */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span>Upcoming Events</span>
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
            <p className="text-[11px] text-slate-400 mt-0.5">Plan and schedule community festivals</p>
            <button
              onClick={() => navigate(AppRoutes.EVENT_CREATE)}
              className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event</span>
            </button>
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
            <span>Recent Circulars & Notices</span>
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
            <p className="text-[11px] text-slate-400 mt-0.5">Publish important society circulars & notices</p>
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
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-indigo-600 transition-colors truncate">
                        {circ.title}
                      </h4>
                      <StatusBadge status={circ.status} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium leading-tight">
                      {circ.description}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                      <span>{formatDate(circ.created_at)}</span>
                      <span className="font-semibold text-indigo-600 flex items-center gap-0.5">
                        Read Notice <ArrowUpRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Import Floating Quick Tip Card */}
      <div
        onClick={() => navigate(AppRoutes.IMPORTS)}
        className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-3 border border-indigo-100 flex items-center justify-between gap-2.5 cursor-pointer hover:border-indigo-200 transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <UploadCloud className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-indigo-950 truncate">Need to import spreadsheet data?</p>
            <p className="text-[10px] text-indigo-600 font-medium truncate">Upload flats & resident rosters in bulk</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
      </div>
    </div>
  );
};

export default SocietyAdminHomeScreen;
