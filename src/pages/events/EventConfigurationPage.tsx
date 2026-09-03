import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService } from '../../api/eventsService';
import { EventItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Switch from '../../components/ui/Switch';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Sliders, Wallet, Utensils, Shirt, Music, Sparkles } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

export const EventConfigurationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [collectionEnabled, setCollectionEnabled] = useState(false);
  const [foodEnabled, setFoodEnabled] = useState(false);
  const [dressCodeEnabled, setDressCodeEnabled] = useState(false);
  const [dholEnabled, setDholEnabled] = useState(false);
  const [bandEnabled, setBandEnabled] = useState(false);
  const [sponsorshipEnabled, setSponsorshipEnabled] = useState(false);
  const [activitiesEnabled, setActivitiesEnabled] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const res = await eventsService.getById(id);
        if (res.success && res.data) {
          const e = res.data;
          setEvent(e);
          const c = e.event_configuration;
          if (c) {
            setCollectionEnabled(c.collection_enabled ?? false);
            setFoodEnabled(c.food_enabled ?? false);
            setDressCodeEnabled(c.dress_code_enabled ?? false);
            setDholEnabled(c.dhol_enabled ?? false);
            setBandEnabled(c.band_enabled ?? false);
            setSponsorshipEnabled(c.sponsorship_enabled ?? false);
            setActivitiesEnabled(c.activities_enabled ?? false);
          }
        } else {
          setError(res.message || 'Event not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event configuration');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await eventsService.configure(id, {
        collection_enabled: collectionEnabled,
        food_enabled: foodEnabled,
        dress_code_enabled: dressCodeEnabled,
        dhol_enabled: dholEnabled,
        band_enabled: bandEnabled,
        sponsorship_enabled: sponsorshipEnabled,
        activities_enabled: activitiesEnabled,
      });

      if (res.success) {
        toast.success('Event module configuration updated.');
        navigate(`/events/${id}`);
      } else {
        toast.error(res.message || 'Failed to save configuration');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save event config'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading configuration..." />
      </div>
    );
  }

  if (error || !event) {
    return <ErrorState message={error || 'Event not found'} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/events/${id}`)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Event
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configure Event Modules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enable or disable operational sub-modules for <strong>{event.name}</strong>.
          </p>
        </div>
      </div>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <span>Operational Sub-modules</span>
          </div>
        }
        subtitle="Enabling a module activates its dedicated management tab and operational workflows."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-indigo-600" />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block">Flat / Unit Collections</span>
                  <span className="text-[11px] text-slate-500">Collect contributions per flat/bungalow</span>
                </div>
              </div>
              <Switch checked={collectionEnabled} onChange={setCollectionEnabled} />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Utensils className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block">Food & Catering Items</span>
                  <span className="text-[11px] text-slate-500">Plan menu items and cost estimates</span>
                </div>
              </div>
              <Switch checked={foodEnabled} onChange={setFoodEnabled} />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shirt className="w-5 h-5 text-purple-600" />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block">Dress Code Guidelines</span>
                  <span className="text-[11px] text-slate-500">Theme and attire instructions</span>
                </div>
              </div>
              <Switch checked={dressCodeEnabled} onChange={setDressCodeEnabled} />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block">Performances & Activities</span>
                  <span className="text-[11px] text-slate-500">Games, competitions, and artist lineups</span>
                </div>
              </div>
              <Switch checked={activitiesEnabled} onChange={setActivitiesEnabled} />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-amber-600" />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block">Live Band / Orchestra</span>
                  <span className="text-[11px] text-slate-500">Live musical performers</span>
                </div>
              </div>
              <Switch checked={bandEnabled} onChange={setBandEnabled} />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Music className="w-5 h-5 text-rose-600" />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block">Dhol & Percussions</span>
                  <span className="text-[11px] text-slate-500">Traditional dhol troupe</span>
                </div>
              </div>
              <Switch checked={dholEnabled} onChange={setDholEnabled} />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between sm:col-span-2">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="font-semibold text-xs text-slate-900 block">Corporate & Personal Sponsors</span>
                  <span className="text-[11px] text-slate-500">Track sponsor commitments and payment installments</span>
                </div>
              </div>
              <Switch checked={sponsorshipEnabled} onChange={setSponsorshipEnabled} />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/events/${id}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default EventConfigurationPage;
