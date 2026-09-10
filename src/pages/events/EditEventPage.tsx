import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { eventsService } from '../../api/eventsService';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Switch from '../../components/ui/Switch';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Calendar, Sparkles, Wallet, Flame } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';

const currentYear = new Date().getFullYear();

const editEventSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Event title is required')
      .min(3, 'Event title must be at least 3 characters')
      .max(60, 'Event title cannot exceed 60 characters'),
    event_year: z
      .coerce
      .number({ invalid_type_error: 'Valid year is required (e.g. 2026)' })
      .int('Year must be a whole number')
      .min(2000, 'Year must be 2000 or later')
      .max(2100, 'Year cannot exceed 2100'),
    is_navratri: z.boolean().optional(),
    default_collection_amount: z
      .coerce
      .number({ invalid_type_error: 'Collection amount must be a number' })
      .min(0, 'Collection amount must be 0 or positive')
      .optional(),
    instructions: z.string().max(2000, 'Instructions cannot exceed 2000 characters').optional(),
    description: z.string().max(1000, 'Description cannot exceed 1000 characters').optional(),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().optional().nullable(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    venue: z.string().max(100, 'Venue cannot exceed 100 characters').optional(),
    banner_url: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.trim() === '' || /^https?:\/\/.+/i.test(val.trim()),
        'Invalid URL format (must start with http:// or https://)'
      ),
    status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']),
  })
  .superRefine((data, ctx) => {
    if (data.start_date && data.end_date && data.end_date.trim() !== '') {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      if (end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'End date cannot be earlier than start date',
          path: ['end_date'],
        });
      }
    }
  });

type EditEventFormData = z.infer<typeof editEventSchema>;

