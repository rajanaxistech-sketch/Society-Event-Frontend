import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { personsService } from '../../api/personsService';
import { blocksService } from '../../api/blocksService';
import { floorsService } from '../../api/floorsService';
import { flatsService } from '../../api/flatsService';
import { bungalowsService } from '../../api/bungalowsService';
import { BlockItem, FloorItem, FlatItem, BungalowItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Switch from '../../components/ui/Switch';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, Users, Home, Building2 } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId } from '../../utils/idObfuscator';
import { isValidEmail, isValidPhone } from '../../utils/validators';

const createResidentSchema = z
  .object({
    unit_type: z.enum(['flat', 'bungalow']),
    block_id: z.string().optional(),
    floor_id: z.string().optional(),
    flat_id: z.string().optional(),
    bungalow_id: z.string().optional(),
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
    is_primary_owner: z.boolean(),
    status: z.enum(['active', 'inactive']),
  })
  .superRefine((data, ctx) => {
    if (data.unit_type === 'flat') {
      if (!data.block_id || !data.block_id.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a block',
          path: ['block_id'],
        });
      }
      if (!data.floor_id || !data.floor_id.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a floor',
          path: ['floor_id'],
        });
      }
      if (!data.flat_id || !data.flat_id.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a flat number',
          path: ['flat_id'],
        });
      }
    } else {
      if (!data.bungalow_id || !data.bungalow_id.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please select a bungalow',
          path: ['bungalow_id'],
        });
      }
    }
  });

type CreateResidentFormData = z.infer<typeof createResidentSchema>;

