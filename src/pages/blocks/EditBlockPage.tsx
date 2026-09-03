import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { blocksService } from '../../api/blocksService';
import { BlockItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Layers } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { decodeId } from '../../utils/idObfuscator';

const editBlockSchema = z.object({
  name: z.string().min(1, 'Block name is required'),
  code: z.string().max(50, 'Code must be max 50 characters').optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type EditBlockFormData = z.infer<typeof editBlockSchema>;

export const EditBlockPage: React.FC = () => {
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
  } = useForm<EditBlockFormData>({
    resolver: zodResolver(editBlockSchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchBlock = async () => {
      try {
        setIsLoading(true);
        const res = await blocksService.getById(id);
        if (res.success && res.data) {
          const b = res.data;
          reset({
            name: b.name,
            code: b.code || '',
            description: b.description || '',
            status: (b.status as 'active' | 'inactive') || 'active',
          });
        } else {
          setError(res.message || 'Block not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load block');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlock();
  }, [id, reset]);

  const onSubmit = async (data: EditBlockFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const res = await blocksService.update(id, data);
      if (res.success) {
        toast.success(`Block "${data.name}" updated successfully.`);
        navigate(AppRoutes.BLOCKS);
      } else {
        toast.error(res.message || 'Failed to update block');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update block'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading block..." />
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
          onClick={() => navigate(AppRoutes.BLOCKS)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Block</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Modify block identification, name, or description.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              <span>Block Details</span>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Block / Wing Name"
              requiredIndicator
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Block Code"
              error={errors.code?.message}
              {...register('code')}
            />

            <Textarea
              label="Description"
              rows={3}
              error={errors.description?.message}
              {...register('description')}
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
                onClick={() => navigate(AppRoutes.BLOCKS)}
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

export default EditBlockPage;
