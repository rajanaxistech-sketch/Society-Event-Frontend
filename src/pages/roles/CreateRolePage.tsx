import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { rolesService } from '../../api/rolesService';
import { permissionsService } from '../../api/permissionsService';
import { PermissionItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { ArrowLeft, Save, Shield, CheckSquare, Square } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';

const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
});

type CreateRoleFormData = z.infer<typeof createRoleSchema>;

export const CreateRolePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    permissionsService.getAll().then((res) => {
      if (res.success && res.data) setPermissions(res.data);
    });
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  // Group permissions by category / module
  const groupedPermissions: Record<string, PermissionItem[]> = {};
  permissions.forEach((p) => {
    const mod = p.module || p.code.split('.')[0] || 'General';
    if (!groupedPermissions[mod]) groupedPermissions[mod] = [];
    groupedPermissions[mod].push(p);
  });

  const togglePermission = (id: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleModuleAll = (moduleItems: PermissionItem[]) => {
    const itemIds = moduleItems.map((p) => p.id);
    const allSelected = itemIds.every((id) => selectedPermissionIds.includes(id));

    if (allSelected) {
      setSelectedPermissionIds((prev) => prev.filter((id) => !itemIds.includes(id)));
    } else {
      setSelectedPermissionIds((prev) => Array.from(new Set([...prev, ...itemIds])));
    }
  };

  const onSubmit = async (data: CreateRoleFormData) => {
    if (selectedPermissionIds.length === 0) {
      toast.warning('Please select at least one permission grant');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await rolesService.create({
        name: data.name,
        description: data.description || null,
        permission_ids: selectedPermissionIds,
      });

      if (res.success && res.data) {
        toast.success(`Role "${data.name}" created successfully.`);
        navigate(`/roles/${res.data.id}`);
      } else {
        toast.error(res.message || 'Failed to create role');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create security role'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.ROLES)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Security Role</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define role name, operational scope, and granted authorization permissions.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>Role Profile</span>
            </div>
          }
        >
          <div className="space-y-4">
            <Input
              label="Role Name"
              placeholder="e.g. Festival Committee Treasurer, Security Gate Officer"
              requiredIndicator
              error={errors.name?.message}
              {...register('name')}
            />

            <Textarea
              label="Role Description"
              placeholder="Explain the scope and responsibilities of users holding this role..."
              rows={2}
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
        </Card>

        {/* Permissions Grouping Matrix */}
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <span>RBAC Permission Grants Matrix</span>
              <span className="text-xs font-bold text-indigo-600">
                {selectedPermissionIds.length} of {permissions.length} Selected
              </span>
            </div>
          }
          subtitle="Select specific atomic access capabilities granted to this security role."
        >
          <div className="space-y-6">
            {Object.entries(groupedPermissions).map(([modName, modPerms]) => {
              const allChecked = modPerms.every((p) => selectedPermissionIds.includes(p.id));
              return (
                <div key={modName} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {modName} Module
                    </h4>
                    <button
                      type="button"
                      onClick={() => toggleModuleAll(modPerms)}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {allChecked ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {modPerms.map((p) => {
                      const isChecked = selectedPermissionIds.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => togglePermission(p.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer text-xs transition-colors flex items-start gap-2 ${
                            isChecked
                              ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-medium'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <div>
                            <span className="block font-semibold">{p.name || p.code}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">{p.code}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(AppRoutes.ROLES)}
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
            Create Security Role
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateRolePage;
