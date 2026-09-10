import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { personsService } from '../../api/personsService';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import { isValidEmail, isValidPhone } from '../../utils/validators';

const editResidentSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Full name is required')
    .min(2, 'Full name must be at least 2 characters'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || isValidPhone(val), {
      message: 'Invalid phone number (must be 7 to 15 digits, e.g. +91 9876543210)',
    }),
  email: z
    .string()
    .optional()
    .refine((val) => !val || isValidEmail(val), {
      message: 'Invalid email address format (e.g. resident@example.com)',
    }),
  relationship_to_owner: z.string().max(80, 'Max 80 characters').optional(),
  status: z.enum(['active', 'inactive']),
});

type EditResidentFormData = z.infer<typeof editResidentSchema>;

export const EditResidentPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrimaryOwner, setIsPrimaryOwner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    trigger,
    formState: { errors },
  } = useForm<EditResidentFormData>({
    resolver: zodResolver(editResidentSchema),
    mode: 'onBlur',
  });

  useEffect(() => {
    if (!id) return;
    const fetchResident = async () => {
      try {
        setIsLoading(true);
        const res = await personsService.getById(id);
        if (res.success && res.data) {
          const p = res.data;
          setIsPrimaryOwner(p.is_primary_owner || false);
          reset({
            full_name: p.full_name,
            phone: p.phone || '',
            email: p.email || '',
            relationship_to_owner: p.relationship_to_owner || '',
            status: (p.status as 'active' | 'inactive') || 'active',
          });
        } else {
          setError(res.message || 'Resident not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load resident details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResident();
  }, [id, reset]);

  const onSubmit = async (data: EditResidentFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await personsService.update(id, {
        full_name: data.full_name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        relationship_to_owner: data.relationship_to_owner?.trim() || null,
        is_primary_owner: isPrimaryOwner,
        status: data.status,
      });

      if (res.success) {
        toast.success(`Resident "${data.full_name}" updated successfully.`);
        navigate(`/residents/${encodeId(id)}`);
      } else {
        toast.error(res.message || 'Failed to update resident');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update resident'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading resident..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/residents/${encodeId(id)}`)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Edit Resident</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Modify personal contact details and occupancy information.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Resident Profile</span>
            </div>
          }
        >
          <div className="space-y-3.5">
            <Input
              label="Full Name"
              requiredIndicator
              error={errors.full_name?.message}
              {...register('full_name', {
                onBlur: () => trigger('full_name'),
              })}
            />

            <Input
              label="Relationship to Owner"
              placeholder="e.g. Self / Owner, Spouse, Tenant"
              error={errors.relationship_to_owner?.message}
              {...register('relationship_to_owner')}
            />

            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              maxLength={15}
              error={errors.phone?.message}
              {...register('phone', {
                onBlur: () => trigger('phone'),
                onChange: (e) => {
                  const numericVal = e.target.value.replace(/\D/g, '');
                  setValue('phone', numericVal, { shouldValidate: true });
                },
              })}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Delete',
                    'Tab',
                    'Escape',
                    'Enter',
                    'ArrowLeft',
                    'ArrowRight',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  (e.ctrlKey || e.metaKey)
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="resident@example.com"
              error={errors.email?.message}
              {...register('email', {
                onBlur: () => trigger('email'),
                onChange: () => {
                  if (errors.email) trigger('email');
                },
              })}
            />

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <Switch
                label="Primary Owner"
                description="Primary contact person for notices and event contributions."
                checked={isPrimaryOwner}
                onChange={setIsPrimaryOwner}
              />
            </div>

            <Select
              label="Status"
              requiredIndicator
              error={errors.status?.message}
              {...register('status')}
              options={[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
              ]}
            />

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/residents/${encodeId(id)}`)}
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

export default EditResidentPage;
