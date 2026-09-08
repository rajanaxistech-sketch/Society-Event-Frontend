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
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Calendar } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';

const editEventSchema = z.object({
  name: z.string().min(2, 'Event name must be at least 2 characters'),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  venue: z.string().optional(),
  banner_url: z.string().optional(),
  status: z.enum(['draft', 'published', 'ongoing', 'completed', 'cancelled']),
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditEventFormData>({
    resolver: zodResolver(editEventSchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const res = await eventsService.getById(id);
        if (res.success && res.data) {
          const e = res.data;
          reset({
            name: e.name,
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

  const onSubmit = async (data: EditEventFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await eventsService.update(id, {
        ...data,
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
            Modify event schedule, location, description, or operational status.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Event Details</span>
            </div>
          }
        >
          <div className="space-y-3">
            <Input
              label="Event Name"
              requiredIndicator
              error={errors.name?.message}
              {...register('name')}
            />

            <Textarea
              label="Description"
              rows={3}
              error={errors.description?.message}
              {...register('description')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label="Start Date"
                type="date"
                requiredIndicator
                error={errors.start_date?.message}
                {...register('start_date')}
              />
              <Input
                label="End Date"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Venue / Location"
                error={errors.venue?.message}
                {...register('venue')}
              />
              <Input
                label="Banner Image URL"
                error={errors.banner_url?.message}
                {...register('banner_url')}
              />
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Event Status"
                requiredIndicator
                error={errors.status?.message}
                {...register('status')}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </Select>
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
