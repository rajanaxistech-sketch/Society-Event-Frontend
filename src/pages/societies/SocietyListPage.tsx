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
import { encodeId } from '../../utils/idObfuscator';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Sliders,
  RefreshCw,
  LayoutDashboard,
  Upload,
  Layers,
  Building2,
  Home,
  Store,
  Sparkles,
} from 'lucide-react';
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

  // Aggregated metric counts
  const totalSocietiesCount = meta.total || societies.length;
  const totalBlocksCount = societies.reduce((acc, s) => acc + (s._count?.blocks || 0), 0);
  const totalFlatsCount = societies.reduce((acc, s) => acc + (s._count?.flats || 0), 0);
  const totalShopsCount = societies.reduce((acc, s) => acc + (s._count?.shops || 0), 0);

  const columns: Column<SocietyItem>[] = [
    {
      key: 'name',
      header: 'Society Name',
      sortable: true,
      render: (row) => (
        <div>
          <button
            type="button"
            onClick={() => navigate(`/societies/${encodeId(row.id)}`)}
            className="font-bold text-slate-900 block hover:text-indigo-600 transition-colors text-left"
          >
            {row.name}
          </button>
          <span className="text-xs text-slate-400">Code: {row.code || '—'}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <span className="text-slate-600 text-xs font-medium">
          {[row.city, row.state].filter(Boolean).join(', ') || '—'}
        </span>
      ),
    },
    {
      key: 'structure',
      header: 'Property Structure',
      render: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
            {row._count?.blocks || 0} Blocks
          </span>
          {row._count?.bungalows ? (
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
              {row._count.bungalows} Villas
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Person',
      render: (row) => (
        <div>
          <span className="text-slate-800 text-xs font-semibold block">{row.contact_name || '—'}</span>
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
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/societies/${encodeId(row.id)}?tab=structure`)}
            className="p-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-lg transition-colors border border-indigo-200"
            title="Explore Structure (Blocks, Floors & Units)"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/societies/${encodeId(row.id)}/dashboard`)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Society Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/societies/${encodeId(row.id)}`)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Society Hub"
          >
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGuard permission={Permissions.SOCIETY_UPDATE}>
            <button
              type="button"
              onClick={() => navigate(`/societies/${encodeId(row.id)}/edit`)}
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
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Societies & Property Structure
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage housing societies, buildings, unit hierarchies, and resident databases in one unified hub.
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
              onClick={() => navigate(AppRoutes.SOCIETY_SETUP_WIZARD || '/societies/setup-wizard')}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              Onboard New Society (Setup Wizard)
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between gap-1 text-indigo-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Societies</span>
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{totalSocietiesCount}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Managed communities</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between gap-1 text-blue-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Blocks</span>
            <Layers className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{totalBlocksCount || '—'}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Wings & towers</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between gap-1 text-emerald-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Flats & Units</span>
            <Home className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{totalFlatsCount || '—'}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Residential units</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between gap-1 text-amber-600 mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commercial</span>
            <Store className="w-4 h-4" />
          </div>
          <span className="text-2xl font-black text-slate-900 block">{totalShopsCount || '—'}</span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Ground retail shops</span>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search society name, code, or city..."
        filters={
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setMeta((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        }
      />

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <Table
          columns={columns}
          data={societies}
          isLoading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(key) => {
            if (sortBy === key) {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            } else {
              setSortBy(key);
              setSortOrder('asc');
            }
          }}
          onRowClick={(row) => navigate(`/societies/${encodeId(row.id)}`)}
          emptyText="No societies found. Create or onboard your first society above."
        />
        <div className="p-4 border-t border-slate-100">
          <Pagination
            meta={meta}
            onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
            onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Society"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone and will permanently remove associated blocks and configurations.`}
        confirmLabel="Delete Society"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadSocietyModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={() => {
          setIsBulkUploadOpen(false);
          fetchSocieties();
        }}
      />
    </div>
  );
};

export default SocietyListPage;
