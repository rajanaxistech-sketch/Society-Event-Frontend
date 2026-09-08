import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usersService } from '../../api/usersService';
import { rolesService } from '../../api/rolesService';
import { societiesService } from '../../api/societiesService';
import { RoleItem, SocietyItem, UserItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, User, Building2 } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';

const editUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().optional(),
  phone: z.string().optional(),
  role_id: z.string().min(1, 'Please select a system role'),
  status: z.enum(['active', 'inactive']),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

export const EditUserPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [selectedSocietyIds, setSelectedSocietyIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchInit = async () => {
      try {
        setIsLoading(true);
        const [uRes, rRes, sRes] = await Promise.all([
          usersService.getById(id),
          rolesService.getAll({ limit: 100 }).catch(() => ({ success: true, data: [] })),
          societiesService.getAll({ limit: 100 }).catch(() => ({ success: true, data: [] })),
        ]);

        if (rRes.data) setRoles(rRes.data);
        if (sRes.data) setSocieties(sRes.data);

        if (uRes.success && uRes.data) {
          const u = uRes.data;
          const assignedSoc = u.user_societies?.map((us) => us.society_id) || [];
          setSelectedSocietyIds(assignedSoc);
          const currentRoleId = u.roles?.[0]?.id || u.user_roles?.[0]?.role_id || '';

          reset({
            full_name: u.full_name,
            email: u.email,
            password: '',
            phone: u.phone || '',
            role_id: currentRoleId,
            status: (u.status as any) || 'active',
          });
        } else {
          setError(uRes.message || 'User not found');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load user for editing');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInit();
  }, [id, reset]);

  const toggleSociety = (socId: string) => {
    setSelectedSocietyIds((prev) =>
      prev.includes(socId) ? prev.filter((i) => i !== socId) : [...prev, socId]
    );
  };

  const onSubmit = async (data: EditUserFormData) => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const payload = {
        ...data,
        password: data.password || undefined,
        society_ids: selectedSocietyIds,
      };

      const res = await usersService.update(id, payload);
      if (res.success) {
        toast.success(`User "${data.full_name}" updated successfully.`);
        navigate(`/users/${encodeId(id)}`);
      } else {
        toast.error(res.message || 'Failed to update user');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update user profile'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading user details..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-3 sm:space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/users/${encodeId(id)}`)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Edit User Account</h1>
          <p className="text-[11px] text-slate-500">
            Modify profile details, security role, and assigned society scope.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-3.5">
        <Card
          title={
            <div className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-indigo-600" />
              <span>User Profile & Security Role</span>
            </div>
          }
        >
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <Input
                label="Full Name"
                requiredIndicator
                error={errors.full_name?.message}
                {...register('full_name')}
              />

              <Input
                label="Email Address"
                type="email"
                requiredIndicator
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <Input
                label="Reset Password (Optional)"
                type="password"
                placeholder="Leave blank to keep existing password"
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Phone Number"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              <Select
                label="Security Role"
                requiredIndicator
                error={errors.role_id?.message}
                {...register('role_id')}
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Account Status"
                requiredIndicator
                error={errors.status?.message}
                {...register('status')}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>
        </Card>

        {/* Society Scope */}
        <Card
          title={
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Assigned Society Scope</span>
            </div>
          }
          subtitle="Select societies this user can view and manage."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {societies.map((s) => {
              const checked = selectedSocietyIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleSociety(s.id)}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
                    checked
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span className="text-xs">{s.name}</span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
              );
            })}
          </div>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(`/users/${encodeId(id)}`)}
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
      </form>
    </div>
  );
};

export default EditUserPage;
