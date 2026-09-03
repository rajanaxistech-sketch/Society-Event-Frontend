import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { personsService } from '../../api/personsService';
import { PersonItem, PaginationMeta } from '../../types';
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
import { encodeId } from '../../utils/idObfuscator';
import { Plus, Eye, Edit2, Trash2, Crown, RefreshCw, Home, Building2 } from 'lucide-react';

export const ResidentListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [residents, setResidents] = useState<PersonItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [deleteTarget, setDeleteTarget] = useState<PersonItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchResidents = async () => {
    try {
      setIsLoading(true);
      const res = await personsService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setResidents(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch residents'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [meta.page, meta.limit, statusFilter, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await personsService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Resident "${deleteTarget.full_name}" deleted successfully.`);
        setDeleteTarget(null);
        fetchResidents();
      } else {
        toast.error(res.message || 'Failed to delete resident');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error deleting resident'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<PersonItem>[] = [
    {
      key: 'full_name',
      header: 'Resident Name',
      sortable: true,
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900 block hover:text-indigo-600 transition-colors">
              {row.full_name}
            </span>
            {row.is_primary_owner && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                <Crown className="w-2.5 h-2.5 text-amber-600" /> Owner
              </span>
            )}
          </div>
          <span className="text-xs text-slate-400">{row.relationship_to_owner || 'Self'}</span>
        </div>
      ),
    },
    {
      key: 'unit',
      header: 'Assigned Unit',
      render: (row) => {
        if (row.flat) {
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
              <Home className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>Flat {row.flat.flat_number} ({row.flat.floor?.block?.name || 'Block'})</span>
            </div>
          );
        }
        if (row.bungalow) {
          return (
            <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
              <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Bungalow {row.bungalow.bungalow_number}</span>
            </div>
          );
        }
        return <span className="text-slate-400 text-xs italic">Unassigned</span>;
      },
    },
    {
      key: 'contact',
      header: 'Contact Details',
      render: (row) => (
        <div className="text-xs">
          <span className="text-slate-900 font-medium block">{row.phone || '—'}</span>
          <span className="text-slate-400">{row.email || ''}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'created_at',
      header: 'Registered On',
      sortable: true,
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/residents/${encodeId(row.id)}`)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGuard permission={Permissions.PERSON_UPDATE}>
            <button
              type="button"
              onClick={() => navigate(`/residents/${encodeId(row.id)}/edit`)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Resident"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.PERSON_DELETE}>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Resident"
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Residents & Members</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage apartment owners, tenants, and community residents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchResidents}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.PERSON_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.RESIDENT_CREATE)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Resident
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
            setTimeout(fetchResidents, 50);
          }
        }}
        searchPlaceholder="Search by name, email, or mobile..."
        filters={
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
        }
      />

      {/* Table */}
      <Table
        columns={columns}
        data={residents}
        isLoading={isLoading}
        emptyText="No residents found. Click 'Add Resident' to register flat members or bungalow owners."
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
        onRowClick={(row) => navigate(`/residents/${encodeId(row.id)}`)}
      />

      {/* Pagination */}
      <Pagination
        meta={meta}
        onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
      />

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Resident"
        message={
          <span>
            Are you sure you want to delete <strong>{deleteTarget?.full_name}</strong>? This person will be unlinked from their assigned unit.
          </span>
        }
        confirmLabel="Delete Resident"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ResidentListPage;
