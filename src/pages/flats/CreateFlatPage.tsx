import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { flatsService } from '../../api/flatsService';
import { floorsService } from '../../api/floorsService';
import { FloorItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, Home } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId } from '../../utils/idObfuscator';

const createFlatSchema = z.object({
  floor_id: z.string().min(1, 'Please select a floor'),
  flat_number: z.string().min(1, 'Flat number is required'),
  flat_type: z.string().max(80, 'Flat type max 80 chars').optional(),
  status: z.enum(['active', 'inactive']),
});

type CreateFlatFormData = z.infer<typeof createFlatSchema>;

export const CreateFlatPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    floorsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setFloors(res.data);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFlatFormData>({
    resolver: zodResolver(createFlatSchema),
    defaultValues: {
      floor_id: '',
      flat_number: '',
      flat_type: '2BHK',
      status: 'active',
    },
  });

  const onSubmit = async (data: CreateFlatFormData) => {
    try {
      setIsSubmitting(true);
      const res = await flatsService.create(data);
      if (res.success && res.data) {
        toast.success(`Flat "${data.flat_number}" created successfully.`);
        navigate(`/flats/${encodeId(res.data.id)}`);
      } else {
        toast.error(res.message || 'Failed to create flat');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create flat'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-3 sm:space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.FLATS)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Create Flat</h1>
          <p className="text-[11px] text-slate-500">
            Register an apartment unit under a specific floor and block.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-1.5">
              <Home className="w-4 h-4 text-indigo-600" />
              <span>Flat Information</span>
            </div>
          }
        >
          <div className="space-y-2.5">
            <Select
              label="Floor Level"
              requiredIndicator
              error={errors.floor_id?.message}
              placeholder="-- Select Floor --"
              {...register('floor_id')}
            >
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.block?.name || 'Block'} &bull; Floor {f.floor_number} {f.name ? `(${f.name})` : ''}
                </option>
              ))}
            </Select>

            <Input
              label="Flat / Unit Number"
              placeholder="e.g. 101, A-402, 1204"
              requiredIndicator
              error={errors.flat_number?.message}
              {...register('flat_number')}
            />

            <Input
              label="Flat Type / Configuration (Optional)"
              placeholder="e.g. 1BHK, 2BHK, 3BHK, Duplex"
              error={errors.flat_type?.message}
              {...register('flat_type')}
            />

            <Select
              label="Status"
              requiredIndicator
              error={errors.status?.message}
              {...register('status')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>

            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate(AppRoutes.FLATS)}
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
                Create Flat
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateFlatPage;
