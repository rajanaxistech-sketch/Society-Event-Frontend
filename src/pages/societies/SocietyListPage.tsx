import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { societiesService } from '../../api/societiesService';
import { SocietyItem, PaginationMeta } from '../../types';
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
import { Plus, Eye, Edit2, Trash2, Sliders, RefreshCw, LayoutDashboard, Upload, FileSpreadsheet } from 'lucide-react';
import BulkUploadSocietyModal from './BulkUploadSocietyModal';

export const SocietyListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk upload modal state
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<SocietyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSocieties = async () => {
    try {
      setIsLoading(true);
      const res = await societiesService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setSocieties(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch societies'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, [meta.page, meta.limit, statusFilter, sortBy, sortOrder]);

  const handleSearchSubmit = () => {
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchSocieties();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await societiesService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Society "${deleteTarget.name}" deleted successfully.`);
        setDeleteTarget(null);
        fetchSocieties();
      } else {
        toast.error(res.message || 'Failed to delete society');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error deleting society'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<SocietyItem>[] = [
    {
      key: 'name',
      header: 'Society Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block hover:text-indigo-600 transition-colors">
            {row.name}
          </span>
          <span className="text-xs text-slate-400">Code: {row.code || '—'}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <span className="text-slate-600 text-xs">
          {[row.city, row.state].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Person',
      render: (row) => (
        <div>
          <span className="text-slate-800 text-xs font-medium block">{row.contact_name || '—'}</span>
          <span className="text-[11px] text-slate-400">{row.contact_phone || row.contact_email || ''}</span>
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
            onClick={() => navigate(`/societies/${row.id}/dashboard`)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Society Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/societies/${row.id}`)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGuard permission={Permissions.SOCIETY_STRUCTURE_CONFIG}>
            <button
              type="button"
              onClick={() => navigate(`/societies/${row.id}/structure`)}
              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Configure Structure"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.SOCIETY_UPDATE}>
            <button
              type="button"
              onClick={() => navigate(`/societies/${row.id}/edit`)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Society"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.SOCIETY_DELETE}>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Society"
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Societies</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage residential complexes, societies, and architectural structures.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGuard permission={Permissions.IMPORT_UPLOAD}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBulkUploadOpen(true)}
              leftIcon={<Upload className="w-3.5 h-3.5 text-indigo-600" />}
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              Bulk Upload
            </Button>
          </PermissionGuard>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSocieties}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.SOCIETY_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.SOCIETY_CREATE)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Society
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          if (!val) {
            setMeta((prev) => ({ ...prev, page: 1 }));
            setTimeout(fetchSocieties, 50);
          }
        }}
        searchPlaceholder="Search by society name or code..."
        filters={
          <div className="flex items-center gap-2">
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
            {search && (
              <Button size="sm" variant="secondary" onClick={handleSearchSubmit}>
                Search
              </Button>
            )}
          </div>
        }
      />

      {/* Data Table */}
      <Table
        columns={columns}
        data={societies}
        isLoading={isLoading}
        emptyText="No societies found. Click 'Add Society' to create your first community."
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
        onRowClick={(row) => navigate(`/societies/${row.id}`)}
      />

      {/* Pagination */}
      <Pagination
        meta={meta}
        onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadSocietyModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={fetchSocieties}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Society"
        message={
          <span>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This action cannot be undone and will delete associated property structures and records.
          </span>
        }
        confirmLabel="Delete Society"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SocietyListPage;
