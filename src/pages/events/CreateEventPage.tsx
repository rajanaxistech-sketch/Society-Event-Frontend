import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { eventsService } from '../../api/eventsService';
import { societiesService } from '../../api/societiesService';
import { SocietyItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Switch from '../../components/ui/Switch';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, Calendar, Sparkles, Wallet, Utensils, Shirt, Music, Info, Flame } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId } from '../../utils/idObfuscator';

const currentYear = new Date().getFullYear();

const createEventSchema = z.object({
  society_id: z.string().min(1, 'Please select a society'),
  name: z.string().min(2, 'Event name must be at least 2 characters'),
  event_year: z.coerce.number().int().min(2000).max(2100).optional().nullable(),
  is_navratri: z.boolean().optional(),
  default_collection_amount: z.coerce.number().min(0, 'Default collection amount must be 0 or positive').optional(),
  instructions: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  venue: z.string().optional(),
  banner_url: z.string().optional(),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navratri toggle state
  const [isNavratri, setIsNavratri] = useState(false);

  // Module configuration toggles
  const [collectionEnabled, setCollectionEnabled] = useState(true);
  const [foodEnabled, setFoodEnabled] = useState(true);
  const [dressCodeEnabled, setDressCodeEnabled] = useState(false);
  const [dholEnabled, setDholEnabled] = useState(false);
  const [bandEnabled, setBandEnabled] = useState(false);
  const [sponsorshipEnabled, setSponsorshipEnabled] = useState(false);
  const [activitiesEnabled, setActivitiesEnabled] = useState(true);

  useEffect(() => {
    societiesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setSocieties(res.data);
    });
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      society_id: '',
      name: '',
      event_year: currentYear,
      is_navratri: false,
      default_collection_amount: 5000,
      instructions: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      start_time: '19:00',
      end_time: '23:30',
      venue: 'Society Central Amphitheater / Ground',
      banner_url: '',
    },
  });

  const watchedYear = watch('event_year');

  const handleNavratriToggle = (checked: boolean) => {
    setIsNavratri(checked);
    setValue('is_navratri', checked);
    if (checked) {
      setCollectionEnabled(true);
      setFoodEnabled(true);
      setActivitiesEnabled(true);
      const yr = watchedYear || currentYear;
      setValue('name', `Navratri ${yr}`);
      setValue('default_collection_amount', 5000);
      setValue(
        'instructions',
        `Navratri ${yr} celebration rules & guidelines:\n- Garba dress code is encouraged.\n- Resident flat collection amount is ₹5,000.\n- Aarti begins daily at 7:30 PM followed by Raas Garba.`
      );
      setValue('description', `Annual Grand Navratri Mahotsav ${yr} with live orchestra, daily aarti, and resident garba competitions.`);
    }
  };

  const onSubmit = async (data: CreateEventFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        ...data,
        is_navratri: isNavratri,
        event_year: Number(data.event_year) || currentYear,
        default_collection_amount: Number(data.default_collection_amount) || 5000,
        end_date: data.end_date || null,
        configuration: {
          collection_enabled: isNavratri ? true : collectionEnabled,
          food_enabled: foodEnabled,
          dress_code_enabled: dressCodeEnabled,
          dhol_enabled: dholEnabled,
          band_enabled: bandEnabled,
          sponsorship_enabled: sponsorshipEnabled,
          activities_enabled: activitiesEnabled,
        },
      };

      const res = await eventsService.create(payload as any);
      if (res.success && res.data) {
        toast.success(`Event "${data.name}" created successfully!`);
        navigate(`/events/${encodeId(res.data.id)}`);
      } else {
        toast.error(res.message || 'Failed to create event');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create event'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.EVENTS)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Create Community Event</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Organize a yearly Navratri festival, cultural gathering, sports day, or general meeting.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Navratri Special Event Card */}
        <div
          className={`p-4 rounded-xl border transition-all duration-200 ${
            isNavratri
              ? 'bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-orange-500/10 border-amber-300 ring-1 ring-amber-300/50'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-2xs ${
                  isNavratri
                    ? 'bg-gradient-to-br from-amber-500 to-rose-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Is this a Navratri Event?</span>
                  {isNavratri && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-amber-500 text-white rounded-full">
                      Navratri Mode Enabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automatically enables 8 default Navratri item categories, flat collections, day-wise pricing, and financial tracking.
                </p>
              </div>
            </div>
            <Switch checked={isNavratri} onChange={handleNavratriToggle} />
          </div>

          {isNavratri && (
            <div className="mt-3.5 pt-3.5 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2 text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Year-Wise Isolation:</strong> Each Navratri year (e.g. 2026, 2027) operates as an independent record with its own collections and contracts.
                </span>
              </div>
              <div className="flex items-start gap-2 text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Default Categories:</strong> DJ, Sound, Main Stage, Decoration, Lighting, Anchor, Singer, Catering & F&B are provisioned automatically.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Basic Event Details */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Event Details & Scheduling</span>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Select
                label="Host Society"
                requiredIndicator
                error={errors.society_id?.message}
                placeholder="-- Select Host Society --"
                {...register('society_id')}
              >
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>

              <Input
                label="Event Year"
                type="number"
                placeholder="e.g. 2026"
                requiredIndicator
                error={errors.event_year?.message}
                {...register('event_year')}
              />

              <Input
                label="Event Title"
                placeholder={isNavratri ? 'e.g. Navratri 2026' : 'e.g. Annual Cultural Gathering 2026'}
                requiredIndicator
                error={errors.name?.message}
                {...register('name')}
              />
            </div>

            {/* Default Collection Amount Override */}
            {isNavratri && (
              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200">
                <Input
                  label="Default Flat Collection Amount (₹)"
                  type="number"
                  placeholder="5000"
                  requiredIndicator
                  helperText="Base amount assigned to all society flats for this Navratri event. Individual flat overrides can be made inside Collection Management."
                  error={errors.default_collection_amount?.message}
                  {...register('default_collection_amount')}
                />
              </div>
            )}

            <Textarea
              label="Event Description"
              placeholder="Describe the occasion, schedule of events, and notes for residents..."
              rows={2}
              error={errors.description?.message}
              {...register('description')}
            />

            <Textarea
              label="Event Instructions / Information (Optional)"
              placeholder="Important rules, aarti timings, dress code guidelines, or instructions for participants..."
              rows={2}
              error={errors.instructions?.message}
              {...register('instructions')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Input
                label="Start Date"
                type="date"
                requiredIndicator
                error={errors.start_date?.message}
                {...register('start_date')}
              />
              <Input
                label="End Date (Optional)"
                type="date"
                error={errors.end_date?.message}
                {...register('end_date')}
              />
              <Input
                label="Start Time"
                type="time"
                error={errors.start_time?.message}
                {...register('start_time')}
              />
              <Input
                label="End Time"
                type="time"
                error={errors.end_time?.message}
                {...register('end_time')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                label="Venue / Location"
                placeholder="e.g. Clubhouse Lawn, Central Amphitheater"
                error={errors.venue?.message}
                {...register('venue')}
              />
              <Input
                label="Banner Image URL (Optional)"
                placeholder="https://example.com/banner.jpg"
                error={errors.banner_url?.message}
                {...register('banner_url')}
              />
            </div>
          </div>
        </Card>

        {/* Module Configuration Toggles */}
        {!isNavratri && (
          <Card
            title={
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span>Event Sub-modules Configuration</span>
              </div>
            }
            subtitle="Enable or disable functional operational modules for this event."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Flat / Unit Collections</span>
                    <span className="text-[11px] text-slate-500">Collect contributions per unit</span>
                  </div>
                </div>
                <Switch checked={collectionEnabled} onChange={setCollectionEnabled} />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Utensils className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Food & Catering Items</span>
                    <span className="text-[11px] text-slate-500">Manage dinner, snacks, and catering</span>
                  </div>
                </div>
                <Switch checked={foodEnabled} onChange={setFoodEnabled} />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Shirt className="w-4 h-4 text-purple-600" />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Dress Code Guidelines</span>
                    <span className="text-[11px] text-slate-500">Traditional, formal, or themed dress</span>
                  </div>
                </div>
                <Switch checked={dressCodeEnabled} onChange={setDressCodeEnabled} />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Performances & Activities</span>
                    <span className="text-[11px] text-slate-500">Games, competitions, and stage shows</span>
                  </div>
                </div>
                <Switch checked={activitiesEnabled} onChange={setActivitiesEnabled} />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Music className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Live Band & Music</span>
                    <span className="text-[11px] text-slate-500">Musical band / acoustic performers</span>
                  </div>
                </div>
                <Switch checked={bandEnabled} onChange={setBandEnabled} />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Music className="w-4 h-4 text-rose-600" />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Dhol & Percussions</span>
                    <span className="text-[11px] text-slate-500">Dhol / Tasha troupe booking</span>
                  </div>
                </div>
                <Switch checked={dholEnabled} onChange={setDholEnabled} />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between sm:col-span-2">
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Corporate & Individual Sponsors</span>
                    <span className="text-[11px] text-slate-500">Raise sponsorship funds and track payments</span>
                  </div>
                </div>
                <Switch checked={sponsorshipEnabled} onChange={setSponsorshipEnabled} />
              </div>
            </div>
          </Card>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(AppRoutes.EVENTS)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isNavratri ? 'Create & Initialize Navratri Event' : 'Create & Configure Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;
