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
import { encodeId, decodeId } from '../../utils/idObfuscator';
import MobileListCard from '../../components/mobile/MobileListCard';
import { Plus, Eye, Edit2, Trash2, RefreshCw, Building2, Users } from 'lucide-react';

export const BungalowListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { can, isSuperAdmin } = usePermission();

  // Seed society filter from URL query param (e.g. ?societyId=xxx when coming from Society Details)
  const initialSocietyId = decodeId(new URLSearchParams(location.search).get('societyId') || '');

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
    const urlSocietyId = decodeId(new URLSearchParams(location.search).get('societyId') || '');
    if (urlSocietyId !== societyFilter) {
      setSocietyFilter(urlSocietyId);
    }
  }, [location.search]);

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
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/bungalows/${encodeId(row.id)}`)}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <PermissionGuard permission={Permissions.BUNGALOW_UPDATE}>
            <button
              type="button"
              onClick={() => navigate(`/bungalows/${encodeId(row.id)}/edit`)}
              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="Edit Bungalow"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.BUNGALOW_DELETE}>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Delete Bungalow"
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
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Bungalows & Villas</h1>
          <p className="text-[11px] text-slate-500">
            Manage detached villas, bungalows, and private estate units.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchBungalows}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.BUNGALOW_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.BUNGALOW_CREATE)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
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
        searchPlaceholder="Search bungalow / villa number or name..."
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

      {/* Table / Mobile Cards */}
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
        onRowClick={(row) => navigate(`/bungalows/${encodeId(row.id)}`)}
        renderCard={
          !isSuperAdmin
            ? (row) => {
                const primaryPerson = row.persons?.find((p) => p.is_primary_owner) || row.persons?.[0];
                return (
                  <MobileListCard
                    title={`Bungalow ${row.bungalow_number}`}
                    subtitle={
                      <span className="flex items-center gap-1.5 text-slate-500">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{row.society?.name || 'Society'}</span>
                      </span>
                    }
                    icon={<Building2 className="w-4 h-4" />}
                    iconBg="bg-teal-50 text-teal-600"
                    status={row.status}
                    badge={
                      row.bungalow_type ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          {row.bungalow_type}
                        </span>
                      ) : undefined
                    }
                    meta={[
                      {
                        label: 'Primary Resident / Owner',
                        value: primaryPerson ? primaryPerson.full_name : 'Vacant / Unassigned',
                        icon: <Users className="w-3 h-3" />,
                      },
                      { label: 'Registered On', value: formatDate(row.created_at) },
                    ]}
                    actions={
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/bungalows/${encodeId(row.id)}`)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        {can(Permissions.BUNGALOW_UPDATE) && (
                          <button
                            type="button"
                            onClick={() => navigate(`/bungalows/${encodeId(row.id)}/edit`)}
                            className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    }
                    onClick={() => navigate(`/bungalows/${encodeId(row.id)}`)}
                  />
                );
              }
            : undefined
        }
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
