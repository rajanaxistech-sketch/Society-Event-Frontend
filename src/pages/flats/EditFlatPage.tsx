import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { flatsService } from '../../api/flatsService';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Home } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';

const editFlatSchema = z.object({
  flat_number: z.string().min(1, 'Flat number is required'),
  flat_type: z.string().max(80, 'Flat type max 80 chars').optional(),
  status: z.enum(['active', 'inactive']),
});

type EditFlatFormData = z.infer<typeof editFlatSchema>;

export const EditFlatPage: React.FC = () => {
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
  } = useForm<EditFlatFormData>({
    resolver: zodResolver(editFlatSchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchFlat = async () => {
      try {
        setIsLoading(true);
        const res = await flatsService.getById(id);
        if (res.success && res.data) {
          const f = res.data;
          reset({
            flat_number: f.flat_number,
            flat_type: f.flat_type || '',
            status: (f.status as 'active' | 'inactive') || 'active',
          });
        } else {
          setError(res.message || 'Flat not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load flat');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlat();
  }, [id, reset]);

  const onSubmit = async (data: EditFlatFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await flatsService.update(id, data);
      if (res.success) {
        toast.success(`Flat "${data.flat_number}" updated successfully.`);
        navigate(`/flats/${encodeId(id)}`);
      } else {
        toast.error(res.message || 'Failed to update flat');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update flat'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading flat details..." />
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
          onClick={() => navigate(`/flats/${encodeId(id)}`)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Flat</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify flat identification number, apartment type, or status.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-indigo-600" />
              <span>Flat Information</span>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Flat / Unit Number"
              requiredIndicator
              error={errors.flat_number?.message}
              {...register('flat_number')}
            />

            <Input
              label="Flat Type / Configuration"
              placeholder="e.g. 1BHK, 2BHK, 3BHK"
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

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/flats/${encodeId(id)}`)}
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

export default EditFlatPage;
