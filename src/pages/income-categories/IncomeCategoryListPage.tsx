import React, { useEffect, useState } from 'react';
import { incomeCategoriesService } from '../../api/incomeCategoriesService';
import { societiesService } from '../../api/societiesService';
import { IncomeCategoryItem, PaginationMeta, SocietyItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Switch from '../../components/ui/Switch';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  Coins,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Ticket,
  Megaphone,
  Home,
  HeartHandshake,
  Hash,
  CircleDollarSign,
  Layers,
  Sparkles,
  Building2,
  Globe,
} from 'lucide-react';

export const IncomeCategoryListPage: React.FC = () => {
  const toast = useToast();
  const { can, isSuperAdmin, isAdmin } = usePermission();

  const [categories, setCategories] = useState<IncomeCategoryItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryTypeFilter, setCategoryTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [societyFilter, setSocietyFilter] = useState('');
  const [societies, setSocieties] = useState<Array<{ id: string; name: string }>>([]);
  const [sortBy, setSortBy] = useState('display_order');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal Form State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    societyId: '',
    categoryType: 'collection' as 'collection' | 'advertisement' | 'donation' | 'other',
    defaultAmount: 5000,
    defaultSnackPasses: 0,
    description: '',
    displayOrder: 0,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<IncomeCategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin) {
      societiesService
        .getAll({ limit: 100 })
        .then((res) => {
          if (res.success && res.data) {
            setSocieties(res.data.map((s: any) => ({ id: s.id, name: s.name })));
          }
        })
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await incomeCategoriesService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        categoryType: categoryTypeFilter || undefined,
        status: statusFilter || undefined,
        societyId: societyFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setCategories(res.data);
        if (res.meta) {
          setMeta(res.meta);
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load income categories'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [meta.page, meta.limit, categoryTypeFilter, statusFilter, societyFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (query: string) => {
    setSearch(query);
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      name: '',
      code: '',
      societyId: isSuperAdmin ? (societyFilter !== 'general' && societyFilter ? societyFilter : '') : '',
      categoryType: 'collection',
      defaultAmount: 5000,
      defaultSnackPasses: 2,
      description: '',
      displayOrder: (meta.total || 0) + 1,
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: IncomeCategoryItem) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    const catType = (cat.categoryType || cat.category_type || 'collection') as any;
    setFormData({
      name: cat.name || '',
      code: cat.code || '',
      societyId: cat.societyId || cat.society_id || '',
      categoryType: catType,
      defaultAmount: cat.defaultAmount ?? cat.default_amount ?? 0,
      defaultSnackPasses: cat.defaultSnackPasses ?? cat.default_snack_passes ?? 0,
      description: cat.description || '',
      displayOrder: cat.displayOrder ?? cat.display_order ?? 0,
      isActive: cat.isActive ?? cat.is_active ?? true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Category name is required';
    }
    if (formData.defaultAmount < 0) {
      errors.defaultAmount = 'Default amount cannot be negative';
    }
    if (formData.defaultSnackPasses < 0) {
      errors.defaultSnackPasses = 'Snack passes cannot be negative';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim() || null,
        societyId: formData.societyId ? formData.societyId : null,
        categoryType: formData.categoryType,
        defaultAmount: Number(formData.defaultAmount) || 0,
        defaultSnackPasses: Number(formData.defaultSnackPasses) || 0,
        description: formData.description.trim() || null,
        displayOrder: Number(formData.displayOrder) || 0,
        isActive: formData.isActive,
      };

      if (isEditing && currentId) {
        const res = await incomeCategoriesService.update(currentId, payload);
        if (res.success) {
          toast.success('Income category updated successfully');
          setIsModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await incomeCategoriesService.create(payload);
        if (res.success) {
          toast.success('Income category created successfully');
          setIsModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save income category'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: IncomeCategoryItem) => {
    const currentlyActive = cat.isActive ?? cat.is_active ?? (cat.status === 'active');
    const nextStatus = !currentlyActive;

    try {
      setTogglingId(cat.id);
      setCategories((prev) =>
        prev.map((item) =>
          item.id === cat.id
            ? { ...item, isActive: nextStatus, is_active: nextStatus, status: nextStatus ? 'active' : 'inactive' }
            : item
        )
      );

      const res = await incomeCategoriesService.update(cat.id, { isActive: nextStatus });
      if (res.success) {
        toast.success(`Category "${cat.name}" marked ${nextStatus ? 'Active' : 'Inactive'}`);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Status toggle failed'));
      fetchCategories();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await incomeCategoriesService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Category "${deleteTarget.name}" deleted successfully.`);
        setDeleteTarget(null);
        fetchCategories();
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete income category'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'collection':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Home className="w-3 h-3 text-emerald-600" />
            Resident Collection
          </span>
        );
      case 'advertisement':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Megaphone className="w-3 h-3 text-amber-600" />
            Advertisement / Sponsor
          </span>
        );
      case 'donation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <HeartHandshake className="w-3 h-3 text-purple-600" />
            Donation
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Coins className="w-3 h-3 text-slate-500" />
            Other Income
          </span>
        );
    }
  };

  const columns: Column<IncomeCategoryItem>[] = [
    {
      key: 'name',
      header: 'Category Details',
      sortable: true,
      render: (cat) => {
        const isGeneral = !cat.societyId && !cat.society_id;
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs text-white text-xs font-bold bg-gradient-to-tr from-emerald-600 to-teal-600">
              <Coins className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">{cat.name}</span>
                {cat.code && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold">
                    {cat.code}
                  </span>
                )}
                {isGeneral ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                    <Globe className="w-2.5 h-2.5 text-emerald-600" />
                    Global
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium max-w-[140px] truncate" title={cat.society?.name || 'Society'}>
                    <Building2 className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                    <span className="truncate">{cat.society?.name || 'Society Specific'}</span>
                  </span>
                )}
              </div>
              {cat.description ? (
                <p className="text-[11px] text-slate-500 truncate max-w-xs">{cat.description}</p>
              ) : (
                <span className="text-[10px] text-slate-400 italic">No description provided</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'category_type',
      header: 'Income Type',
      sortable: true,
      render: (cat) => getTypeBadge(cat.categoryType || cat.category_type || 'collection'),
    },
    {
      key: 'default_amount',
      header: 'Default Amount & Passes',
      sortable: true,
      render: (cat) => {
        const amount = Number(cat.defaultAmount ?? cat.default_amount ?? 0);
        const passes = Number(cat.defaultSnackPasses ?? cat.default_snack_passes ?? 0);
        return (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 font-bold text-xs text-slate-900">
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>₹{amount.toLocaleString('en-IN')}</span>
            </div>
            {passes > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                <Ticket className="w-3 h-3 text-amber-500" />
                <span>{passes} Snack Passes</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'usage',
      header: 'Collections / Sponsors',
      render: (cat) => (
        <div className="flex items-center gap-2">
          {(cat.collectionsCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Home className="w-3 h-3 text-emerald-600" />
              {cat.collectionsCount} Flats
            </span>
          )}
          {(cat.sponsorsCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <Megaphone className="w-3 h-3 text-amber-600" />
              {cat.sponsorsCount} Sponsors
            </span>
          )}
          {(cat.collectionsCount ?? 0) === 0 && (cat.sponsorsCount ?? 0) === 0 && (
            <span className="text-[11px] text-slate-400 italic">Not yet assigned</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (cat) => {
        const isActive = cat.isActive ?? cat.is_active ?? (cat.status === 'active');
        const canManage = isSuperAdmin || can(Permissions.INCOME_CATEGORY_UPDATE) || can(Permissions.SETTING_UPDATE);
        return (
          <div className="flex items-center gap-2.5">
            <StatusBadge status={isActive ? 'active' : 'inactive'} />
            {canManage && (
              <Switch
                checked={isActive}
                disabled={togglingId === cat.id}
                onChange={() => handleToggleStatus(cat)}
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
      render: (cat) => {
        const canManage = isSuperAdmin || can(Permissions.INCOME_CATEGORY_UPDATE) || can(Permissions.SETTING_UPDATE);
        const canDelete = isSuperAdmin || can(Permissions.INCOME_CATEGORY_DELETE) || can(Permissions.SETTING_UPDATE);

        return (
          <div className="flex items-center justify-end gap-1.5">
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50"
                onClick={() => handleOpenEditModal(cat)}
                title="Edit Category"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                onClick={() => setDeleteTarget(cat)}
                title="Delete Category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const canManage = isSuperAdmin || can(Permissions.INCOME_CATEGORY_UPDATE) || can(Permissions.SETTING_UPDATE);
  const canDelete = isSuperAdmin || can(Permissions.INCOME_CATEGORY_DELETE) || can(Permissions.SETTING_UPDATE);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-soft shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
              Income Categories Master
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-100">
                Setting Master
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Define standard event collection amounts, pass allowances, and sponsorship / advertisement categories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCategories}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <PermissionGuard
            permissions={[
              Permissions.INCOME_CATEGORY_CREATE,
              Permissions.INCOME_CATEGORY_MANAGE,
              Permissions.SETTING_UPDATE,
            ]}
          >
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-2xs"
            >
              Add Income Category
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        search={search}
        onSearchChange={handleSearchSubmit}
        searchPlaceholder="Search by category name, code, or type..."
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            {isSuperAdmin && (
              <select
                value={societyFilter}
                onChange={(e) => {
                  setSocietyFilter(e.target.value);
                  setMeta((prev) => ({ ...prev, page: 1 }));
                }}
                className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
              >
                <option value="">All Societies & Global</option>
                <option value="general">🌐 Global / General Purpose Only</option>
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>
                    🏢 {s.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={categoryTypeFilter}
              onChange={(e) => {
                setCategoryTypeFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
            >
              <option value="">All Income Types</option>
              <option value="collection">Event Collection</option>
              <option value="sponsorship">Sponsorship / Ads</option>
              <option value="stall">Food / Activity Stall</option>
              <option value="donation">Voluntary Donation</option>
              <option value="other">Other Income</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        }
      />

      {/* Main Table / Mobile Cards */}
      <Card noPadding className="border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={categories}
            isLoading={isLoading}
            emptyText="No income categories found. Click 'Add Income Category' to create standard collection heads."
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(key) => {
              if (sortBy === key) {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
              } else {
                setSortBy(key);
                setSortOrder('asc');
              }
            }}
          />
        </div>

        {/* Mobile / Tablet Responsive Card View */}
        <div className="md:hidden divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
              <p className="text-xs font-medium text-slate-600">Loading income categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-3">
                <Coins className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800">No income categories found</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Try adjusting your search or filters, or tap "Add Income Category" above to create one.
              </p>
            </div>
          ) : (
            categories.map((cat) => {
              const isGeneral = !cat.societyId && !cat.society_id;
              const isActive = cat.isActive ?? cat.is_active ?? (cat.status === 'active');
              const displayOrder = cat.displayOrder ?? cat.display_order ?? 0;
              const amount = Number(cat.defaultAmount ?? cat.default_amount ?? 0);
              const passes = Number(cat.defaultSnackPasses ?? cat.default_snack_passes ?? 0);
              const categoryType = cat.categoryType || cat.category_type || 'collection';

              return (
                <div key={cat.id} className="p-4 space-y-3 transition-colors hover:bg-slate-50/50">
                  {/* Top Bar: Icon, Name, Scope, Status */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs text-white text-sm font-bold bg-gradient-to-tr from-emerald-600 to-teal-600 ring-2 ring-white">
                      <Coins className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-sm text-slate-900 leading-snug break-words">
                          {cat.name}
                        </h3>
                        <StatusBadge status={isActive ? 'active' : 'inactive'} size="sm" />
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {cat.code && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-semibold">
                            {cat.code}
                          </span>
                        )}
                        {getTypeBadge(categoryType)}
                        {isGeneral ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                            <Globe className="w-2.5 h-2.5 text-emerald-600" />
                            Global
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-medium truncate max-w-[150px]"
                            title={cat.society?.name || 'Society'}
                          >
                            <Building2 className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                            <span className="truncate">{cat.society?.name || 'Society Specific'}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description (if available) */}
                  {cat.description && (
                    <p className="text-xs text-slate-600 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100 leading-relaxed break-words">
                      {cat.description}
                    </p>
                  )}

                  {/* Badges / Metrics */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-bold text-xs">
                      <CircleDollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      ₹{amount.toLocaleString('en-IN')}
                    </span>

                    {passes > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-semibold">
                        <Ticket className="w-3 h-3 text-amber-600" />
                        {passes} Passes
                      </span>
                    )}

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] font-mono font-medium">
                      <Hash className="w-3 h-3 text-slate-400" />
                      Order: {displayOrder}
                    </span>

                    {(cat.collectionsCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Home className="w-3 h-3 text-emerald-600" />
                        {cat.collectionsCount} Flats
                      </span>
                    )}

                    {(cat.sponsorsCount ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <Megaphone className="w-3 h-3 text-amber-600" />
                        {cat.sponsorsCount} Sponsors
                      </span>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {canManage && (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isActive}
                            disabled={togglingId === cat.id}
                            onChange={() => handleToggleStatus(cat)}
                          />
                          <span className="text-xs font-medium text-slate-600">
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(cat)}
                          className="text-slate-700 hover:text-emerald-600 hover:bg-emerald-50 text-xs px-2.5 py-1 h-7.5"
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                        >
                          Edit
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(cat)}
                          className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs px-2.5 py-1 h-7.5"
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

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
          <Pagination meta={meta} onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))} />
        </div>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
            <span>{isEditing ? 'Edit Income Category' : 'Create New Income Category'}</span>
          </div>
        }
        description="Categories defined here will be available when recording flat collections and sponsor advertisements."
      >
        <form onSubmit={handleSubmitForm} className="space-y-3.5">
          {isSuperAdmin && (
            <Select
              label="Society Assignment (Optional for Super Admin)"
              value={formData.societyId}
              onChange={(e) => setFormData({ ...formData, societyId: e.target.value })}
              helperText="Select a specific society, or leave as General Purpose to make this category available to all societies."
            >
              <option value="">🌐 General Purpose / Global (All Societies)</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  🏢 {s.name}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Category Name"
            placeholder="e.g. Navratri Flat Contribution, Front Gate Banner, Stage Backdrop"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Income Classification Type"
              value={formData.categoryType}
              onChange={(e) => setFormData({ ...formData, categoryType: e.target.value as any })}
              options={[
                { label: 'Resident / Flat Collection', value: 'collection' },
                { label: 'Advertisement / Sponsorship', value: 'advertisement' },
                { label: 'Donation', value: 'donation' },
                { label: 'Other Income', value: 'other' },
              ]}
              required
            />

            <Input
              label="Category Code (Optional)"
              placeholder="e.g. FLAT_COLL, ADV_GATE, ADV_STAGE"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Default Amount (₹)"
              type="number"
              placeholder="5000"
              value={formData.defaultAmount}
              onChange={(e) => setFormData({ ...formData, defaultAmount: parseFloat(e.target.value) || 0 })}
              error={formErrors.defaultAmount}
              helperText="Suggested collection or advertisement amount"
            />

            <Input
              label="Default Snack Passes"
              type="number"
              placeholder="0"
              value={formData.defaultSnackPasses}
              onChange={(e) => setFormData({ ...formData, defaultSnackPasses: parseInt(e.target.value, 10) || 0 })}
              error={formErrors.defaultSnackPasses}
              helperText="Passes allotted upon payment"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Sort / Display Order"
              type="number"
              placeholder="0"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <Textarea
            label="Description / Terms"
            placeholder="Additional context, sponsor requirements, or collection guidelines..."
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onChange={(val) => setFormData({ ...formData, isActive: val })}
                label="Active & Enabled for Collections"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700">
                {isEditing ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Income Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Category"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default IncomeCategoryListPage;
