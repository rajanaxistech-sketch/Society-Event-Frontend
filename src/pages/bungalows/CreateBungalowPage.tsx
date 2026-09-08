import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { bungalowsService } from '../../api/bungalowsService';
import { societiesService } from '../../api/societiesService';
import { SocietyItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId } from '../../utils/idObfuscator';

const createBungalowSchema = z.object({
  society_id: z.string().min(1, 'Please select a society'),
  bungalow_number: z.string().min(1, 'Bungalow number is required'),
  bungalow_type: z.string().max(80, 'Max 80 characters').optional(),
  status: z.enum(['active', 'inactive']),
});

type CreateBungalowFormData = z.infer<typeof createBungalowSchema>;

export const CreateBungalowPage: React.FC = () => {
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
  } = useForm<CreateBungalowFormData>({
    resolver: zodResolver(createBungalowSchema),
    defaultValues: {
      society_id: '',
      bungalow_number: '',
      bungalow_type: 'Villa',
      status: 'active',
    },
  });

  const onSubmit = async (data: CreateBungalowFormData) => {
    try {
      setIsSubmitting(true);
      const res = await bungalowsService.create(data);
      if (res.success && res.data) {
        toast.success(`Bungalow "${data.bungalow_number}" created successfully.`);
        navigate(`/bungalows/${encodeId(res.data.id)}`);
      } else {
        toast.error(res.message || 'Failed to create bungalow');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create bungalow'));
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
          onClick={() => navigate(AppRoutes.BUNGALOWS)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Create Bungalow</h1>
          <p className="text-[11px] text-slate-500">
            Add a standalone bungalow or villa unit to a society.
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
              label="Bungalow / Villa Number"
              placeholder="e.g. B-12, Villa 4, Row House 10"
              requiredIndicator
              error={errors.bungalow_number?.message}
              {...register('bungalow_number')}
            />

            <Input
              label="Bungalow Type / Configuration (Optional)"
              placeholder="e.g. 3BHK Villa, 4BHK Duplex, Penthouse"
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
                onClick={() => navigate(AppRoutes.BUNGALOWS)}
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
                Create Bungalow
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default CreateBungalowPage;
