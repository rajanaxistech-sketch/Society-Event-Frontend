import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { blocksService } from '../../api/blocksService';
import { societiesService } from '../../api/societiesService';
import { BlockItem, PaginationMeta, SocietyItem } from '../../types';
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
import { encodeId, decodeId } from '../../utils/idObfuscator';
import { Plus, Edit2, Trash2, RefreshCw, Layers } from 'lucide-react';

export const BlockListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { can } = usePermission();

  // Seed society filter from URL query param (e.g. ?societyId=xxx when coming from Society Details)
  const initialSocietyId = decodeId(new URLSearchParams(location.search).get('societyId') || '');

  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [societyFilter, setSocietyFilter] = useState(initialSocietyId);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [deleteTarget, setDeleteTarget] = useState<BlockItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync URL search params if navigated with new query
  useEffect(() => {
    const urlSocietyId = decodeId(new URLSearchParams(location.search).get('societyId') || '');
    if (urlSocietyId !== societyFilter) {
      setSocietyFilter(urlSocietyId);
      setMeta((prev) => ({ ...prev, page: 1 }));
    }
  }, [location.search]);

  useEffect(() => {
    societiesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setSocieties(res.data);
    });
  }, []);

  const fetchBlocks = async () => {
    try {
      setIsLoading(true);
      const res = await blocksService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        societyId: societyFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setBlocks(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch blocks'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, [meta.page, meta.limit, societyFilter, statusFilter, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await blocksService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Block "${deleteTarget.name}" deleted successfully.`);
        setDeleteTarget(null);
        fetchBlocks();
      } else {
        toast.error(res.message || 'Failed to delete block');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error deleting block'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<BlockItem>[] = [
    {
      key: 'name',
      header: 'Block / Wing Name',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.name}</span>
          <span className="text-xs text-slate-400">Code: {row.code || '—'}</span>
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
      key: 'floors',
      header: 'Floors',
      align: 'center',
      render: (row) => {
        const floorCount = row._count?.floors ?? row.floors?.length ?? 0;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/floors?blockId=${encodeId(row.id)}&societyId=${encodeId(row.society_id)}`);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            title="View floors in this block"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{floorCount} {floorCount === 1 ? 'Floor' : 'Floors'}</span>
          </button>
        );
      },
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => <span className="text-slate-500 text-xs truncate max-w-xs block">{row.description || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'created_at',
      header: 'Created On',
      sortable: true,
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard permission={Permissions.BLOCK_UPDATE}>
            <button
              type="button"
              onClick={() => navigate(`/blocks/${encodeId(row.id)}/edit`)}
              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Edit Block"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.BLOCK_DELETE}>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete Block"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Blocks & Wings</h1>
          <p className="text-[11px] text-slate-500">
            Manage apartment blocks, wings, and towers inside societies.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBlocks}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.BLOCK_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.BLOCK_CREATE)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Block
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
            setTimeout(fetchBlocks, 50);
          }
        }}
        searchPlaceholder="Search block name or code..."
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={societyFilter}
              onChange={(e) => {
                setSocietyFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs"
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
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
        data={blocks}
        isLoading={isLoading}
        emptyText="No blocks found. Click 'Add Block' to define a wing or tower."
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
        title="Delete Block"
        message={
          <span>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will remove all associated floors and flats.
          </span>
        }
        confirmLabel="Delete Block"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BlockListPage;
