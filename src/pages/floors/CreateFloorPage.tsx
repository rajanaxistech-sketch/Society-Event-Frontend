import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { floorsService } from '../../api/floorsService';
import { blocksService } from '../../api/blocksService';
import { BlockItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, Grid } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

const createFloorSchema = z.object({
  block_id: z.string().min(1, 'Please select a block'),
  floor_number: z.coerce.number().int('Floor number must be an integer'),
  name: z.string().max(100, 'Name must be max 100 characters').optional(),
  status: z.enum(['active', 'inactive']),
});

type CreateFloorFormData = z.infer<typeof createFloorSchema>;

export const CreateFloorPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    blocksService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setBlocks(res.data);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateFloorFormData>({
    resolver: zodResolver(createFloorSchema),
    defaultValues: {
      block_id: '',
      floor_number: 1,
      name: '',
      status: 'active',
    },
  });

  const onSubmit = async (data: CreateFloorFormData) => {
    try {
      setIsSubmitting(true);
      const res = await floorsService.create(data);
      if (res.success) {
        toast.success(`Floor "${data.floor_number}" created successfully.`);
        navigate(AppRoutes.FLOORS);
      } else {
        toast.error(res.message || 'Failed to create floor');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create floor'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.FLOORS)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Floor</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add a floor level to an existing building block.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-indigo-600" />
              <span>Floor Information</span>
            </div>
          }
        >
          <div className="space-y-4">
            <Select
              label="Block / Wing"
              requiredIndicator
              error={errors.block_id?.message}
              placeholder="-- Select Block --"
              {...register('block_id')}
            >
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} {b.society?.name ? `(${b.society.name})` : ''}
                </option>
              ))}
            </Select>

            <Input
              label="Floor Number"
              type="number"
              placeholder="e.g. 1, 2, 3 (use 0 for Ground)"
              requiredIndicator
              error={errors.floor_number?.message}
              {...register('floor_number')}
            />

            <Input
              label="Floor Name / Label (Optional)"
              placeholder="e.g. Ground Floor, Penthouse Level"
              error={errors.name?.message}
              {...register('name')}
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

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(AppRoutes.FLOORS)}
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
                Create Floor
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateFloorPage;