export const EditEventPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isNavratri, setIsNavratri] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    trigger,
    watch,
    formState: { errors },
  } = useForm<EditEventFormData>({
    resolver: zodResolver(editEventSchema),
    mode: 'onBlur',
  });

  const watchedName = watch('name') || '';
  const watchedDescription = watch('description') || '';
  const watchedInstructions = watch('instructions') || '';

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const res = await eventsService.getById(id);
        if (res.success && res.data) {
          const e = res.data;
          setIsNavratri(Boolean(e.is_navratri));
          reset({
            name: e.name,
            event_year: e.event_year || currentYear,
            is_navratri: Boolean(e.is_navratri),
            default_collection_amount: Number(e.default_collection_amount) || 5000,
            instructions: e.instructions || '',
            description: e.description || '',
            start_date: e.start_date ? e.start_date.split('T')[0] : '',
            end_date: e.end_date ? e.end_date.split('T')[0] : '',
            start_time: e.start_time || '',
            end_time: e.end_time || '',
            venue: e.venue || '',
            banner_url: e.banner_url || '',
            status: (e.status as any) || 'draft',
          });
        } else {
          setError(res.message || 'Event not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load event for editing');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [id, reset]);

  const handleNavratriToggle = (checked: boolean) => {
    setIsNavratri(checked);
    setValue('is_navratri', checked, { shouldValidate: true });
  };

  const onSubmit = async (data: EditEventFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await eventsService.update(id, {
        ...data,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        instructions: data.instructions?.trim() || null,
        venue: data.venue?.trim() || null,
        banner_url: data.banner_url?.trim() || null,
        is_navratri: isNavratri,
        event_year: data.event_year ? Number(data.event_year) : undefined,
        default_collection_amount: Number(data.default_collection_amount) || 0,
        end_date: data.end_date || null,
      });

      if (res.success) {
        toast.success(`Event "${data.name}" updated successfully.`);
        navigate(`/events/${encodeId(id)}`);
      } else {
        toast.error(res.message || 'Failed to update event');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update event'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading event..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/events/${encodeId(id)}`)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Edit Event</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Modify event schedule, location, Navratri settings, collection amount, and guidelines.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Navratri Special Box */}
        <div
          className={`p-4 rounded-xl border transition-all duration-200 ${
            isNavratri
              ? 'bg-linear-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border-orange-300 shadow-xs'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-base transition-colors ${
                  isNavratri ? 'bg-orange-500 text-white shadow-xs' : 'bg-slate-200 text-slate-500'
                }`}
              >
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">Navratri Festival Mode</h3>
                  {isNavratri && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full border border-orange-200">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Isolates event budget, flat collections, items, and vendors per celebration year.
                </p>
              </div>
            </div>
            <Switch
              checked={isNavratri}
              onChange={handleNavratriToggle}
            />
          </div>
        </div>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Event Details & Scheduling</span>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Event Name"
                  requiredIndicator
                  maxLength={60}
                  showCount
                  currentCount={watchedName.length}
                  placeholder="e.g., Navratri 2026 or Annual Diwali Gala"
                  error={errors.name?.message}
                  {...register('name', {
                    onBlur: () => trigger('name'),
                    onChange: () => {
                      if (errors.name) trigger('name');
                    },
                  })}
                />
              </div>

              <div>
                <Input
                  label="Event Year"
                  type="number"
                  placeholder="e.g., 2026"
                  requiredIndicator
                  error={errors.event_year?.message}
                  {...register('event_year', {
                    onBlur: () => trigger('event_year'),
                    onChange: () => {
                      if (errors.event_year) trigger('event_year');
                    },
                  })}
                />
              </div>
            </div>

            {/* Default Collection Amount & Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <Input
                  label="Default Flat Collection Amount (₹)"
                  type="number"
                  placeholder="e.g. 5000"
                  leftIcon={<Wallet className="w-3.5 h-3.5 text-slate-400" />}
                  error={errors.default_collection_amount?.message}
                  {...register('default_collection_amount', {
                    onBlur: () => trigger('default_collection_amount'),
                  })}
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Standard expected contribution amount per flat.
                </span>
              </div>

              <div>
                <Select
                  label="Event Status"
                  requiredIndicator
                  error={errors.status?.message}
                  {...register('status', {
                    onChange: () => trigger('status'),
                  })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Select>
              </div>
            </div>

            <Textarea
              label="Event Instructions & Guidelines (Optional)"
              rows={3}
              maxLength={2000}
              showCount
              currentCount={watchedInstructions.length}
              placeholder="Guidelines for members, dress codes, timings, garba passes (Max 2000 characters)..."
              error={errors.instructions?.message}
              {...register('instructions', {
                onBlur: () => trigger('instructions'),
              })}
            />

            <Textarea
              label="Description (Optional)"
              rows={2}
              maxLength={1000}
              showCount
              currentCount={watchedDescription.length}
              placeholder="Describe event details, agenda, and notes (Max 1000 characters)..."
              error={errors.description?.message}
              {...register('description', {
                onBlur: () => trigger('description'),
              })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Start Date"
                type="date"
                requiredIndicator
                error={errors.start_date?.message}
                {...register('start_date', {
                  onBlur: () => {
                    trigger('start_date');
                    trigger('end_date');
                  },
                  onChange: () => {
                    trigger('start_date');
                    trigger('end_date');
                  },
                })}
              />
              <Input
                label="End Date (Optional)"
                type="date"
                error={errors.end_date?.message}
                {...register('end_date', {
                  onBlur: () => trigger('end_date'),
                  onChange: () => trigger('end_date'),
                })}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Venue / Location"
                maxLength={200}
                placeholder="e.g. Clubhouse Ground"
                error={errors.venue?.message}
                {...register('venue')}
              />
              <Input
                label="Banner Image URL (Optional)"
                placeholder="https://example.com/banner.jpg"
                error={errors.banner_url?.message}
                {...register('banner_url', {
                  onBlur: () => trigger('banner_url'),
                  onChange: () => {
                    if (errors.banner_url) trigger('banner_url');
                  },
                })}
              />
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/events/${encodeId(id)}`)}
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
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default EditEventPage;

