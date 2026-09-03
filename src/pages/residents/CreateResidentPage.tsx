import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { personsService } from '../../api/personsService';
import { flatsService } from '../../api/flatsService';
import { bungalowsService } from '../../api/bungalowsService';
import { FlatItem, BungalowItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, Users, Home, Building2 } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

const createResidentSchema = z.object({
  unit_type: z.enum(['flat', 'bungalow']),
  flat_id: z.string().optional(),
  bungalow_id: z.string().optional(),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  relationship_to_owner: z.string().max(80, 'Max 80 characters').optional(),
  is_primary_owner: z.boolean(),
  status: z.enum(['active', 'inactive']),
}).refine((data) => {
  if (data.unit_type === 'flat') {
    return !!data.flat_id && data.flat_id.trim().length > 0;
  } else {
    return !!data.bungalow_id && data.bungalow_id.trim().length > 0;
  }
}, {
  message: 'Please select a residential unit',
  path: ['unit_type'],
});

type CreateResidentFormData = z.infer<typeof createResidentSchema>;

export const CreateResidentPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [bungalows, setBungalows] = useState<BungalowItem[]>([]);
  const [unitType, setUnitType] = useState<'flat' | 'bungalow'>('flat');
  const [isPrimaryOwner, setIsPrimaryOwner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    flatsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setFlats(res.data);
    });
    bungalowsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setBungalows(res.data);
    });
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateResidentFormData>({
    resolver: zodResolver(createResidentSchema),
    defaultValues: {
      unit_type: 'flat',
      flat_id: '',
      bungalow_id: '',
      full_name: '',
      phone: '',
      email: '',
      relationship_to_owner: '',
      is_primary_owner: false,
      status: 'active',
    },
  });

  const onSubmit = async (data: CreateResidentFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        flat_id: unitType === 'flat' ? data.flat_id : null,
        bungalow_id: unitType === 'bungalow' ? data.bungalow_id : null,
        full_name: data.full_name,
        phone: data.phone || null,
        email: data.email || null,
        relationship_to_owner: data.relationship_to_owner || null,
        is_primary_owner: isPrimaryOwner,
        status: data.status,
      };

      const res = await personsService.create(payload);
      if (res.success && res.data) {
        toast.success(`Resident "${data.full_name}" registered successfully.`);
        navigate(`/residents/${res.data.id}`);
      } else {
        toast.error(res.message || 'Failed to register resident');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to register resident'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.RESIDENTS)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register Resident</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Link a person to either a Flat or Bungalow unit in the community.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <span>Resident Profile & Unit Assignment</span>
            </div>
          }
        >
          <div className="space-y-6">
            {/* Unit Assignment Type Switcher */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2">
                Property Unit Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setUnitType('flat');
                    setValue('unit_type', 'flat');
                    setValue('bungalow_id', '');
                  }}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                    unitType === 'flat'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Home className={`w-5 h-5 ${unitType === 'flat' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Apartment Flat</span>
                    <span className="text-[11px] text-slate-500">Block &rarr; Floor &rarr; Flat</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUnitType('bungalow');
                    setValue('unit_type', 'bungalow');
                    setValue('flat_id', '');
                  }}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all text-left ${
                    unitType === 'bungalow'
                      ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className={`w-5 h-5 ${unitType === 'bungalow' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Bungalow / Villa</span>
                    <span className="text-[11px] text-slate-500">Direct standalone unit</span>
                  </div>
                </button>
              </div>
              {errors.unit_type && (
                <p className="text-xs text-red-600 mt-1.5">{errors.unit_type.message}</p>
              )}
            </div>

            {/* Dynamic Unit Dropdown */}
            {unitType === 'flat' ? (
              <Select
                label="Select Apartment Flat"
                requiredIndicator
                placeholder="-- Choose Flat --"
                error={errors.flat_id?.message}
                {...register('flat_id')}
              >
                {flats.map((f) => (
                  <option key={f.id} value={f.id}>
                    Flat {f.flat_number} ({f.floor?.block?.name || 'Block'}, Floor {f.floor?.floor_number})
                  </option>
                ))}
              </Select>
            ) : (
              <Select
                label="Select Bungalow / Villa"
                requiredIndicator
                placeholder="-- Choose Bungalow --"
                error={errors.bungalow_id?.message}
                {...register('bungalow_id')}
              >
                {bungalows.map((b) => (
                  <option key={b.id} value={b.id}>
                    Bungalow {b.bungalow_number} ({b.society?.name || 'Society'})
                  </option>
                ))}
              </Select>
            )}

            {/* Personal Details */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Vikramaditya Sharma"
                requiredIndicator
                error={errors.full_name?.message}
                {...register('full_name')}
              />

              <Input
                label="Relationship to Owner"
                placeholder="e.g. Self / Owner, Spouse, Tenant, Child"
                error={errors.relationship_to_owner?.message}
                {...register('relationship_to_owner')}
              />

              <Input
                label="Phone Number"
                placeholder="+91 9876543210"
                error={errors.phone?.message}
                {...register('phone')}
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="resident@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            {/* Primary Owner Toggle & Status */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <Switch
                  label="Designate as Primary Owner"
                  description="Primary recipient of society notices and collection receipts."
                  checked={isPrimaryOwner}
                  onChange={setIsPrimaryOwner}
                />
              </div>

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
                onClick={() => navigate(AppRoutes.RESIDENTS)}
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
                Register Resident
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateResidentPage;
