import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { usersService } from '../../api/usersService';
import { rolesService } from '../../api/rolesService';
import { societiesService } from '../../api/societiesService';
import { RoleItem, SocietyItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, UserPlus, Shield, Building2 } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

const createUserSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  role_id: z.string().min(1, 'Please select a system role'),
  status: z.enum(['active', 'inactive']),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export const CreateUserPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [selectedSocietyIds, setSelectedSocietyIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    rolesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setRoles(res.data);
    });
    societiesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setSocieties(res.data);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      phone: '',
      role_id: '',
      status: 'active',
    },
  });

  const toggleSociety = (socId: string) => {
    setSelectedSocietyIds((prev) =>
      prev.includes(socId) ? prev.filter((id) => id !== socId) : [...prev, socId]
    );
  };

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      setIsSubmitting(true);
      const res = await usersService.create({
        ...data,
        society_ids: selectedSocietyIds,
      });

      if (res.success && res.data) {
        toast.success(`User "${data.full_name}" registered successfully.`);
        navigate(`/users/${res.data.id}`);
      } else {
        toast.error(res.message || 'Failed to create user');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create user'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.USERS)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create User Account</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Provision access credentials, role permissions, and assigned society scope.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <span>User Profile & Credentials</span>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Ramesh Chandra"
                requiredIndicator
                error={errors.full_name?.message}
                {...register('full_name')}
              />

              <Input
                label="Email Address (Login ID)"
                type="email"
                placeholder="ramesh@example.com"
                requiredIndicator
                error={errors.email?.message}
                {...register('email')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                requiredIndicator
                error={errors.password?.message}
                {...register('password')}
              />

              <Input
                label="Phone Number"
                placeholder="+91 9876543210"
                error={errors.phone?.message}
                {...register('phone')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Select
                label="Security Role"
                requiredIndicator
                error={errors.role_id?.message}
                placeholder="-- Select Role --"
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

        {/* Assigned Societies Scope */}
        <Card
          title={
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <span>Assigned Societies Scope (Optional)</span>
            </div>
          }
          subtitle="Grant management access to specific societies. Leave empty for global access."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {societies.map((s) => {
              const checked = selectedSocietyIds.includes(s.id);
              return (
                <div
                  key={s.id}
                  onClick={() => toggleSociety(s.id)}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-colors ${
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

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(AppRoutes.USERS)}
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
            Create User Account
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateUserPage;
