import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { vendorsService } from '../../api/vendorsService';
import { VendorItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { useDebounce } from '../../hooks/useDebounce';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Switch from '../../components/ui/Switch';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ThemedSelect from '../../components/ui/ThemedSelect';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  Store,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Mail,
  Phone,
  Building2,
  Search,
  X,
  Save,
  ArrowLeft,
} from 'lucide-react';

const phoneRegex = /^[+0-9\s-]{7,20}$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const vendorModalSchema = z.object({
  vendorName: z
    .string()
    .trim()
    .min(1, 'Vendor Name is required')
    .max(200, 'Vendor Name cannot exceed 200 characters'),
  shortName: z
    .string()
    .trim()
    .max(100, 'Short Name cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  companyName: z
    .string()
    .trim()
    .max(200, 'Company Name cannot exceed 200 characters')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || emailRegex.test(val), {
      message: 'Invalid email address format (e.g. name@domain.com)',
    }),
  mobileNo: z
    .string()
    .trim()
    .min(1, 'Contact Number is required')
    .min(7, 'Contact Number must be at least 7 digits')
    .max(20, 'Contact Number cannot exceed 20 digits')
    .regex(phoneRegex, 'Invalid phone format (digits, +, - allowed)'),
  isActive: z.boolean(),
});

type VendorModalFormData = z.infer<typeof vendorModalSchema>;

