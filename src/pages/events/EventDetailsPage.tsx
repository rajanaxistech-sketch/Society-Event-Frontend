import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService } from '../../api/eventsService';
import { EventItem } from '../../types';
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
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import { getEventTheme } from '../../utils/eventTheme';

// Sub-module tab components
import { EventCollectionsPage } from './EventCollectionsPage';
import { EventSponsorsPage } from './EventSponsorsPage';
import { EventFoodPage } from './EventFoodPage';
import { EventDressCodesPage } from './EventDressCodesPage';
import { EventActivitiesPage } from './EventActivitiesPage';

import {
  ArrowLeft,
  Calendar,
  Wallet,
  Users,
  Utensils,
  Shirt,
  Sparkles,
  Sliders,
  Edit2,
  Send,
  LayoutDashboard,
  MapPin,
  Clock,
  Building2,
} from 'lucide-react';

export const EventDetailsPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [event, setEvent] = useState<EventItem | null>(null);
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
      const res = await eventsService.getById(id);
      if (res.success && res.data) {
        setEvent(res.data);
      } else {
        setError(res.message || 'Event not found');
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

  // Construct dynamic tabs based on enabled configuration flags
  const tabs: TabItem[] = [{ id: 'overview', label: 'Event Overview', icon: <Calendar className="w-4 h-4" /> }];

  if (config?.collection_enabled) {
    tabs.push({
      id: 'collections',
      label: 'Collections',
      icon: <Wallet className="w-4 h-4" />,
      count: counts.event_collections,
    });
  }

  if (config?.sponsorship_enabled) {
    tabs.push({
      id: 'sponsors',
      label: 'Sponsors',
      icon: <Users className="w-4 h-4" />,
      count: counts.sponsors,
    });
  }

  if (config?.food_enabled) {
    tabs.push({
      id: 'food',
      label: 'Food & Catering',
      icon: <Utensils className="w-4 h-4" />,
      count: counts.food_items,
    });
  }

  if (config?.dress_code_enabled) {
    tabs.push({
      id: 'dress-codes',
      label: 'Dress Codes',
      icon: <Shirt className="w-4 h-4" />,
      count: counts.dress_codes,
    });
  }

  if (config?.activities_enabled) {
    tabs.push({
      id: 'activities',
      label: 'Activities & Performances',
      icon: <Sparkles className="w-4 h-4" />,
      count: counts.event_activities,
    });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.EVENTS)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${eventTheme.iconBgClass} flex items-center justify-center font-bold text-sm shadow-2xs shrink-0`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{event.name}</h1>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${eventTheme.badgeClass}`}>
                  {eventTheme.label}
                </span>
                <StatusBadge status={event.status} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {event.society?.name || 'Society'} &bull; Date: {formatDate(event.start_date)} {event.start_time ? `@ ${event.start_time}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/events/${encodeId(id)}/dashboard`)}
            leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
          >
            Event Dashboard
          </Button>

          <PermissionGuard permission={Permissions.EVENT_CONFIG}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/events/${encodeId(id)}/configuration`)}
              leftIcon={<Sliders className="w-3.5 h-3.5" />}
            >
              Config Modules
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={Permissions.EVENT_UPDATE}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/events/${encodeId(id)}/edit`)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Event
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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

          <div className="space-y-6">
            <Card title="Enabled Sub-modules">
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 bg-slate-50">
                  <span className="text-slate-700 font-medium">Flat Collections</span>
                  <StatusBadge status={config?.collection_enabled ? 'active' : 'inactive'} size="sm" />
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
      )}

      {/* Dynamic Sub-module Tab Views */}
      {activeTab === 'collections' && <EventCollectionsPage eventId={id!} />}
      {activeTab === 'sponsors' && <EventSponsorsPage eventId={id!} />}
      {activeTab === 'food' && <EventFoodPage eventId={id!} />}
      {activeTab === 'dress-codes' && <EventDressCodesPage eventId={id!} />}
      {activeTab === 'activities' && <EventActivitiesPage eventId={id!} />}

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
