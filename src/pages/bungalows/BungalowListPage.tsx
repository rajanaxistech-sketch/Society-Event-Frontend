import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bungalowsService } from '../../api/bungalowsService';
import { societiesService } from '../../api/societiesService';
import { BungalowItem, PaginationMeta, SocietyItem } from '../../types';
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
import { Plus, Eye, Edit2, Trash2, RefreshCw } from 'lucide-react';

export const BungalowListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { can } = usePermission();

  // Seed society filter from URL query param (e.g. ?societyId=xxx when coming from Society Details)
  const initialSocietyId = new URLSearchParams(location.search).get('societyId') || '';

  const [bungalows, setBungalows] = useState<BungalowItem[]>([]);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [societyFilter, setSocietyFilter] = useState(initialSocietyId);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [deleteTarget, setDeleteTarget] = useState<BungalowItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    societiesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setSocieties(res.data);
    });
  }, []);

  const fetchBungalows = async () => {
    try {
      setIsLoading(true);
      const res = await bungalowsService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        societyId: societyFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setBungalows(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch bungalows'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBungalows();
  }, [meta.page, meta.limit, societyFilter, statusFilter, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await bungalowsService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Bungalow "${deleteTarget.bungalow_number}" deleted successfully.`);
        setDeleteTarget(null);
        fetchBungalows();
      } else {
        toast.error(res.message || 'Failed to delete bungalow');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error deleting bungalow'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<BungalowItem>[] = [
    {
      key: 'bungalow_number',
      header: 'Bungalow / Villa #',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block hover:text-indigo-600 transition-colors">
            Villa / Row House {row.bungalow_number}
          </span>
          <span className="text-xs text-slate-400">{row.bungalow_type || 'Independent Villa'}</span>
        </div>
      ),
    },
    {
      key: 'society',
      header: 'Society',
      render: (row) => (
        <span className="text-slate-800 text-xs font-medium">
          {row.society?.name || societies.find((s) => s.id === row.society_id)?.name || '—'}
        </span>
      ),
    },
    {
      key: 'primary_owner',
      header: 'Primary Owner',
      render: (row) => {
        const owner = row.bungalow_owners?.find((o) => o.is_primary)?.person;
        return (
          <span className="text-xs font-medium text-slate-700">
            {owner ? owner.full_name : <span className="text-slate-400 italic">Unassigned</span>}
          </span>
        );
      },
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
            onClick={() => navigate(`/bungalows/${row.id}`)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGuard permission={Permissions.BUNGALOW_UPDATE}>
            <button
              type="button"
              onClick={() => navigate(`/bungalows/${row.id}/edit`)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Bungalow"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.BUNGALOW_DELETE}>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Bungalow"
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bungalows & Villas</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage standalone residential bungalows, row houses, and villa units.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBungalows}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.BUNGALOW_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.BUNGALOW_CREATE)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Bungalow
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
            setTimeout(fetchBungalows, 50);
          }
        }}
        searchPlaceholder="Search bungalow number or type..."
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={societyFilter}
              onChange={(e) => {
                setSocietyFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs"
            >
              <option value="">All Societies</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
        data={bungalows}
        isLoading={isLoading}
        emptyText="No bungalows found. Click 'Add Bungalow' to create independent villa units."
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
        onRowClick={(row) => navigate(`/bungalows/${row.id}`)}
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
        title="Delete Bungalow"
        message={
          <span>
            Are you sure you want to delete <strong>Bungalow {deleteTarget?.bungalow_number}</strong>? Associated residents and collections will be deleted.
          </span>
        }
        confirmLabel="Delete Bungalow"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BungalowListPage;
