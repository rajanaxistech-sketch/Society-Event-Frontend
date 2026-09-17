import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { eventsService } from '../../api/eventsService';
import { EventItem, EventDashboardData } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import PermissionGuard from '../../components/common/PermissionGuard';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import { getEventTheme } from '../../utils/eventTheme';

import { EventItemsTab } from './EventItemsTab';
import { EventVendorsTab } from './EventVendorsTab';
import { EventCollectionsPage } from './EventCollectionsPage';
import { EventSponsorsPage } from './EventSponsorsPage';
import { EventFoodPage } from './EventFoodPage';
import { EventDressCodesPage } from './EventDressCodesPage';
import { EventActivitiesPage } from './EventActivitiesPage';
import { EventCircularsPage } from './EventCircularsPage';

import {
  ArrowLeft,
  Calendar,
  Users,
  Utensils,
  Shirt,
  Sparkles,
  ScrollText,
  Sliders,
  Edit2,
  Send,
  LayoutDashboard,
  MapPin,
  Clock,
  Building2,
  Layers,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  Flame,
  ChevronRight,
} from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { can } = usePermission();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [dashboardData, setDashboardData] = useState<EventDashboardData | null>(null);
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  // Publish Modal
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const fetchEvent = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);
      const [res, dashRes] = await Promise.all([
        eventsService.getById(id),
        eventsService.getDashboard(id).catch(() => null),
      ]);

      if (res.success && res.data) {
        setEvent(res.data);
      } else {
        setError(res.message || 'Event not found');
      }

      if (dashRes && dashRes.success && dashRes.data) {
        setDashboardData(dashRes.data);
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load event details'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const handlePublish = async () => {
    if (!id) return;
    try {
      setIsPublishing(true);
      const res = await eventsService.publish(id);
      if (res.success && res.data) {
        toast.success(`Event "${res.data.name}" published successfully!`);
        setEvent(res.data);
        setPublishDialogOpen(false);
      } else {
        toast.error(res.message || 'Failed to publish event');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to publish event'));
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading event information..." />
      </div>
    );
  }

  if (error || !event) {
    return <ErrorState message={error || 'Event record not found'} onRetry={fetchEvent} />;
  }

  const currentEvent = event!;
  const counts = currentEvent._count || {};
  const isNavratri = currentEvent.is_navratri || currentEvent.name?.toLowerCase().includes('navratri');

  // Calculate event duration in days
  const calculateDurationDays = (startStr?: string | null, endStr?: string | null) => {
    if (!startStr) return 1;
    const start = new Date(startStr);
    const end = endStr ? new Date(endStr) : start;
    const diffTime = Math.max(0, end.getTime() - start.getTime());
    return Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);
  };

  const durationDays = calculateDurationDays(currentEvent.start_date, currentEvent.end_date);
  const circularsCount = counts.circulars ?? 0;
  const collectionsCount = counts.event_collections ?? dashboardData?.collections?.total_flats ?? 0;
  const foodItemsCount = counts.food_items ?? 0;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Sub-Screen Header Bar */}
      <div className="bg-white px-3 py-2.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <button
          onClick={() => {
            if (activeTab !== 'overview') {
              setActiveTab('overview');
            } else {
              navigate(-1);
            }
          }}
          className="w-9 h-9 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center transition-all active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="text-center flex flex-col items-center">
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight leading-tight">
            {activeTab === 'overview' ? currentEvent.name : activeTab === 'circulars' ? 'Circulars & Notices' : activeTab === 'collections' ? 'Flat Collections' : 'Food Menu'}
          </h2>
          <span className="text-[11px] font-semibold text-slate-500">
            {activeTab === 'overview' ? (currentEvent.venue || 'Event Management') : currentEvent.name}
          </span>
        </div>

        <div className="w-9"></div>
      </div>

      {/* TAB 1: OVERVIEW (DISPLAYING EXACT 3 REQUESTED MENUS) */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Unified Navratri Event Container Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
            {/* Compact Event Banner / Header */}
            <div className="bg-event-hero p-3 text-white relative">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full text-[9.5px] font-bold tracking-wider uppercase border border-white/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>{isNavratri ? 'Cultural Festival' : 'Active Event'}</span>
                </div>
                <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full text-white/95">
                  {durationDays} Days
                </span>
              </div>

              <h3 className="text-[15.5px] font-bold tracking-tight text-white mb-1 leading-snug">
                {currentEvent.name}
              </h3>

              <div className="flex items-center justify-between text-[11px] text-white/90 font-medium flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0 opacity-90" />
                  <span>
                    {formatDate(currentEvent.start_date)}
                    {currentEvent.end_date && currentEvent.end_date !== currentEvent.start_date
                      ? ` – ${formatDate(currentEvent.end_date)}`
                      : ''}
                  </span>
                </div>
                {isNavratri && (
                  <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full font-medium">
                    ✨ Dandiya • 🌸 Mahaprasad
                  </span>
                )}
              </div>
            </div>

            {/* Integrated Event Menu List (Directly under the heading) */}
            <div className="divide-y divide-slate-100 bg-white">
              {/* 1. Circulars & Notices (Circular Menu) */}
              <div
                onClick={() => setActiveTab('circulars')}
                className="p-3 flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <ScrollText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="font-bold text-slate-800 text-[13px] group-hover:text-indigo-600 transition-colors truncate">
                      Circulars & Notices
                    </h4>
                    <span className="bg-purple-50 text-purple-700 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border border-purple-200 shrink-0">
                      {circularsCount} Updates
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Event schedules, parking & guidelines
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
              </div>

              {/* 2. Flat Collections (Selection Menu) */}
              <div
                onClick={() => setActiveTab('collections')}
                className="p-3 flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="font-bold text-slate-800 text-[13px] group-hover:text-emerald-700 transition-colors truncate">
                      Flat Collections
                    </h4>
                    <span className="bg-emerald-50 text-emerald-700 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      Seat Map
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    Interactive tower, floor & flat payments
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
              </div>

              {/* 3. Food Menu (Food Menu) */}
              <div
                onClick={() => setActiveTab('food')}
                className="p-3 flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <Utensils className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <h4 className="font-bold text-slate-800 text-[13px] group-hover:text-rose-700 transition-colors truncate">
                      Food Menu
                    </h4>
                    <span className="bg-rose-50 text-rose-700 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full border border-rose-200 shrink-0">
                      {foodItemsCount} Items
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">
                    {isNavratri ? '9-Day delicacies & Prasad schedule' : 'Day-wise delicacies & live menu'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors shrink-0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-SCREEN 1: CIRCULARS & NOTICES */}
      {activeTab === 'circulars' && (
        <EventCircularsPage eventId={id!} societyId={currentEvent.society_id} />
      )}

      {/* SUB-SCREEN 2: FLAT COLLECTIONS (SEAT MAP MATRIX) */}
      {activeTab === 'collections' && <EventCollectionsPage eventId={id!} />}

      {/* SUB-SCREEN 3: FOOD MENU */}
      {activeTab === 'food' && <EventFoodPage eventId={id!} />}

      {/* Publish Event Confirmation Dialog */}
      <ConfirmDialog
        isOpen={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        onConfirm={handlePublish}
        title="Publish Event"
        message={
          <span>
            Are you sure you want to publish <strong>{currentEvent.name}</strong>?
          </span>
        }
        confirmLabel="Publish Event Now"
        variant="primary"
        isLoading={isPublishing}
      />
    </div>
  );
};

export default EventDetailsPage;

