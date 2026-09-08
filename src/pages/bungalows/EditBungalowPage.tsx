import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { bungalowsService } from '../../api/bungalowsService';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';

const editBungalowSchema = z.object({
  bungalow_number: z.string().min(1, 'Bungalow number is required'),
  bungalow_type: z.string().max(80, 'Max 80 characters').optional(),
  status: z.enum(['active', 'inactive']),
});

type EditBungalowFormData = z.infer<typeof editBungalowSchema>;

export const EditBungalowPage: React.FC = () => {
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
  } = useForm<EditBungalowFormData>({
    resolver: zodResolver(editBungalowSchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchBungalow = async () => {
      try {
        setIsLoading(true);
        const res = await bungalowsService.getById(id);
        if (res.success && res.data) {
          const b = res.data;
          reset({
            bungalow_number: b.bungalow_number,
            bungalow_type: b.bungalow_type || '',
            status: (b.status as 'active' | 'inactive') || 'active',
          });
        } else {
          setError(res.message || 'Bungalow not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load bungalow');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBungalow();
  }, [id, reset]);

  const onSubmit = async (data: EditBungalowFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await bungalowsService.update(id, data);
      if (res.success) {
        toast.success(`Bungalow "${data.bungalow_number}" updated successfully.`);
        navigate(`/bungalows/${encodeId(id)}`);
      } else {
        toast.error(res.message || 'Failed to update bungalow');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update bungalow'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading bungalow details..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3 sm:space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/bungalows/${encodeId(id)}`)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Edit Bungalow</h1>
          <p className="text-[11px] text-slate-500">
            Modify bungalow identifier number, configuration, or status.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Bungalow Information</span>
            </div>
          }
        >
          <div className="space-y-2.5">
            <Input
              label="Bungalow / Villa Number"
              requiredIndicator
              error={errors.bungalow_number?.message}
              {...register('bungalow_number')}
            />

            <Input
              label="Bungalow Type / Configuration"
              placeholder="e.g. 3BHK Villa, 4BHK Duplex"
              error={errors.bungalow_type?.message}
              {...register('bungalow_type')}
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
                onClick={() => navigate(`/bungalows/${encodeId(id)}`)}
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

export default EditBungalowPage;
