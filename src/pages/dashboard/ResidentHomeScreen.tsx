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

  const displayEvents: EventItem[] = upcomingEvents.length > 0 ? upcomingEvents : [
    {
      id: 'navratri-2026',
      name: 'Navratri Mahotsav 2026',
      description: 'Grand 9-Day Cultural Dandiya & Garba Mahotsav with daily Mahaprasad and community celebrations',
      start_date: '2026-10-12',
      end_date: '2026-10-20',
      venue: 'Main Society Quadrangle',
      status: 'published',
      is_navratri: true,
      event_year: 2026,
    } as any,
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Purple Gradient Greeting Hero Banner */}
      <div className="bg-purple-hero rounded-[22px] p-4.5 text-white shadow-purple-glow relative overflow-hidden">
        {/* Ambient Decorative Circle */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xs pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-extrabold text-white/90 tracking-wider uppercase">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Resident'}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-md text-[10.5px] font-bold text-white tracking-wider border border-white/20">
              {society?.code || 'PMCH-01'}
            </span>
          </div>

          <h2 className="text-[16px] font-bold tracking-tight text-white leading-snug">
            {society?.name || 'Palm Meadows Co-op Housing Society'}
          </h2>

          <div className="flex items-center gap-1.5 mt-1 text-[12px] text-white/90 font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-white/90" />
            <span className="truncate">
              {[society?.city, society?.state].filter(Boolean).join(', ') || 'Mumbai, Maharashtra'}
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-white/15 text-center">
            <div className="bg-white/16 backdrop-blur-md border border-white/20 rounded-xl p-2 flex flex-col items-center justify-center">
              <span className="text-[17px] font-extrabold text-white leading-tight">120</span>
              <span className="text-[11px] text-white/90 font-medium">Units</span>
            </div>
            <div className="bg-white/16 backdrop-blur-md border border-white/20 rounded-xl p-2 flex flex-col items-center justify-center">
              <span className="text-[17px] font-extrabold text-white leading-tight">120</span>
              <span className="text-[11px] text-white/90 font-medium">Residents</span>
            </div>
            <div className="bg-white/28 backdrop-blur-md border border-white/40 rounded-xl p-2 flex flex-col items-center justify-center shadow-xs">
              <span className="text-[17px] font-extrabold text-white leading-tight">{displayEvents.length}</span>
              <span className="text-[11px] text-white/90 font-semibold">Events</span>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section Header */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="w-[3.5px] h-[15px] bg-indigo-600 rounded-sm"></span>
            <h3 className="text-[13.5px] font-extrabold text-slate-900 uppercase tracking-wider">
              EVENTS
            </h3>
          </div>
          <span className="text-xs font-semibold text-indigo-600">Quick Access</span>
        </div>

        {/* Event Cards List */}
        <div className="space-y-2.5">
          {displayEvents.map((evt) => {
            return (
              <div
                key={evt.id}
                onClick={() => navigate(`/events/${encodeId(evt.id)}`)}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
              >
                {/* Event Card Icon Banner */}
                <div className="w-[52px] h-[52px] rounded-2xl bg-gradient-to-tr from-rose-100 to-indigo-100 flex items-center justify-center text-2xl shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  🪔
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <h4 className="font-bold text-slate-900 text-[14.5px] group-hover:text-indigo-600 transition-colors truncate">
                      {evt.name}
                    </h4>
                    <span className="bg-indigo-50 text-indigo-600 text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 border border-indigo-100">
                      {evt.is_navratri ? 'Cultural' : 'Festival'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">
                      {formatDate(evt.start_date)} {evt.end_date ? `– ${formatDate(evt.end_date)}` : ''}
                    </span>
                  </div>
                </div>

                {/* Chevron */}
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
              </div>
            );
          })}
        </div>
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
