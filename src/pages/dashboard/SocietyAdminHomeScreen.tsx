import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { eventsService } from '../../api/eventsService';
import { societiesService } from '../../api/societiesService';
import { dressCodesService } from '../../api/dressCodesService';
import { EventItem, SocietyItem, DressCodeItem } from '../../types';
import { encodeId } from '../../utils/idObfuscator';
import { AppRoutes } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner';
import {
  ScrollText,
  DollarSign,
  Utensils,
  Megaphone,
  Shirt,
} from 'lucide-react';

export const SocietyAdminHomeScreen: React.FC = () => {
  const { selectedSocietyId } = useAuth();
  const navigate = useNavigate();

  const [society, setSociety] = useState<SocietyItem | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<EventItem[]>([]);
  const [dressCodes, setDressCodes] = useState<DressCodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

        // Fetch dress codes for primary event
        const primary = eventsRes.data.length > 0 ? eventsRes.data[0] : null;
        if (primary?.id) {
          const dcRes = await dressCodesService.listByEvent(primary.id).catch(() => null);
          if (dcRes?.success && dcRes.data) {
            setDressCodes(dcRes.data);
          }
        }
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
        <Spinner size="md" label="Loading app launcher..." />
      </div>
    );
  }

  const primaryEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
  const primaryCounts = primaryEvent?._count || {};
  const circularsCount = primaryCounts.circulars ?? 0;
  const foodItemsCount = primaryCounts.food_items ?? 0;
  const dressCodesCount = dressCodes.length > 0 ? dressCodes.length : (primaryCounts.dress_codes ?? 0);

  // Mobile App Launcher Menu Items
  const menuItems = [
    {
      title: 'Circulars',
      icon: ScrollText,
      iconStyle: 'bg-purple-50 text-purple-600 border border-purple-100 shadow-purple-100/50',
      badge: circularsCount > 0 ? circularsCount : undefined,
      onClick: () => {
        if (primaryEvent) {
          navigate(`/events/${encodeId(primaryEvent.id)}?tab=circulars`);
        } else {
          navigate(AppRoutes.CIRCULARS);
        }
      },
    },
    {
      title: 'Flat Collections',
      icon: DollarSign,
      iconStyle: 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-emerald-100/50',
      badge: undefined,
      onClick: () => {
        if (primaryEvent) {
          navigate(`/events/${encodeId(primaryEvent.id)}?tab=collections`);
        } else {
          navigate(AppRoutes.FLAT_COLLECTIONS);
        }
      },
    },
    {
      title: 'Food Menu',
      icon: Utensils,
      iconStyle: 'bg-rose-50 text-rose-600 border border-rose-100 shadow-rose-100/50',
      badge: foodItemsCount > 0 ? foodItemsCount : undefined,
      onClick: () => {
        if (primaryEvent) {
          navigate(`/events/${encodeId(primaryEvent.id)}?tab=food`);
        } else {
          navigate(AppRoutes.EVENTS);
        }
      },
    },
    {
      title: 'Dress Code',
      icon: Shirt,
      iconStyle: 'bg-amber-50 text-amber-600 border border-amber-100 shadow-amber-100/50',
      badge: dressCodesCount > 0 ? dressCodesCount : undefined,
      onClick: () => {
        if (primaryEvent) {
          navigate(`/events/${encodeId(primaryEvent.id)}?tab=dress-codes`);
        } else {
          navigate(AppRoutes.EVENTS);
        }
      },
    },
    {
      title: 'Advertising',
      icon: Megaphone,
      iconStyle: 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-indigo-100/50',
      badge: undefined,
      onClick: () => {
        navigate(AppRoutes.ADVERTISING);
      },
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-4 pt-1">
      {/* Title Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">Admin Home</h1>
          <p className="text-[11.5px] text-slate-500 font-medium">Quick Launcher</p>
        </div>
        {society?.code && (
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100/80 shadow-2xs">
            {society.code}
          </span>
        )}
      </div>

      {/* 2-Column / Mobile App Tiles Grid */}
      <div className="grid grid-cols-2 gap-3.5">
        {menuItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={item.onClick}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-col items-center justify-center gap-2.5 shadow-2xs hover:shadow-sm hover:border-indigo-300 active:scale-[0.98] transition-all duration-150 cursor-pointer group text-center focus:outline-hidden"
            >
              {/* Tile Icon Container */}
              <div className="relative">
                <div
                  className={`w-[60px] h-[60px] rounded-2xl flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105 ${item.iconStyle}`}
                >
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>
                {item.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 rounded-full bg-rose-500 text-white text-[10.5px] font-bold flex items-center justify-center ring-2 ring-white shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Tile Label */}
              <span className="text-[13px] font-bold text-slate-800 text-center leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SocietyAdminHomeScreen;
