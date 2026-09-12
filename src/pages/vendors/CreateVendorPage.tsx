import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { vendorsService } from '../../api/vendorsService';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Switch from '../../components/ui/Switch';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, Store, CheckCircle2 } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

const vendorFormSchema = z.object({
  vendorName: z.string().trim().min(1, 'Vendor Name is required').max(200, 'Vendor Name cannot exceed 200 characters'),
  shortName: z.string().trim().min(1, 'Short Name is required').max(100, 'Short Name cannot exceed 100 characters'),
  address: z.string().trim().min(1, 'Address is required'),
  email: z.string().trim().min(1, 'Email address is required').email('Please enter a valid email address').toLowerCase(),
  mobileNo: z.string().trim().min(1, 'Mobile Number is required').regex(/^[+0-9\s-]{7,20}$/, 'Please enter a valid phone number (7-20 digits)'),
  isActive: z.boolean(),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

export const CreateVendorPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      vendorName: '',
      shortName: '',
      address: '',
      email: '',
      mobileNo: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  const onSubmit = async (data: VendorFormData) => {
    try {
      setIsSubmitting(true);
      const res = await vendorsService.create({
        vendorName: data.vendorName.trim(),
        shortName: data.shortName.trim(),
        address: data.address.trim(),
        email: data.email.trim().toLowerCase(),
        mobileNo: data.mobileNo.trim(),
        isActive: data.isActive,
      });

      if (res.success) {
        toast.success(`Vendor "${data.vendorName}" registered successfully.`);
        navigate(AppRoutes.VENDORS);
      } else {
        toast.error(res.message || 'Failed to create vendor');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create vendor'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.VENDORS)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Create Vendor</h1>
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Setting Master
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Register a new authorized agency, contractor, or supplier in Setting Master.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              <span>Vendor Information</span>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Row 1: Vendor Name & Short Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Vendor Name"
                placeholder="e.g. ABC Metals Pvt Ltd"
                requiredIndicator
                error={errors.vendorName?.message}
                {...register('vendorName')}
              />

              <Input
                label="Short Name"
                placeholder="e.g. ABC"
                requiredIndicator
                error={errors.shortName?.message}
                {...register('shortName')}
              />
            </div>

            {/* Row 2: Address (Full Width Textarea) */}
            <div>
              <Textarea
                label="Address"
                placeholder="e.g. Plot 42, Industrial Area, Andheri East, Mumbai"
                rows={3}
                requiredIndicator
                error={errors.address?.message}
                {...register('address')}
              />
            </div>

            {/* Row 3: Email & Mobile No */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                placeholder="e.g. contact@abcmetals.com"
                requiredIndicator
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Mobile No"
                type="tel"
                placeholder="e.g. 9876543210"
                requiredIndicator
                error={errors.mobileNo?.message}
                {...register('mobileNo')}
              />
            </div>

            {/* Row 4: Is Active Toggle */}
            <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-slate-900 block">Is Active</span>
                <span className="text-[11px] text-slate-500">
                  Enable vendor for event contracts, procurement, and payment operations
                </span>
              </div>
              <Switch
                checked={isActive}
                onChange={(val) => setValue('isActive', val)}
              />
            </div>

            {/* Footer Action Buttons */}
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
                Create Record
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateVendorPage;
