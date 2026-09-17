import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventsService } from '../../api/eventsService';
import { societiesService } from '../../api/societiesService';
import { EventItem, SocietyItem } from '../../types';
import { encodeId } from '../../utils/idObfuscator';
import { formatDate } from '../../utils/formatters';
import Spinner from '../../components/ui/Spinner';
import {
  Calendar,
  ChevronRight,
  MapPin,
  ScrollText,
  DollarSign,
  Utensils,
  Sparkles,
} from 'lucide-react';

export const SocietyAdminHomeScreen: React.FC = () => {
  const { user, selectedSocietyId } = useAuth();
  const navigate = useNavigate();

  const [society, setSociety] = useState<SocietyItem | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
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
      const [socRes, eventsRes] = await Promise.all([
        societiesService.getById(selectedSocietyId).catch(() => null),
        eventsService.getAll({ societyId: selectedSocietyId, limit: 10, sortBy: 'start_date', sortOrder: 'asc' }).catch(() => null),
      ]);

      if (socRes?.success && socRes.data) {
        setSociety(socRes.data);
      }
      if (eventsRes?.success && eventsRes.data) {
        setUpcomingEvents(eventsRes.data);
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

  const displayEvents: EventItem[] = upcomingEvents;
  const primaryEvent = displayEvents.length > 0 ? displayEvents[0] : null;
  const additionalEvents = displayEvents.slice(1);

  // Calculate event duration in days
  const calculateDurationDays = (startStr?: string | null, endStr?: string | null) => {
    if (!startStr) return 1;
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : start;
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
  };

  const isNavratri = primaryEvent ? (primaryEvent.is_navratri || primaryEvent.name?.toLowerCase().includes('navratri')) : false;
  const durationDays = primaryEvent ? calculateDurationDays(primaryEvent.start_date, primaryEvent.end_date) : 1;
  const primaryCounts = primaryEvent?._count || {};
  const circularsCount = primaryCounts.circulars ?? 0;
  const foodItemsCount = primaryCounts.food_items ?? 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-4">
      {/* Purple Gradient Greeting Hero Banner */}
      <div className="bg-gradient-to-br from-[#4338CA] via-[#6366F1] to-[#7C3AED] rounded-[20px] p-[18px] pb-[16px] text-white shadow-[0_10px_25px_-5px_rgba(79,70,229,0.3)] relative overflow-hidden">
        {/* Ambient Decorative Circle */}
        <div className="absolute -top-10 -right-10 w-[130px] h-[130px] bg-white/10 rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold text-white/90 uppercase tracking-[0.8px]">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Raj'}
            </span>
            <span className="bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-[6px] text-[10.5px] font-bold text-white tracking-[0.5px] border border-white/20 shrink-0">
              {society?.code || 'PMCH-01'}
            </span>
          </div>

          <h2 className="text-[16.5px] font-bold tracking-tight text-white leading-snug break-words mb-1.5">
            {society?.name || 'Palm Meadows Co-op Housing Society'}
          </h2>

          <div className="flex items-center gap-1.5 text-[12px] text-white/85 font-medium mb-3.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-white/85" />
            <span className="truncate">
              {[society?.city, society?.state].filter(Boolean).join(', ') || 'Mumbai, Maharashtra'}
            </span>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/15 text-center">
            <div className="bg-white/16 backdrop-blur-md border border-white/20 rounded-[12px] py-2.5 px-1 flex flex-col items-center justify-center gap-0.5">
              <span className="text-[18px] font-extrabold text-white leading-none">{totalUnits || 0}</span>
              <span className="text-[11px] text-white/90 font-medium">Units</span>
            </div>
            <div className="bg-white/16 backdrop-blur-md border border-white/20 rounded-[12px] py-2.5 px-1 flex flex-col items-center justify-center gap-0.5">
              <span className="text-[18px] font-extrabold text-white leading-none">{counts.persons || 0}</span>
              <span className="text-[11px] text-white/90 font-medium">Residents</span>
            </div>
            <div className="bg-white/28 backdrop-blur-md border border-white/40 rounded-[12px] py-2.5 px-1 flex flex-col items-center justify-center gap-0.5 shadow-xs">
              <span className="text-[18px] font-extrabold text-white leading-none">{displayEvents.length}</span>
              <span className="text-[11px] text-white/95 font-bold">Events</span>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <span className="w-[3.5px] h-[15px] bg-[#4F46E5] rounded-full"></span>
            <h3 className="text-[13px] font-extrabold text-slate-900 uppercase tracking-[0.6px]">
              EVENTS
            </h3>
          </div>
          <span className="text-[11.5px] font-semibold text-[#4F46E5]">Active Festival</span>
        </div>

        {!primaryEvent ? (
          <div className="bg-white border border-slate-200/90 rounded-[18px] p-6 text-center shadow-sm">
            <p className="text-xs text-slate-500 font-medium">No events scheduled for this society yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Primary Event Hero Banner */}
            <div className="bg-event-hero rounded-2xl p-4 text-white shadow-purple-glow relative overflow-hidden">
              <div className="inline-block bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-wider mb-2 uppercase border border-white/20">
                {isNavratri ? 'Grand Cultural Festival' : 'Community Event'}
              </div>
              <h3 className="text-[18px] font-extrabold tracking-tight leading-tight mb-2">
                {primaryEvent.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-white/90 mb-3 font-medium">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {formatDate(primaryEvent.start_date)}
                  {primaryEvent.end_date && primaryEvent.end_date !== primaryEvent.start_date
                    ? ` – ${formatDate(primaryEvent.end_date)} (${durationDays} Days)`
                    : ` (${durationDays} Day)`}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isNavratri ? (
                  <>
                    <span className="bg-black/20 border border-white/20 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white">
                      ✨ Dandiya & Garba
                    </span>
                    <span className="bg-black/20 border border-white/20 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white">
                      🌸 Daily Mahaprasad
                    </span>
                  </>
                ) : (
                  <span className="bg-black/20 border border-white/20 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white">
                    📍 {primaryEvent.venue || 'Society Premises'}
                  </span>
                )}
              </div>
            </div>

            {/* Event Modules Section Header */}
            <div className="px-0.5 pt-0.5">
              <span className="text-[12px] font-extrabold text-slate-900 tracking-wider uppercase block">
                EVENT MODULES
              </span>
              <p className="text-[11.5px] text-slate-500 mt-0.5 font-medium">
                Select a module to manage event operations
              </p>
            </div>

            {/* EXACT 3 MODULE CARDS DIRECTLY IN HOME PAGE */}
            <div className="space-y-2.5">
              {/* 1. Circulars & Notices */}
              <div
                onClick={() => navigate(`/events/${encodeId(primaryEvent.id)}?tab=circulars`)}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="w-[48px] h-[48px] rounded-xl bg-purple-50 group-hover:bg-purple-600 text-purple-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  <ScrollText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <h4 className="font-bold text-slate-900 text-[14px] group-hover:text-indigo-600 transition-colors truncate">
                      Circulars & Notices
                    </h4>
                    <span className="bg-purple-50 text-purple-700 text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-purple-200 shrink-0">
                      {circularsCount} Updates
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    Event schedules, parking & guidelines
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
              </div>

              {/* 2. Flat Collections (Seat Map) */}
              <div
                onClick={() => navigate(`/events/${encodeId(primaryEvent.id)}?tab=collections`)}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="w-[48px] h-[48px] rounded-xl bg-emerald-50 group-hover:bg-emerald-600 text-emerald-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <h4 className="font-bold text-slate-900 text-[14px] group-hover:text-emerald-700 transition-colors truncate">
                      Flat Collections
                    </h4>
                    <span className="bg-emerald-50 text-emerald-700 text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      Seat Map
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    Interactive tower, floor & flat payments
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
              </div>

              {/* 3. Food Menu */}
              <div
                onClick={() => navigate(`/events/${encodeId(primaryEvent.id)}?tab=food`)}
                className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex items-center gap-3.5 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
              >
                <div className="w-[48px] h-[48px] rounded-xl bg-rose-50 group-hover:bg-rose-600 text-rose-600 group-hover:text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                  <Utensils className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <h4 className="font-bold text-slate-900 text-[14px] group-hover:text-rose-700 transition-colors truncate">
                      Food Menu
                    </h4>
                    <span className="bg-rose-50 text-rose-700 text-[10.5px] font-bold px-2 py-0.5 rounded-full border border-rose-200 shrink-0">
                      {foodItemsCount} Items
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {isNavratri ? '9-Day delicacies & Prasad schedule' : 'Day-wise delicacies & live menu'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-rose-600 transition-colors shrink-0" />
              </div>
            </div>

            {/* Additional Events List (if any) */}
            {additionalEvents.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-[11.5px] font-bold text-slate-700 uppercase tracking-wider block">
                  Other Events
                </span>
                {additionalEvents.map((evt) => (
                  <div
                    key={evt.id}
                    onClick={() => navigate(`/events/${encodeId(evt.id)}`)}
                    className="bg-white border border-slate-200/90 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-indigo-300 cursor-pointer"
                  >
                    <div>
                      <h5 className="font-bold text-slate-900 text-xs">{evt.name}</h5>
                      <span className="text-[11px] text-slate-500">{formatDate(evt.start_date)}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SocietyAdminHomeScreen;
