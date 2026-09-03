import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { societiesService } from '../../api/societiesService';
import { SocietyItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

const editSocietySchema = z.object({
  name: z.string().min(2, 'Society name must be at least 2 characters'),
  code: z.string().max(50, 'Code must be max 50 characters').optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  contact_name: z.string().optional(),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Invalid email address').optional(),
  status: z.enum(['active', 'inactive']),
});

type EditSocietyFormData = z.infer<typeof editSocietySchema>;

export const EditSocietyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
  } = useForm<EditSocietyFormData>({
    resolver: zodResolver(editSocietySchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchSociety = async () => {
      try {
        setIsLoading(true);
        const res = await societiesService.getById(id);
        if (res.success && res.data) {
          const s = res.data;
          reset({
            name: s.name,
            code: s.code || '',
            address_line1: s.address_line1 || '',
            address_line2: s.address_line2 || '',
            city: s.city || '',
            state: s.state || '',
            postal_code: s.postal_code || '',
            contact_name: s.contact_name || '',
            contact_phone: s.contact_phone || '',
            contact_email: s.contact_email || '',
            status: (s.status as 'active' | 'inactive') || 'active',
          });
        } else {
          setError(res.message || 'Society not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load society for editing');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSociety();
  }, [id, reset]);

  const onSubmit = async (data: EditSocietyFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await societiesService.update(id, data);

      if (res.success && res.data) {
        toast.success(`Society "${res.data.name}" updated successfully.`);
        navigate(`/societies/${id}`);
      } else {
        toast.error(res.message || 'Failed to update society.');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update society.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading society details..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/societies/${id}`)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Society</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update society profile, contact information, and address records.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Society Profile & Address Details</span>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Primary Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Society Name"
                error={errors.name?.message}
                requiredIndicator
                {...register('name')}
              />
              <Input
                label="Society Code"
                helperText="Unique short code for identification"
                error={errors.code?.message}
                {...register('code')}
              />
            </div>

            {/* Address */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Address Information
              </h4>
              <div className="space-y-4">
                <Input
                  label="Address Line 1"
                  error={errors.address_line1?.message}
                  {...register('address_line1')}
                />
                <Input
                  label="Address Line 2"
                  error={errors.address_line2?.message}
                  {...register('address_line2')}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="City" error={errors.city?.message} {...register('city')} />
                  <Input label="State" error={errors.state?.message} {...register('state')} />
                  <Input
                    label="Postal Code"
                    error={errors.postal_code?.message}
                    {...register('postal_code')}
                  />
                </div>
              </div>
            </div>

            {/* Contact Person */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Primary Contact Person
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Contact Name"
                  error={errors.contact_name?.message}
                  {...register('contact_name')}
                />
                <Input
                  label="Contact Phone"
                  error={errors.contact_phone?.message}
                  {...register('contact_phone')}
                />
                <Input
                  label="Contact Email"
                  type="email"
                  error={errors.contact_email?.message}
                  {...register('contact_email')}
                />
              </div>
            </div>

            {/* Status */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Status"
                requiredIndicator
                error={errors.status?.message}
                {...register('status')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/societies/${id}`)}
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

export default EditSocietyPage;
