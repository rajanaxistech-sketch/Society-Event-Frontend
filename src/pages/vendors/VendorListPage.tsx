import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { vendorsService } from '../../api/vendorsService';
import { VendorItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/ui/Button';
import Switch from '../../components/ui/Switch';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { extractErrorMessage } from '../../utils/errorExtractor';
import MobileListCard from '../../components/mobile/MobileListCard';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  Tag,
  Building2,
} from 'lucide-react';

export const VendorListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can, isSuperAdmin } = usePermission();

  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [deleteTarget, setDeleteTarget] = useState<VendorItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const res = await vendorsService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setVendors(res.data);
        if (res.meta) {
          setMeta(res.meta);
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load vendors'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [meta.page, meta.limit, statusFilter, sortBy, sortOrder]);

  // Debounced or direct search trigger
  const handleSearchSubmit = (query: string) => {
    setSearch(query);
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const handleToggleStatus = async (v: VendorItem) => {
    const currentlyActive = v.isActive ?? v.is_active ?? (v.status === 'active');
    const nextStatus = !currentlyActive;

    try {
      setTogglingId(v.id);
      // Optimistic update
      setVendors((prev) =>
        prev.map((item) =>
          item.id === v.id
            ? {
                ...item,
                isActive: nextStatus,
                is_active: nextStatus,
                status: nextStatus ? 'active' : 'inactive',
              }
            : item
        )
      );

      const res = await vendorsService.update(v.id, {
        isActive: nextStatus,
        is_active: nextStatus,
        status: nextStatus ? 'active' : 'inactive',
      });

      if (res.success) {
        toast.success(`Vendor "${v.vendorName || v.vendor_name}" ${nextStatus ? 'activated' : 'deactivated'}.`);
      } else {
        toast.error(res.message || 'Failed to update vendor status');
        fetchVendors();
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error updating vendor status'));
      fetchVendors();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await vendorsService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Vendor "${deleteTarget.vendorName || deleteTarget.vendor_name}" deleted successfully.`);
        setDeleteTarget(null);
        fetchVendors();
      } else {
        toast.error(res.message || 'Failed to delete vendor');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete vendor'));
    } finally {
      setIsDeleting(false);
    }
  };

  const canManage = isSuperAdmin || can(Permissions.VENDOR_MANAGE) || can(Permissions.VENDOR_UPDATE) || can(Permissions.SETTING_UPDATE);
  const canDelete = isSuperAdmin || can(Permissions.VENDOR_MANAGE) || can(Permissions.VENDOR_DELETE) || can(Permissions.SETTING_UPDATE);
  const canCreate = isSuperAdmin || can(Permissions.VENDOR_MANAGE) || can(Permissions.VENDOR_CREATE) || can(Permissions.SETTING_UPDATE);

  const columns: Column<VendorItem>[] = [
    {
      key: 'vendorName',
      header: 'Vendor Name',
      render: (row) => {
        const name = row.vendorName || row.vendor_name;
        return (
          <div className="py-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs sm:text-[13px]">{name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
              <Tag className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="font-medium font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                {row.shortName || row.short_name}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'address',
      header: 'Address',
      render: (row) => (
        <div className="flex items-start gap-1.5 max-w-xs text-xs text-slate-600">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <span className="line-clamp-2 leading-relaxed">{row.address || '—'}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Details',
      render: (row) => {
        const phone = row.mobileNo || row.mobile_no;
        return (
          <div className="space-y-1 text-xs">
            {row.email && (
              <div className="flex items-center gap-1.5 text-slate-700">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a
                  href={`mailto:${row.email}`}
                  className="hover:text-indigo-600 hover:underline truncate max-w-[180px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {row.email}
                </a>
              </div>
            )}
            {phone && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <a
                  href={`tel:${phone}`}
                  className="hover:text-indigo-600 hover:underline font-mono text-[11px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {phone}
                </a>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status & Toggle',
      align: 'center',
      render: (row) => {
        const active = row.isActive ?? row.is_active ?? (row.status === 'active');
        return (
          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <StatusBadge status={active ? 'active' : 'inactive'} size="sm" />
            {canManage && (
              <Switch
                checked={active}
                onChange={() => handleToggleStatus(row)}
                disabled={togglingId === row.id}
              />
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canManage && (
            <button
              type="button"
              onClick={() => navigate(AppRoutes.VENDOR_EDIT.replace(':id', row.id))}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit Vendor"
              aria-label={`Edit ${row.vendorName || row.vendor_name}`}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Vendor"
              aria-label={`Delete ${row.vendorName || row.vendor_name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Vendors</h1>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Setting Master
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Master registry of approved service providers, event contractors, equipment suppliers, and agencies.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVendors}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.VENDOR_CREATE)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Vendor
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setMeta((prev) => ({ ...prev, page: 1 }));
        }}
        searchPlaceholder="Search vendors by name, code, email, mobile, or address..."
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        }
      />

      {/* Table Section */}
      <Card>
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={vendors}
            isLoading={isLoading}
            emptyText="No vendors found matching your search or filters."
          />
        </div>

        {/* Mobile / Tablet List View */}
        <div className="md:hidden divide-y divide-slate-100">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading vendors...</div>
          ) : vendors.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No vendors found.</div>
          ) : (
            vendors.map((v) => {
              const active = v.isActive ?? v.is_active ?? (v.status === 'active');
              const name = v.vendorName || v.vendor_name;
              const short = v.shortName || v.short_name;
              const phone = v.mobileNo || v.mobile_no;

              return (
                <div key={v.id} className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">{name}</span>
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100">
                          {short}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="line-clamp-1">{v.address}</span>
                      </div>
                    </div>
                    <StatusBadge status={active ? 'active' : 'inactive'} size="sm" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${v.email}`} className="truncate text-[11px] text-slate-700 hover:underline">
                        {v.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${phone}`} className="text-[11px] font-mono text-slate-700 hover:underline">
                        {phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <div className="flex items-center gap-1.5">
                          <Switch
                            checked={active}
                            onChange={() => handleToggleStatus(v)}
                            disabled={togglingId === v.id}
                          />
                          <span className="text-[11px] text-slate-500">
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(AppRoutes.VENDOR_EDIT.replace(':id', v.id))}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(v)}
                          className="text-rose-600 hover:bg-rose-50"
                          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="p-3 border-t border-slate-100">
            <Pagination
              meta={meta}
              onPageChange={(p) => setMeta((prev) => ({ ...prev, page: p }))}
              onLimitChange={(l) => setMeta((prev) => ({ ...prev, limit: l, page: 1 }))}
            />
          </div>
        )}
      </Card>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Vendor Record"
        message={`Are you sure you want to delete vendor "${deleteTarget?.vendorName || deleteTarget?.vendor_name}"? This action will remove the vendor from the master list.`}
        confirmLabel="Yes, Delete Vendor"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default VendorListPage;
