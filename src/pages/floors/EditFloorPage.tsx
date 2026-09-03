import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { floorsService } from '../../api/floorsService';
import { FloorItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Grid } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { decodeId } from '../../utils/idObfuscator';

const editFloorSchema = z.object({
  floor_number: z.coerce.number().int('Floor number must be an integer'),
  name: z.string().max(100, 'Name must be max 100 characters').optional(),
  status: z.enum(['active', 'inactive']),
});

type EditFloorFormData = z.infer<typeof editFloorSchema>;

export const EditFloorPage: React.FC = () => {
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
  } = useForm<EditFloorFormData>({
    resolver: zodResolver(editFloorSchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchFloor = async () => {
      try {
        setIsLoading(true);
        const res = await floorsService.getById(id);
        if (res.success && res.data) {
          const f = res.data;
          reset({
            floor_number: f.floor_number,
            name: f.name || '',
            status: (f.status as 'active' | 'inactive') || 'active',
          });
        } else {
          setError(res.message || 'Floor not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load floor');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFloor();
  }, [id, reset]);

  const onSubmit = async (data: EditFloorFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await floorsService.update(id, data);
      if (res.success) {
        toast.success(`Floor "${data.floor_number}" updated successfully.`);
        navigate(AppRoutes.FLOORS);
      } else {
        toast.error(res.message || 'Failed to update floor');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update floor'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading floor..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Floor</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update floor number or custom descriptive label.
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
            <Input
              label="Floor Number"
              type="number"
              requiredIndicator
              error={errors.floor_number?.message}
              {...register('floor_number')}
            />

            <Input
              label="Floor Name / Label (Optional)"
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
                Save Changes
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default EditFloorPage;