export const CreateResidentPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [bungalows, setBungalows] = useState<BungalowItem[]>([]);

  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const [selectedFloorId, setSelectedFloorId] = useState<string>('');
  const [selectedFlatId, setSelectedFlatId] = useState<string>('');

  const [isLoadingFloors, setIsLoadingFloors] = useState(false);
  const [isLoadingFlats, setIsLoadingFlats] = useState(false);

  const [unitType, setUnitType] = useState<'flat' | 'bungalow'>('flat');
  const [isPrimaryOwner, setIsPrimaryOwner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<CreateResidentFormData>({
    resolver: zodResolver(createResidentSchema),
    mode: 'onBlur',
    defaultValues: {
      unit_type: 'flat',
      block_id: '',
      floor_id: '',
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

  // Load initial blocks and bungalows
  useEffect(() => {
    blocksService.getAll({ limit: 200 }).then((res) => {
      if (res.success && res.data) setBlocks(res.data);
    });
    bungalowsService.getAll({ limit: 200 }).then((res) => {
      if (res.success && res.data) setBungalows(res.data);
    });
  }, []);

  // When Block changes, load Floors
  useEffect(() => {
    if (!selectedBlockId) {
      setFloors([]);
      setSelectedFloorId('');
      setFlats([]);
      setSelectedFlatId('');
      return;
    }

    setIsLoadingFloors(true);
    floorsService
      .getAll({ blockId: selectedBlockId, limit: 100 })
      .then((res) => {
        if (res.success && res.data) {
          setFloors(res.data.sort((a, b) => (a.floor_number ?? 0) - (b.floor_number ?? 0)));
        } else {
          setFloors([]);
        }
      })
      .catch(() => setFloors([]))
      .finally(() => setIsLoadingFloors(false));
  }, [selectedBlockId]);

  // When Floor changes, load Flats
  useEffect(() => {
    if (!selectedFloorId) {
      setFlats([]);
      setSelectedFlatId('');
      return;
    }

    setIsLoadingFlats(true);
    flatsService
      .getAll({ floorId: selectedFloorId, limit: 200 })
      .then((res) => {
        if (res.success && res.data) {
          setFlats(res.data.sort((a, b) => a.flat_number.localeCompare(b.flat_number, undefined, { numeric: true })));
        } else {
          setFlats([]);
        }
      })
      .catch(() => setFlats([]))
      .finally(() => setIsLoadingFlats(false));
  }, [selectedFloorId]);

  const handleBlockChange = (blockId: string) => {
    setSelectedBlockId(blockId);
    setValue('block_id', blockId, { shouldValidate: true });

    setSelectedFloorId('');
    setValue('floor_id', '', { shouldValidate: false });

    setSelectedFlatId('');
    setValue('flat_id', '', { shouldValidate: false });
  };

  const handleFloorChange = (floorId: string) => {
    setSelectedFloorId(floorId);
    setValue('floor_id', floorId, { shouldValidate: true });

    setSelectedFlatId('');
    setValue('flat_id', '', { shouldValidate: false });
  };

  const handleFlatChange = (flatId: string) => {
    setSelectedFlatId(flatId);
    setValue('flat_id', flatId, { shouldValidate: true });
  };

  const onSubmit = async (data: CreateResidentFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        flat_id: unitType === 'flat' ? data.flat_id : null,
        bungalow_id: unitType === 'bungalow' ? data.bungalow_id : null,
        full_name: data.full_name.trim(),
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        relationship_to_owner: data.relationship_to_owner?.trim() || null,
        is_primary_owner: isPrimaryOwner,
        status: data.status,
      };

      const res = await personsService.create(payload);
      if (res.success && res.data) {
        toast.success(`Resident "${data.full_name}" registered successfully.`);
        navigate(`/residents/${encodeId(res.data.id)}`);
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
    <div className="max-w-3xl mx-auto space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.RESIDENTS)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Register Resident</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Link a person to either a Flat or Bungalow unit in the community.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Resident Profile & Unit Assignment</span>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Unit Type Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Property Unit Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setUnitType('flat');
                    setValue('unit_type', 'flat');
                    setValue('bungalow_id', '');
                    trigger();
                  }}
                  className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                    unitType === 'flat'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Home className={`w-4 h-4 ${unitType === 'flat' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Apartment Flat</span>
                    <span className="text-[10px] text-slate-500">Tower / Block unit</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setUnitType('bungalow');
                    setValue('unit_type', 'bungalow');
                    setValue('block_id', '');
                    setValue('floor_id', '');
                    setValue('flat_id', '');
                    trigger();
                  }}
                  className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all text-left cursor-pointer ${
                    unitType === 'bungalow'
                      ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Building2 className={`w-4 h-4 ${unitType === 'bungalow' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Bungalow / Villa</span>
                    <span className="text-[10px] text-slate-500">Independent house</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 3-Step Cascading Dropdowns: Block -> Floor -> Flat */}
            {unitType === 'flat' ? (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Assigned Property Location
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Block Dropdown */}
                  <Select
                    label="1. Block"
                    requiredIndicator
                    placeholder="-- Select Block --"
                    error={errors.block_id?.message}
                    value={selectedBlockId}
                    onChange={(e) => handleBlockChange(e.target.value)}
                    options={blocks.map((b) => ({
                      label: b.society?.name ? `${b.name} (${b.society.name})` : b.name,
                      value: b.id,
                    }))}
                  />

                  {/* 2. Floor Dropdown (Dynamic based on selected Block) */}
                  <Select
                    label="2. Floor"
                    requiredIndicator
                    placeholder={
                      isLoadingFloors
                        ? 'Loading floors...'
                        : selectedBlockId
                        ? '-- Select Floor --'
                        : '-- Choose Block First --'
                    }
                    error={errors.floor_id?.message}
                    disabled={!selectedBlockId || isLoadingFloors || floors.length === 0}
                    value={selectedFloorId}
                    onChange={(e) => handleFloorChange(e.target.value)}
                    options={floors.map((f) => ({
                      label: f.name || `Floor ${f.floor_number}`,
                      value: f.id,
                    }))}
                  />

                  {/* 3. Flat Number Dropdown (Dynamic based on selected Floor) */}
                  <Select
                    label="3. Flat Number"
                    requiredIndicator
                    placeholder={
                      isLoadingFlats
                        ? 'Loading flats...'
                        : selectedFloorId
                        ? '-- Select Flat --'
                        : '-- Choose Floor First --'
                    }
                    error={errors.flat_id?.message}
                    disabled={!selectedFloorId || isLoadingFlats || flats.length === 0}
                    value={selectedFlatId}
                    onChange={(e) => handleFlatChange(e.target.value)}
                    options={flats.map((flat) => ({
                      label: `Flat ${flat.flat_number}${flat.flat_type ? ` (${flat.flat_type})` : ''}`,
                      value: flat.id,
                    }))}
                  />
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Assigned Bungalow Location
                </div>
                <Select
                  label="Select Bungalow / Villa"
                  requiredIndicator
                  placeholder="-- Choose Bungalow --"
                  error={errors.bungalow_id?.message}
                  {...register('bungalow_id', {
                    onChange: () => trigger('bungalow_id'),
                  })}
                  options={bungalows.map((b) => ({
                    label: `Bungalow ${b.bungalow_number}${b.bungalow_type ? ` (${b.bungalow_type})` : ''}`,
                    value: b.id,
                  }))}
                />
              </div>
            )}

            {/* Personal Details */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Vikramaditya Sharma"
                requiredIndicator
                error={errors.full_name?.message}
                {...register('full_name', {
                  onBlur: () => trigger('full_name'),
                })}
              />

              <Input
                label="Relationship to Owner"
                placeholder="e.g. Self / Owner, Spouse, Tenant, Child"
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
            </div>

            {/* Primary Owner Toggle & Status */}
            <div className="pt-2 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
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
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
              />
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
