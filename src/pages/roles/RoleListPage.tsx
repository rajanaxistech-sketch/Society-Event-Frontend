import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rolesService } from '../../api/rolesService';
import { RoleItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Table, { Column } from '../../components/ui/Table';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId } from '../../utils/idObfuscator';
import { Plus, Eye, Trash2, Shield, RefreshCw, Lock } from 'lucide-react';

export const RoleListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const res = await rolesService.getAll();
      if (res.success && res.data) {
        setRoles(res.data);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch roles'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await rolesService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Role "${deleteTarget.name}" deleted.`);
        setDeleteTarget(null);
        fetchRoles();
      } else {
        toast.error(res.message || 'Failed to delete role');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete role'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<RoleItem>[] = [
    {
      key: 'name',
      header: 'Role Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="font-bold text-slate-900 block hover:text-indigo-600 transition-colors">
              {row.name}
            </span>
            <span className="text-xs text-slate-400">{row.description || 'System Access Role'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'system_defined',
      header: 'Type',
      render: (row) => (
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded ${
            row.is_system ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
          }`}
        >
          {row.is_system ? 'System Default' : 'Custom Defined'}
        </span>
      ),
    },
    {
      key: 'permissions_count',
      header: 'Granted Permissions',
      render: (row) => {
        const count = row.role_permissions?.length ?? row.permissions?.length ?? 0;
        return <span className="text-xs font-bold text-slate-800">{count} Permissions</span>;
      },
    },
    {
      key: 'created_at',
      header: 'Created On',
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/roles/${encodeId(row.id)}`)}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="View Role & Permissions Matrix"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          {!row.is_system && (
            <PermissionGuard permission={Permissions.ROLE_DELETE}>
              <button
                type="button"
                onClick={() => setDeleteTarget(row)}
                className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete Role"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </PermissionGuard>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Roles & Access Matrix
          </h1>
          <p className="text-[11px] text-slate-500">
            Define system roles and granular security permissions for user authorization.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRoles}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.ROLE_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.ROLE_CREATE)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Role
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={roles}
          isLoading={isLoading}
          emptyText="No roles configured in the authorization system."
          onRowClick={(row) => navigate(`/roles/${encodeId(row.id)}`)}
        />
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Custom Role"
        message={
          <span>
            Are you sure you want to delete the role <strong>{deleteTarget?.name}</strong>? Any users assigned to this role will lose these authorization grants.
          </span>
        }
        confirmLabel="Delete Role"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default RoleListPage;
