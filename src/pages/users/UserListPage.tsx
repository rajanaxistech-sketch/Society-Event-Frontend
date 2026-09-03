import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersService } from '../../api/usersService';
import { rolesService } from '../../api/rolesService';
import { UserItem, RoleItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { Plus, Eye, Edit2, Trash2, RefreshCw, Shield, UserCheck } from 'lucide-react';

export const UserListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    rolesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setRoles(res.data);
    });
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await usersService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        roleId: roleFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setUsers(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch users'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [meta.page, meta.limit, roleFilter, statusFilter, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await usersService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`User "${deleteTarget.full_name}" deactivated successfully.`);
        setDeleteTarget(null);
        fetchUsers();
      } else {
        toast.error(res.message || 'Failed to delete user');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error deleting user'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<UserItem>[] = [
    {
      key: 'full_name',
      header: 'User Profile',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block hover:text-indigo-600 transition-colors">
            {row.full_name}
          </span>
          <span className="text-xs text-slate-400">{row.email}</span>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Assigned Role',
      render: (row) => {
        const primaryRole = row.roles?.[0]?.name || row.user_roles?.[0]?.role?.name || 'Standard User';
        return (
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-800">{primaryRole}</span>
          </div>
        );
      },
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => <span className="text-xs text-slate-600">{row.phone || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'last_login',
      header: 'Last Login',
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.last_login_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/users/${row.id}`)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGuard permission={Permissions.USER_UPDATE}>
            <button
              type="button"
              onClick={() => navigate(`/users/${row.id}/edit`)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit User"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.USER_DELETE}>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Deactivate User"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Administration</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage system users, administrators, society managers, and security credentials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchUsers}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.USER_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.USER_CREATE)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add User
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          if (!val) {
            setMeta((prev) => ({ ...prev, page: 1 }));
            setTimeout(fetchUsers, 50);
          }
        }}
        searchPlaceholder="Search by name, email, or phone..."
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        }
      />

      {/* Table */}
      <Table
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyText="No user accounts found."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(field) => {
          if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(field);
            setSortOrder('asc');
          }
        }}
        onRowClick={(row) => navigate(`/users/${row.id}`)}
      />

      {/* Pagination */}
      <Pagination
        meta={meta}
        onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Deactivate User Account"
        message={
          <span>
            Are you sure you want to deactivate <strong>{deleteTarget?.full_name}</strong> ({deleteTarget?.email})? This user will no longer be able to log in.
          </span>
        }
        confirmLabel="Deactivate Account"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default UserListPage;
