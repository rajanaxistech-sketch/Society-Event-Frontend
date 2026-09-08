import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService } from '../../api/eventsService';
import { EventItem, EventDashboardData } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Tabs, { TabItem } from '../../components/ui/Tabs';
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

// Sub-module tab components
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
  Wallet,
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
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  Flame,
} from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [dashboardData, setDashboardData] = useState<EventDashboardData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(err.message || 'Failed to load event details');
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

  const config = event.event_configuration;
  const counts = event._count || {};
  const eventTheme = getEventTheme(event.name, event.description);

  // Construct dynamic tabs
  const tabs: TabItem[] = [
    { id: 'overview', label: 'Event Overview', icon: <Calendar className="w-4 h-4" /> },
    { id: 'items', label: 'Items & Expenses', icon: <Layers className="w-4 h-4" />, count: dashboardData?.items?.total_count },
    { id: 'vendors', label: 'Vendors & Contracts', icon: <Briefcase className="w-4 h-4" />, count: dashboardData?.vendors?.total_contracts },
  ];

  if (event.is_navratri || config?.collection_enabled || counts.event_collections) {
    tabs.push({
      id: 'collections',
      label: 'Flat Collections',
      icon: <Wallet className="w-4 h-4" />,
      count: counts.event_collections || dashboardData?.collections?.total_flats,
    });
  }

  if (config?.sponsorship_enabled || counts.sponsors) {
    tabs.push({
      id: 'sponsors',
      label: 'Sponsors',
      icon: <Users className="w-4 h-4" />,
      count: counts.sponsors,
    });
  }

  if (config?.food_enabled || counts.food_items) {
    tabs.push({
      id: 'food',
      label: 'Food & Catering',
      icon: <Utensils className="w-4 h-4" />,
      count: counts.food_items,
    });
  }

  if (config?.dress_code_enabled || counts.dress_codes) {
    tabs.push({
      id: 'dress-codes',
      label: 'Dress Codes',
      icon: <Shirt className="w-4 h-4" />,
      count: counts.dress_codes,
    });
  }

  if (config?.activities_enabled || counts.event_activities) {
    tabs.push({
      id: 'activities',
      label: 'Activities & Performances',
      icon: <Sparkles className="w-4 h-4" />,
      count: counts.event_activities,
    });
  }

  // Circulars tab is always available for event-level notices & announcements
  tabs.push({
    id: 'circulars',
    label: 'Circulars & Notices',
    icon: <ScrollText className="w-4 h-4" />,
    count: counts.circulars,
  });

  return (
    <div className="space-y-3.5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.EVENTS)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl ${eventTheme.iconBgClass} flex items-center justify-center font-bold text-xs shadow-2xs shrink-0`}>
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{event.name}</h1>
                {event.event_year && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Year: {event.event_year}
                  </span>
                )}
                {event.is_navratri && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-orange-600" /> Navratri
                  </span>
                )}
                <StatusBadge status={event.status} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {event.society?.name || 'Society'} &bull; Date: {formatDate(event.start_date)} {event.start_time ? `@ ${event.start_time}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/events/${encodeId(id)}/dashboard`)}
            leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
          >
            Dashboard
          </Button>

          <PermissionGuard permission={Permissions.EVENT_CONFIG}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/events/${encodeId(id)}/configuration`)}
              leftIcon={<Sliders className="w-3.5 h-3.5" />}
            >
              Config
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={Permissions.EVENT_UPDATE}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/events/${encodeId(id)}/edit`)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
          </PermissionGuard>

          {/* Publish CTA (Only if draft and has permission) */}
          {event.status === 'draft' && (
            <PermissionGuard permission={Permissions.EVENT_PUBLISH}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setPublishDialogOpen(true)}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Publish Event
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Financial Summary Top KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-linear-to-br from-indigo-500/10 to-indigo-500/5 rounded-xl border border-indigo-200 shadow-2xs">
              <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">
                Estimated Event Cost
              </span>
              <div className="text-base sm:text-lg font-bold text-indigo-950 mt-1">
                {formatCurrency(dashboardData?.items?.total_estimated_cost || 0)}
              </div>
              <span className="text-[10px] text-indigo-700 mt-0.5 block">
                {dashboardData?.items?.total_count || 0} event items configured
              </span>
            </div>

            <div className="p-3.5 bg-linear-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                Total Collection Received
              </span>
              <div className="text-base sm:text-lg font-bold text-emerald-950 mt-1">
                {formatCurrency(dashboardData?.collections?.total_collected || 0)}
              </div>
              <span className="text-[10px] text-emerald-700 mt-0.5 block">
                {dashboardData?.collections?.paid_count || 0} / {dashboardData?.collections?.total_flats || 0} flats paid
              </span>
            </div>

            <div className="p-3.5 bg-linear-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">
                Collection Pending
              </span>
              <div className="text-base sm:text-lg font-bold text-amber-950 mt-1">
                {formatCurrency(dashboardData?.collections?.pending_amount || 0)}
              </div>
              <span className="text-[10px] text-amber-700 mt-0.5 block">
                Expected: {formatCurrency(dashboardData?.collections?.total_expected || 0)}
              </span>
            </div>

            <div className="p-3.5 bg-linear-to-br from-violet-500/10 to-violet-500/5 rounded-xl border border-violet-200 shadow-2xs">
              <span className="text-[10px] font-bold text-violet-900 uppercase tracking-wider block">
                Vendor Balance Pending
              </span>
              <div className="text-base sm:text-lg font-bold text-violet-950 mt-1">
                {formatCurrency(dashboardData?.vendors?.total_pending_balance || 0)}
              </div>
              <span className="text-[10px] text-violet-700 mt-0.5 block">
                Paid: {formatCurrency(dashboardData?.vendors?.total_paid || 0)} / {formatCurrency(dashboardData?.vendors?.total_agreed_amount || 0)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              {/* Event Instructions / Guidelines Card */}
              {event.instructions && (
                <Card
                  title={
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>Event Guidelines & Instructions</span>
                    </div>
                  }
                >
                  <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60 text-xs text-amber-950 leading-relaxed whitespace-pre-line">
                    {event.instructions}
                  </div>
                </Card>
              )}

              <Card title="Event Description & Venue">
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-1 font-semibold uppercase text-[11px]">
                      Description
                    </span>
                    <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">
                      {event.description || 'No description provided for this event.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block mb-1 font-semibold uppercase text-[11px] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" /> Venue
                      </span>
                      <span className="text-slate-900 font-medium">{event.venue || 'Clubhouse Lawn'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1 font-semibold uppercase text-[11px] flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" /> Host Society
                      </span>
                      <span className="text-slate-900 font-medium">{event.society?.name || '—'}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card title="Schedule & Timing">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                      Start Date & Time
                    </span>
                    <span className="text-sm font-bold text-slate-900 block mt-1">
                      {formatDate(event.start_date)} {event.start_time ? `@ ${event.start_time}` : ''}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 font-semibold uppercase text-[10px] block">
                      End Date & Time
                    </span>
                    <span className="text-sm font-bold text-slate-900 block mt-1">
                      {event.end_date ? formatDate(event.end_date) : formatDate(event.start_date)}{' '}
                      {event.end_time ? `@ ${event.end_time}` : ''}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-4">
              <Card title="Event Specifications">
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-600 font-medium">Event Year</span>
                    <span className="font-bold text-slate-900">{event.event_year || 'Current'}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-600 font-medium">Navratri Dedicated</span>
                    <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${event.is_navratri ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'}`}>
                      {event.is_navratri ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-600 font-medium">Default Flat Collection</span>
                    <span className="font-bold text-slate-900">{formatCurrency(event.default_collection_amount || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-600 font-medium">Status</span>
                    <StatusBadge status={event.status} size="sm" />
                  </div>
                </div>
              </Card>

              <Card title="Enabled Sub-modules">
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-700 font-medium">Flat Collections</span>
                    <StatusBadge status={event.is_navratri || config?.collection_enabled ? 'active' : 'inactive'} size="sm" />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-700 font-medium">Items & Cost Calculators</span>
                    <StatusBadge status="active" size="sm" />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-700 font-medium">Vendors & Contractor Balances</span>
                    <StatusBadge status="active" size="sm" />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-700 font-medium">Food & Catering</span>
                    <StatusBadge status={config?.food_enabled ? 'active' : 'inactive'} size="sm" />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-700 font-medium">Sponsorship Funds</span>
                    <StatusBadge status={config?.sponsorship_enabled ? 'active' : 'inactive'} size="sm" />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-700 font-medium">Performances & Activities</span>
                    <StatusBadge status={config?.activities_enabled ? 'active' : 'inactive'} size="sm" />
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                    <span className="text-slate-700 font-medium">Dress Codes</span>
                    <StatusBadge status={config?.dress_code_enabled ? 'active' : 'inactive'} size="sm" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Sub-module Tab Views */}
      {activeTab === 'items' && <EventItemsTab eventId={id!} isNavratri={event.is_navratri} />}
      {activeTab === 'vendors' && <EventVendorsTab eventId={id!} />}
      {activeTab === 'collections' && <EventCollectionsPage eventId={id!} />}
      {activeTab === 'sponsors' && <EventSponsorsPage eventId={id!} />}
      {activeTab === 'food' && <EventFoodPage eventId={id!} />}
      {activeTab === 'dress-codes' && <EventDressCodesPage eventId={id!} />}
      {activeTab === 'activities' && <EventActivitiesPage eventId={id!} />}
      {activeTab === 'circulars' && (
        <EventCircularsPage eventId={id!} societyId={event.society_id} />
      )}

      {/* Publish Event Confirmation Dialog */}
      <ConfirmDialog
        isOpen={publishDialogOpen}
        onClose={() => setPublishDialogOpen(false)}
        onConfirm={handlePublish}
        title="Publish Event"
        message={
          <span>
            Are you sure you want to publish <strong>{event.name}</strong>? Publishing makes this event visible to residents and automatically opens collection obligations if configured.
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