export const VendorListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can, isSuperAdmin } = usePermission();

  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal State for Quick Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorItem | null>(null);
  const [isModalSubmitting, setIsModalSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<VendorItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VendorModalFormData>({
    resolver: zodResolver(vendorModalSchema),
    mode: 'onChange',
    defaultValues: {
      vendorName: '',
      shortName: '',
      companyName: '',
      email: '',
      mobileNo: '',
      isActive: true,
    },
  });

  const isActiveModalValue = watch('isActive');

  const fetchVendors = async () => {
    try {
      setIsLoading(true);
      const res = await vendorsService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: debouncedSearch || undefined,
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
  }, [meta.page, meta.limit, debouncedSearch, statusFilter, sortBy, sortOrder]);

  const openCreateModal = () => {
    setEditingVendor(null);
    reset({
      vendorName: '',
      shortName: '',
      companyName: '',
      email: '',
      mobileNo: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (vendor: VendorItem) => {
    setEditingVendor(vendor);
    const active = vendor.isActive ?? vendor.is_active ?? (vendor.status === 'active');
    reset({
      vendorName: vendor.vendorName || vendor.vendor_name || '',
      shortName: vendor.shortName || vendor.short_name || '',
      companyName: vendor.companyName || vendor.company_name || '',
      email: vendor.email || '',
      mobileNo: vendor.mobileNo || vendor.mobile_no || vendor.contactNumber || vendor.contact_number || '',
      isActive: active,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: VendorModalFormData) => {
    try {
      setIsModalSubmitting(true);
      if (editingVendor) {
        const res = await vendorsService.update(editingVendor.id, {
          vendorName: data.vendorName.trim(),
          shortName: data.shortName?.trim() || null,
          companyName: data.companyName?.trim() || null,
          email: data.email?.trim().toLowerCase() || null,
          mobileNo: data.mobileNo.trim(),
          isActive: data.isActive,
          status: data.isActive ? 'active' : 'inactive',
        });

        if (res.success) {
          toast.success(`Vendor "${data.vendorName}" updated successfully.`);
          setIsModalOpen(false);
          await fetchVendors();
        } else {
          toast.error(res.message || 'Failed to update vendor');
        }
      } else {
        const res = await vendorsService.create({
          vendorName: data.vendorName.trim(),
          shortName: data.shortName?.trim() || null,
          companyName: data.companyName?.trim() || null,
          email: data.email?.trim().toLowerCase() || null,
          mobileNo: data.mobileNo.trim(),
          isActive: data.isActive,
          status: data.isActive ? 'active' : 'inactive',
        });

        if (res.success) {
          toast.success(`Vendor "${data.vendorName}" added successfully.`);
          setIsModalOpen(false);
          await fetchVendors();
        } else {
          toast.error(res.message || 'Failed to add vendor');
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, editingVendor ? 'Failed to update vendor' : 'Failed to create vendor'));
    } finally {
      setIsModalSubmitting(false);
    }
  };

  const handleToggleStatus = async (v: VendorItem) => {
    const currentlyActive = v.isActive ?? v.is_active ?? (v.status === 'active');
    const nextStatus = !currentlyActive;

    try {
      setTogglingId(v.id);
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
        toast.success(`Vendor "${v.vendorName || v.vendor_name}" is now ${nextStatus ? 'active' : 'inactive'}.`);
      } else {
        toast.error(res.message || 'Failed to update vendor status');
        await fetchVendors();
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error updating vendor status'));
      await fetchVendors();
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
        toast.success(`Vendor "${deleteTarget.vendorName || deleteTarget.vendor_name}" deleted.`);
        setDeleteTarget(null);
        await fetchVendors();
      } else {
        toast.error(res.message || 'Failed to delete vendor');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete vendor'));
    } finally {
      setIsDeleting(false);
    }
  };

  const canManage =
    isSuperAdmin ||
    can(Permissions.VENDOR_MANAGE) ||
    can(Permissions.VENDOR_UPDATE) ||
    can(Permissions.SETTING_UPDATE);
  const canDelete =
    isSuperAdmin ||
    can(Permissions.VENDOR_MANAGE) ||
    can(Permissions.VENDOR_DELETE) ||
    can(Permissions.SETTING_UPDATE);
  const canCreate =
    isSuperAdmin ||
    can(Permissions.VENDOR_MANAGE) ||
    can(Permissions.VENDOR_CREATE) ||
    can(Permissions.SETTING_UPDATE);

  const columns: Column<VendorItem>[] = [
    {
      key: 'vendorName',
      header: 'Vendor Name',
      className: 'min-w-[170px]',
      render: (row) => {
        const name = row.vendorName || row.vendor_name;
        const short = row.shortName || row.short_name;
        return (
          <div className="py-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-900 text-xs sm:text-[13px]">{name}</span>
              {short && (
                <span className="text-[10px] font-mono font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  {short}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'companyName',
      header: 'Company Name',
      className: 'min-w-[150px]',
      render: (row) => {
        const company = row.companyName || row.company_name;
        return (
          <div className="flex items-center gap-1.5 text-xs text-slate-700">
            {company ? (
              <>
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate max-w-[180px]">{company}</span>
              </>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'contactNumber',
      header: 'Contact Number',
      className: 'min-w-[140px]',
      render: (row) => {
        const phone = row.mobileNo || row.mobile_no || row.contactNumber || row.contact_number;
        const cleanPhone = phone ? String(phone).replace(/[^\d+]/g, '') : '';
        return (
          <div className="text-xs">
            {phone ? (
              <a
                href={`tel:${cleanPhone}`}
                className="inline-flex items-center gap-1.5 text-slate-800 hover:text-indigo-600 active:text-indigo-700 font-mono text-[12px] hover:underline transition-colors"
                onClick={(e) => e.stopPropagation()}
                title={`Call ${phone}`}
              >
                <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>{phone}</span>
              </a>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'email',
      header: 'Email Address',
      className: 'min-w-[180px]',
      render: (row) => (
        <div className="text-xs">
          {row.email ? (
            <a
              href={`mailto:${row.email}`}
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 active:text-indigo-700 truncate max-w-[200px] hover:underline transition-colors"
              onClick={(e) => e.stopPropagation()}
              title={`Email ${row.email}`}
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{row.email}</span>
            </a>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      className: 'min-w-[110px]',
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
      className: 'min-w-[80px]',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {canManage && (
            <button
              type="button"
              onClick={() => openEditModal(row)}
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
    <div className="space-y-2.5 pb-2">
      {/* Ultra-Compact & Clean Top Header */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">Vendors</h1>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100 shrink-0">
              {meta.total}
            </span>
          </div>
        </div>

        {/* Compact Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={fetchVendors}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            title="Refresh Vendors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Vendor</span>
            </button>
          )}
        </div>
      </div>

      {/* Ultra-Compact Single-Row Search & Filter Bar */}
      <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setMeta((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Search vendor, company, phone..."
            className="w-full pl-8 pr-7 py-1.5 text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Compact Status Select */}
        <div className="w-auto min-w-[115px] sm:min-w-[130px] shrink-0">
          <ThemedSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setMeta((prev) => ({ ...prev, page: 1 }));
            }}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active', color: '#10B981' },
              { value: 'inactive', label: 'Inactive', color: '#94A3B8' },
            ]}
            placeholder="All Statuses"
            variant="indigo"
            size="sm"
            align="right"
            menuWidth="w-36"
            searchable={false}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Card>
            <Table
              columns={columns}
              data={vendors}
              isLoading={isLoading}
              emptyText="No vendors found."
            />
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
        </div>

        {/* Mobile Minimalist Cards */}
        <div className="md:hidden space-y-2">
          {isLoading ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-xs text-slate-400 shadow-2xs">
              Loading vendors...
            </div>
          ) : vendors.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-xs text-slate-400 shadow-2xs">
              No vendors found matching your criteria.
            </div>
          ) : (
            vendors.map((v) => {
              const active = v.isActive ?? v.is_active ?? (v.status === 'active');
              const name = v.vendorName || v.vendor_name;
              const short = v.shortName || v.short_name;
              const company = v.companyName || v.company_name;
              const phone = v.mobileNo || v.mobile_no || v.contactNumber || v.contact_number;

              return (
                <div
                  key={v.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-3 space-y-2 shadow-2xs hover:border-indigo-200 transition-colors"
                >
                  {/* Card Header: Name + Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-xs text-slate-900 truncate">{name}</span>
                        {short && (
                          <span className="text-[9.5px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100">
                            {short}
                          </span>
                        )}
                      </div>
                      {company && (
                        <div className="flex items-center gap-1 text-[10.5px] text-slate-500 mt-0.5 truncate">
                          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{company}</span>
                        </div>
                      )}
                    </div>
                    <StatusBadge status={active ? 'active' : 'inactive'} size="sm" />
                  </div>

                  {/* Compact Contact Pill */}
                  {(phone || v.email) && (
                    <div className="flex items-center gap-2 text-[11px] bg-slate-50/90 px-2 py-1.5 rounded-lg border border-slate-100 flex-wrap">
                      {phone && (
                        <a
                          href={`tel:${String(phone).replace(/[^\d+]/g, '')}`}
                          className="inline-flex items-center gap-1 font-mono text-slate-800 hover:text-indigo-600 active:text-indigo-700 hover:underline shrink-0 p-0.5 rounded transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title={`Call ${phone}`}
                        >
                          <Phone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{phone}</span>
                        </a>
                      )}
                      {v.email && (
                        <a
                          href={`mailto:${v.email}`}
                          className="inline-flex items-center gap-1 text-slate-600 hover:text-indigo-600 active:text-indigo-700 hover:underline truncate max-w-[180px] p-0.5 rounded transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          title={`Email ${v.email}`}
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{v.email}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {/* Card Footer: Status Switch + Actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/70">
                    <div className="flex items-center gap-1.5">
                      {canManage && (
                        <>
                          <Switch
                            checked={active}
                            onChange={() => handleToggleStatus(v)}
                            disabled={togglingId === rowOrVId(v)}
                          />
                          <span className="text-[10px] text-slate-500 font-medium">
                            {active ? 'Active' : 'Inactive'}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => openEditModal(v)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(v)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Mobile Pagination */}
          {meta.totalPages > 1 && (
            <div className="pt-1">
              <Pagination
                meta={meta}
                onPageChange={(p) => setMeta((prev) => ({ ...prev, page: p }))}
                onLimitChange={(l) => setMeta((prev) => ({ ...prev, limit: l, page: 1 }))}
              />
            </div>
          )}
        </div>
      </div>

      {/* Minimalist Quick Add/Edit Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <h3 className="font-bold text-slate-900 text-xs">
                  {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit(handleModalSubmit)} noValidate className="flex flex-col flex-1 overflow-y-auto">
              <div className="p-3.5 space-y-3">
                {/* Row 1: Required Fields with bright red requiredIndicator asterisk */}
                <div className="space-y-2.5">
                  <Input
                    label="Vendor Name"
                    requiredIndicator={true}
                    placeholder="e.g. Apex Sound & Lights"
                    error={errors.vendorName?.message}
                    {...register('vendorName')}
                  />

                  <Input
                    label="Contact Number"
                    requiredIndicator={true}
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    error={errors.mobileNo?.message}
                    {...register('mobileNo')}
                  />
                </div>

                {/* Row 2: Optional Info */}
                <div className="grid grid-cols-2 gap-2.5">
                  <Input
                    label="Company Name"
                    placeholder="e.g. Apex Pvt Ltd"
                    helperText="Optional"
                    error={errors.companyName?.message}
                    {...register('companyName')}
                  />

                  <Input
                    label="Vendor Short Name"
                    placeholder="e.g. APEX"
                    helperText="Optional"
                    error={errors.shortName?.message}
                    {...register('shortName')}
                  />
                </div>

                {/* Row 3: Optional Email with validation */}
                <div>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. contact@apex.com"
                    helperText="Optional (valid email format)"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>

                {/* Row 4: Status Toggle */}
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-slate-800 block">Active Vendor</span>
                    <span className="text-[10px] text-slate-500">
                      Available for assignment and contracts
                    </span>
                  </div>
                  <Switch
                    checked={isActiveModalValue}
                    onChange={(val) => setValue('isActive', val)}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-3.5 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isModalSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isModalSubmitting}
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Vendor"
        message={`Are you sure you want to delete vendor "${deleteTarget?.vendorName || deleteTarget?.vendor_name}"?`}
        confirmLabel="Yes, Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

// Helper
const rowOrVId = (v: VendorItem) => v.id;

export default VendorListPage;
