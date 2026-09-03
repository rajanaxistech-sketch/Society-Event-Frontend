import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { flatsService } from '../../api/flatsService';
import { floorsService } from '../../api/floorsService';
import { FlatItem, PaginationMeta, FloorItem } from '../../types';
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
import { Plus, Eye, Edit2, Trash2, RefreshCw } from 'lucide-react';

export const FlatListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { can } = usePermission();

  const initialFloorId = decodeId(new URLSearchParams(location.search).get('floorId') || '');

  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [floors, setFloors] = useState<FloorItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState(initialFloorId);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [deleteTarget, setDeleteTarget] = useState<FlatItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const urlFloorId = decodeId(new URLSearchParams(location.search).get('floorId') || '');
    if (urlFloorId !== floorFilter) {
      setFloorFilter(urlFloorId);
    }
  }, [location.search]);

  useEffect(() => {
    floorsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setFloors(res.data);
    });
  }, []);

  const fetchFlats = async () => {
    try {
      setIsLoading(true);
      const res = await flatsService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        floorId: floorFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setFlats(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch flats'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlats();
  }, [meta.page, meta.limit, floorFilter, statusFilter, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await flatsService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Flat "${deleteTarget.flat_number}" deleted successfully.`);
        setDeleteTarget(null);
        fetchFlats();
      } else {
        toast.error(res.message || 'Failed to delete flat');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error deleting flat'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<FlatItem>[] = [
    {
      key: 'flat_number',
      header: 'Flat / Unit #',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block hover:text-indigo-600 transition-colors">
            Flat {row.flat_number}
          </span>
          <span className="text-xs text-slate-400">{row.flat_type || 'Standard'}</span>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Tower & Floor',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 block">
            {row.floor?.block?.name || 'Block'} &bull; Floor {row.floor?.floor_number ?? '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'primary_owner',
      header: 'Primary Owner',
      render: (row) => {
        const owner = row.flat_owners?.find((o) => o.is_primary)?.person;
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
            onClick={() => navigate(`/flats/${encodeId(row.id)}`)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGuard permission={Permissions.FLAT_UPDATE}>
            <button
              type="button"
              onClick={() => navigate(`/flats/${encodeId(row.id)}/edit`)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Flat"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.FLAT_DELETE}>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Flat"
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Flats Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage apartment units, resident occupancies, and unit collections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFlats}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.FLAT_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.FLAT_CREATE)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Flat
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
            setTimeout(fetchFlats, 50);
          }
        }}
        searchPlaceholder="Search flat number or type..."
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={floorFilter}
              onChange={(e) => {
                setFloorFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs"
            >
              <option value="">All Floors</option>
              {floors.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.block?.name || 'Block'} - Floor {f.floor_number}
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
        data={flats}
        isLoading={isLoading}
        emptyText="No flats found. Click 'Add Flat' to create apartment units."
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
        onRowClick={(row) => navigate(`/flats/${encodeId(row.id)}`)}
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
        title="Delete Flat"
        message={
          <span>
            Are you sure you want to delete <strong>Flat {deleteTarget?.flat_number}</strong>? Associated resident linkages and historical collection entries will be permanently removed.
          </span>
        }
        confirmLabel="Delete Flat"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default FlatListPage;
