import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { floorsService } from '../../api/floorsService';
import { blocksService } from '../../api/blocksService';
import { societiesService } from '../../api/societiesService';
import { FloorItem, PaginationMeta, BlockItem, SocietyItem } from '../../types';
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
import { Plus, Edit2, Trash2, RefreshCw, Home } from 'lucide-react';

export const FloorListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { can } = usePermission();

  const queryParams = new URLSearchParams(location.search);
  const initialSocietyId = decodeId(queryParams.get('societyId') || '');
  const initialBlockId = decodeId(queryParams.get('blockId') || '');

  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [societyFilter, setSocietyFilter] = useState(initialSocietyId);
  const [blockFilter, setBlockFilter] = useState(initialBlockId);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('floor_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [deleteTarget, setDeleteTarget] = useState<FloorItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync URL search params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlSocietyId = decodeId(params.get('societyId') || '');
    const urlBlockId = decodeId(params.get('blockId') || '');
    if (urlSocietyId !== societyFilter) setSocietyFilter(urlSocietyId);
    if (urlBlockId !== blockFilter) setBlockFilter(urlBlockId);
  }, [location.search]);

  // Load societies
  useEffect(() => {
    societiesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setSocieties(res.data);
    });
  }, []);

  // Load blocks (filtered by society if selected)
  useEffect(() => {
    blocksService.getAll({ limit: 100, societyId: societyFilter || undefined }).then((res) => {
      if (res.success && res.data) setBlocks(res.data);
    });
  }, [societyFilter]);

  const fetchFloors = async () => {
    try {
      setIsLoading(true);
      const res = await floorsService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        societyId: societyFilter || undefined,
        blockId: blockFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setFloors(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch floors'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFloors();
  }, [meta.page, meta.limit, societyFilter, blockFilter, statusFilter, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await floorsService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Floor "${deleteTarget.floor_number}" deleted successfully.`);
        setDeleteTarget(null);
        fetchFloors();
      } else {
        toast.error(res.message || 'Failed to delete floor');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error deleting floor'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<FloorItem>[] = [
    {
      key: 'floor_number',
      header: 'Floor #',
      sortable: true,
      render: (row) => (
        <span className="font-bold text-slate-900">
          Floor {row.floor_number} {row.name ? `(${row.name})` : ''}
        </span>
      ),
    },
    {
      key: 'block',
      header: 'Block / Tower',
      render: (row) => (
        <span className="text-slate-800 text-xs font-medium">
          {row.block?.name || blocks.find((b) => b.id === row.block_id)?.name || '—'}
        </span>
      ),
    },
    {
      key: 'society',
      header: 'Society',
      render: (row) => (
        <span className="text-slate-600 text-xs">
          {row.block?.society?.name || societies.find((s) => s.id === row.block?.society_id)?.name || '—'}
        </span>
      ),
    },
    {
      key: 'flats',
      header: 'Flats',
      align: 'center',
      render: (row) => {
        const flatCount = row._count?.flats ?? row.flats?.length ?? 0;
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/flats?floorId=${encodeId(row.id)}&blockId=${encodeId(row.block_id)}`);
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
            title="View flats on this floor"
          >
            <Home className="w-3.5 h-3.5" />
            <span>{flatCount} {flatCount === 1 ? 'Flat' : 'Flats'}</span>
          </button>
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
      header: 'Created On',
      sortable: true,
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard permission={Permissions.FLOOR_UPDATE}>
            <button
              type="button"
              onClick={() => navigate(`/floors/${encodeId(row.id)}/edit`)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Floor"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.FLOOR_DELETE}>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Floor"
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Floors</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage floor levels within blocks and towers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFloors}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.FLOOR_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.FLOOR_CREATE)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Floor
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
            setTimeout(fetchFloors, 50);
          }
        }}
        searchPlaceholder="Search floor name..."
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={societyFilter}
              onChange={(e) => {
                setSocietyFilter(e.target.value);
                setBlockFilter('');
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
              value={blockFilter}
              onChange={(e) => {
                setBlockFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs"
            >
              <option value="">All Blocks</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
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
        data={floors}
        isLoading={isLoading}
        emptyText="No floors found. Click 'Add Floor' to configure building levels."
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

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Floor"
        message={
          <span>
            Are you sure you want to delete <strong>Floor {deleteTarget?.floor_number}</strong>? All flats registered on this floor will also be deleted.
          </span>
        }
        confirmLabel="Delete Floor"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default FloorListPage;
