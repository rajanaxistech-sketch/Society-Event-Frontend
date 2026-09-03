import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { blocksService } from '../../api/blocksService';
import { societiesService } from '../../api/societiesService';
import { SocietyItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, Layers } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

const createBlockSchema = z.object({
  society_id: z.string().min(1, 'Please select a society'),
  name: z.string().min(1, 'Block name is required'),
  code: z.string().max(50, 'Code must be max 50 characters').optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
});

type CreateBlockFormData = z.infer<typeof createBlockSchema>;

export const CreateBlockPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    societiesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setSocieties(res.data);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateBlockFormData>({
    resolver: zodResolver(createBlockSchema),
    defaultValues: {
      society_id: '',
      name: '',
      code: '',
      description: '',
      status: 'active',
    },
  });

  const onSubmit = async (data: CreateBlockFormData) => {
    try {
      setIsSubmitting(true);
      const res = await blocksService.create(data);
      if (res.success) {
        toast.success(`Block "${data.name}" created successfully.`);
        navigate(AppRoutes.BLOCKS);
      } else {
        toast.error(res.message || 'Failed to create block');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create block'));
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
          onClick={() => navigate(AppRoutes.BLOCKS)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Block</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add a new tower, wing, or residential block to a society.
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
            <Select
              label="Society"
              requiredIndicator
              error={errors.society_id?.message}
              placeholder="-- Select Society --"
              {...register('society_id')}
            >
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>

            <Input
              label="Block / Wing Name"
              placeholder="e.g. Wing A, Tower 1, Block East"
              requiredIndicator
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="Block Code"
              placeholder="e.g. BLK-A"
              error={errors.code?.message}
              {...register('code')}
            />

            <Textarea
              label="Description"
              placeholder="Optional notes regarding this block..."
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
                Create Block
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateBlockPage;
