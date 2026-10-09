import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { vendorsService } from '../../api/vendorsService';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Switch from '../../components/ui/Switch';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Store } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

const phoneRegex = /^[+0-9\s-]{7,20}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const vendorEditSchema = z.object({
  vendorName: z
    .string()
    .trim()
    .min(1, 'Vendor Name is required')
    .max(200, 'Vendor Name cannot exceed 200 characters'),
  shortName: z
    .string()
    .trim()
    .max(100, 'Short Name cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  companyName: z
    .string()
    .trim()
    .max(200, 'Company Name cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || emailRegex.test(val), {
      message: 'Invalid email address format (e.g. name@domain.com)',
    }),
  mobileNo: z
    .string()
    .trim()
    .min(1, 'Contact Number is required')
    .min(7, 'Contact Number must be at least 7 digits')
    .max(20, 'Contact Number cannot exceed 20 digits')
    .regex(phoneRegex, 'Invalid phone format (digits, +, - allowed)'),
  isActive: z.boolean(),
});

type VendorEditFormData = z.infer<typeof vendorEditSchema>;

export const EditVendorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VendorEditFormData>({
    resolver: zodResolver(vendorEditSchema),
    mode: 'onChange',
    defaultValues: {
      vendorName: '',
      shortName: '',
      companyName: '',
      email: '',
      mobileNo: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  const fetchVendor = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await vendorsService.getById(id);
      if (res.success && res.data) {
        const v = res.data;
        const active = v.isActive ?? v.is_active ?? (v.status === 'active');
        reset({
          vendorName: v.vendorName || v.vendor_name || '',
          shortName: v.shortName || v.short_name || '',
          companyName: v.companyName || v.company_name || '',
          email: v.email || '',
          mobileNo: v.mobileNo || v.mobile_no || v.contactNumber || v.contact_number || '',
          isActive: active,
        });
      } else {
        setError(res.message || 'Vendor not found');
      }
    } catch (err: any) {
      setError(extractErrorMessage(err, 'Failed to load vendor details'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [id]);

  const onSubmit = async (data: VendorEditFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await vendorsService.update(id, {
        vendorName: data.vendorName.trim(),
        shortName: data.shortName?.trim() || null,
        companyName: data.companyName?.trim() || null,
        email: data.email?.trim().toLowerCase() || null,
        mobileNo: data.mobileNo.trim(),
        isActive: data.isActive,
        status: data.isActive ? 'active' : 'inactive',
      });

      if (res.success) {
        toast.success(`Vendor "${data.vendorName}" updated successfully.`);
        navigate(AppRoutes.VENDORS);
      } else {
        toast.error(res.message || 'Failed to update vendor');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update vendor'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading vendor information..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchVendor} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.VENDORS)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Edit Vendor</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Update vendor credentials. Required fields are marked with a red asterisk (<span className="text-rose-500 font-bold">*</span>).
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-900 text-sm">Edit Vendor Details</span>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Row 1: Required Fields (Vendor Name & Contact Number) with red * indicator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Vendor Name"
                requiredIndicator={true}
                placeholder="e.g. Acme Event Decorators"
                error={errors.vendorName?.message}
                {...register('vendorName')}
              />

              <Input
                label="Contact Number"
                requiredIndicator={true}
                type="tel"
                placeholder="e.g. +91 9876543210"
                error={errors.mobileNo?.message}
                {...register('mobileNo')}
              />
            </div>

            {/* Row 2: Optional Info (Company Name & Short Name) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Company Name"
                helperText="Optional"
                placeholder="e.g. Acme Solutions Pvt Ltd"
                error={errors.companyName?.message}
                {...register('companyName')}
              />

              <Input
                label="Vendor Short Name"
                helperText="Optional"
                placeholder="e.g. ACME"
                error={errors.shortName?.message}
                {...register('shortName')}
              />
            </div>

            {/* Row 3: Optional Email Address */}
            <div>
              <Input
                label="Email Address"
                type="email"
                helperText="Optional (valid email format)"
                placeholder="e.g. info@acmedecorators.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {/* Row 4: Active Status Toggle */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-slate-900 block">Active Status</span>
                <span className="text-[11px] text-slate-500">
                  Enable or disable this vendor for new assignments
                </span>
              </div>
              <Switch
                checked={isActive}
                onChange={(val) => setValue('isActive', val)}
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(AppRoutes.VENDORS)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-3.5 h-3.5" />}
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

export default EditVendorPage;
