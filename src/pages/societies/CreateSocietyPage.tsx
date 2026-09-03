import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { societiesService } from '../../api/societiesService';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId } from '../../utils/idObfuscator';

const createSocietySchema = z.object({
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

type CreateSocietyFormData = z.infer<typeof createSocietySchema>;

export const CreateSocietyPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSocietyFormData>({
    resolver: zodResolver(createSocietySchema),
    defaultValues: {
      name: '',
      code: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      status: 'active',
    },
  });

  const onSubmit = async (data: CreateSocietyFormData) => {
    try {
      setIsSubmitting(true);
      const res = await societiesService.create(data);

      if (res.success && res.data) {
        toast.success(`Society "${res.data.name}" created successfully.`);
        navigate(`/societies/${encodeId(res.data.id)}`);
      } else {
        toast.error(res.message || 'Failed to create society.');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create society.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.SOCIETIES)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create New Society</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Register a new residential society or gated community into the system.
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
                placeholder="e.g. Green Valley Housing Society"
                error={errors.name?.message}
                requiredIndicator
                {...register('name')}
              />
              <Input
                label="Society Code"
                placeholder="e.g. GVHS-01"
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
                  placeholder="Street address, landmark"
                  error={errors.address_line1?.message}
                  {...register('address_line1')}
                />
                <Input
                  label="Address Line 2"
                  placeholder="Area, neighborhood (optional)"
                  error={errors.address_line2?.message}
                  {...register('address_line2')}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="City"
                    placeholder="e.g. Mumbai"
                    error={errors.city?.message}
                    {...register('city')}
                  />
                  <Input
                    label="State"
                    placeholder="e.g. Maharashtra"
                    error={errors.state?.message}
                    {...register('state')}
                  />
                  <Input
                    label="Postal Code"
                    placeholder="e.g. 400053"
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
                  placeholder="e.g. Rajesh Kumar"
                  error={errors.contact_name?.message}
                  {...register('contact_name')}
                />
                <Input
                  label="Contact Phone"
                  placeholder="+91 9876543210"
                  error={errors.contact_phone?.message}
                  {...register('contact_phone')}
                />
                <Input
                  label="Contact Email"
                  type="email"
                  placeholder="admin@greenvalley.com"
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
                onClick={() => navigate(AppRoutes.SOCIETIES)}
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
                Create Society
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateSocietyPage;
