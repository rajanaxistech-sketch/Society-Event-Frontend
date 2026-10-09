import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseCategoriesService } from '../../api/expenseCategoriesService';
import { societiesService } from '../../api/societiesService';
import { ExpenseCategoryItem, PaginationMeta, SocietyItem } from '../../types';
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
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Switch from '../../components/ui/Switch';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import ThemedSelect from '../../components/ui/ThemedSelect';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { useDebounce } from '../../hooks/useDebounce';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Palette,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  Hash,
  Sliders,
  Building2,
  Globe,
  ArrowLeft,
  Search,
  X,
} from 'lucide-react';

const COLOR_PRESETS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#64748B', // Slate
];

export const ExpenseCategoryListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can, isSuperAdmin, isAdmin } = usePermission();

  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
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
    description: '',
    colorCode: '#6366F1',
    displayOrder: 0,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategoryItem | null>(null);
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
      const res = await expenseCategoriesService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: debouncedSearch || undefined,
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
      toast.error(extractErrorMessage(err, 'Failed to load expense categories'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [meta.page, meta.limit, debouncedSearch, statusFilter, societyFilter, sortBy, sortOrder]);

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
      description: '',
      colorCode: COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)],
      displayOrder: (meta.total || 0) + 1,
      isActive: true,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: ExpenseCategoryItem) => {
    setIsEditing(true);
    setCurrentId(cat.id);
    setFormData({
      name: cat.name || '',
      code: cat.code || '',
      societyId: cat.societyId || cat.society_id || '',
      description: cat.description || '',
      colorCode: cat.colorCode || cat.color_code || '#6366F1',
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
        description: formData.description.trim() || null,
        colorCode: formData.colorCode,
        displayOrder: Number(formData.displayOrder) || 0,
        isActive: formData.isActive,
      };

      if (isEditing && currentId) {
        const res = await expenseCategoriesService.update(currentId, payload);
        if (res.success) {
          toast.success('Expense category updated successfully');
          setIsModalOpen(false);
          await fetchCategories();
        }
      } else {
        const res = await expenseCategoriesService.create(payload);
        if (res.success) {
          toast.success('Expense category created successfully');
          setIsModalOpen(false);
          await fetchCategories();
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save expense category'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (cat: ExpenseCategoryItem) => {
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

      const res = await expenseCategoriesService.update(cat.id, { isActive: nextStatus });
      if (res.success) {
        toast.success(`Category "${cat.name}" marked ${nextStatus ? 'Active' : 'Inactive'}`);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Status toggle failed'));
      await fetchCategories();
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await expenseCategoriesService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Category "${deleteTarget.name}" deleted successfully.`);
        setDeleteTarget(null);
        await fetchCategories();
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete expense category'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<ExpenseCategoryItem>[] = [
    {
      key: 'name',
      header: 'Category Details',
      sortable: true,
      render: (cat) => {
        const color = cat.colorCode || cat.color_code || '#6366F1';
        const isGeneral = !cat.societyId && !cat.society_id;
        return (
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs text-white text-xs font-bold ring-2 ring-white"
              style={{ backgroundColor: color }}
            >
              <Tag className="w-4 h-4" />
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
      key: 'display_order',
      header: 'Sort Order',
      sortable: true,
      render: (cat) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-xs font-mono font-medium">
          <Hash className="w-3 h-3 text-slate-400" />
          {cat.displayOrder ?? cat.display_order ?? 0}
        </span>
      ),
    },
    {
      key: 'usage',
      header: 'Allocated Contracts',
      render: (cat) => (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            <Briefcase className="w-3 h-3 text-indigo-500" />
            {cat.contractsCount ?? 0} Contracts
          </span>
          {(cat.itemsCount ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
              <Layers className="w-3 h-3 text-slate-400" />
              {cat.itemsCount} Items
            </span>
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
        const canManage = isSuperAdmin || can(Permissions.EXPENSE_CATEGORY_UPDATE) || can(Permissions.SETTING_UPDATE);
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
        const canManage = isSuperAdmin || can(Permissions.EXPENSE_CATEGORY_UPDATE) || can(Permissions.SETTING_UPDATE);
        const canDelete = isSuperAdmin || can(Permissions.EXPENSE_CATEGORY_DELETE) || can(Permissions.SETTING_UPDATE);

        return (
          <div className="flex items-center justify-end gap-1.5">
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
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

  const canManage = isSuperAdmin || can(Permissions.EXPENSE_CATEGORY_UPDATE) || can(Permissions.SETTING_UPDATE);
  const canDelete = isSuperAdmin || can(Permissions.EXPENSE_CATEGORY_DELETE) || can(Permissions.SETTING_UPDATE);
  const canCreate = isSuperAdmin || can(Permissions.EXPENSE_CATEGORY_CREATE) || can(Permissions.EXPENSE_CATEGORY_MANAGE) || can(Permissions.SETTING_UPDATE);

  return (
    <div className="space-y-2.5 max-w-7xl mx-auto pb-6">
      {/* Ultra-Compact & Clean Top Header */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate(AppRoutes.EXPENSE)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 transition-colors"
            title="Back to Expense Menu"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">
              Expense Categories
            </h1>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100 shrink-0">
              {meta.total}
            </span>
          </div>
        </div>

        {/* Compact Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={fetchCategories}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            title="Refresh Categories"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category</span>
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
            onChange={(e) => handleSearchSubmit(e.target.value)}
            placeholder="Search category name or code..."
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

        {/* Compact Society Filter (SuperAdmin Only) */}
        {isSuperAdmin && (
          <div className="w-auto min-w-[125px] sm:min-w-[145px] shrink-0">
            <ThemedSelect
              value={societyFilter}
              onChange={(val) => {
                setSocietyFilter(val);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              options={[
                { value: '', label: 'All Scopes' },
                { value: 'general', label: 'Global Scope', icon: <Globe className="w-3 h-3 text-emerald-600" /> },
                ...societies.map((s) => ({
                  value: s.id,
                  label: s.name,
                  icon: <Building2 className="w-3 h-3 text-blue-600" />,
                })),
              ]}
              placeholder="All Scopes"
              variant="indigo"
              size="sm"
              align="right"
              menuWidth="w-52"
              searchable={societies.length > 4}
            />
          </div>
        )}

        {/* Compact Themed Status Select */}
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
            menuWidth="w-40"
            searchable={false}
          />
        </div>
      </div>

      {/* Main Table / Mobile Cards */}
      <Card noPadding className="border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={categories}
            isLoading={isLoading}
            emptyText="No expense categories found. Click 'Add Category' above to create standard heads."
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(key) => {
              if (sortBy === key) {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
              } else {
                setSortOrder('asc');
                setSortBy(key);
              }
            }}
          />
        </div>

        {/* Mobile Responsive Compact Card View */}
        <div className="md:hidden divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mb-2" />
              <p className="text-xs font-medium text-slate-600">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2.5">
                <Tag className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No expense categories found</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                Tap "Add Category" above to create one.
              </p>
            </div>
          ) : (
            categories.map((cat) => {
              const color = cat.colorCode || cat.color_code || '#6366F1';
              const isGeneral = !cat.societyId && !cat.society_id;
              const isActive = cat.isActive ?? cat.is_active ?? (cat.status === 'active');
              const displayOrder = cat.displayOrder ?? cat.display_order ?? 0;
              const contractsCount = cat.contractsCount ?? 0;

              return (
                <div key={cat.id} className="p-3 space-y-2 transition-colors hover:bg-slate-50/50">
                  {/* Top Bar: Color Dot, Name, Code, Status Switch & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-bold text-xs text-slate-900 truncate">{cat.name}</h3>
                        {cat.code && (
                          <span className="text-[9.5px] font-mono font-medium text-slate-600 bg-slate-100 px-1 py-0.2 rounded shrink-0">
                            {cat.code}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <StatusBadge status={isActive ? 'active' : 'inactive'} size="sm" />
                      {canManage && (
                        <Switch
                          checked={isActive}
                          disabled={togglingId === cat.id}
                          onChange={() => handleToggleStatus(cat)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Description (if available) */}
                  {cat.description && (
                    <p className="text-[11.5px] text-slate-600 leading-snug line-clamp-2">
                      {cat.description}
                    </p>
                  )}

                  {/* Badges and Actions Row */}
                  <div className="flex items-center justify-between pt-1 text-[10.5px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isGeneral ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 font-medium">
                          <Globe className="w-2.5 h-2.5 text-emerald-600" />
                          Global
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 font-medium truncate max-w-[130px]">
                          <Building2 className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                          <span className="truncate">{cat.society?.name || 'Society'}</span>
                        </span>
                      )}

                      <span className="text-slate-400 font-mono">#{displayOrder}</span>

                      {contractsCount > 0 && (
                        <span className="text-indigo-600 font-medium">
                          {contractsCount} {contractsCount === 1 ? 'contract' : 'contracts'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(cat)}
                          className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(cat)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
          <Pagination meta={meta} onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))} />
        </div>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isLoading={isSubmitting}
        title={
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <span>{isEditing ? 'Edit Expense Category' : 'Create New Expense Category'}</span>
          </div>
        }
        description="Categories defined here will be available in Allocate Contract and Event Item planning."
      >
        <form onSubmit={handleSubmitForm} className="space-y-3.5">
          {isSuperAdmin && (
            <ThemedSelect
              label="Society Assignment (Scope)"
              value={formData.societyId}
              onChange={(val) => setFormData({ ...formData, societyId: val })}
              options={[
                {
                  value: '',
                  label: 'General Purpose / Global (All Societies)',
                  subLabel: 'Available across all societies',
                  icon: <Globe className="w-3.5 h-3.5 text-emerald-600" />,
                },
                ...societies.map((s) => ({
                  value: s.id,
                  label: s.name,
                  icon: <Building2 className="w-3.5 h-3.5 text-blue-600" />,
                })),
              ]}
              placeholder="Select society scope..."
              variant="indigo"
              searchable={societies.length > 5}
              helperText="Select a specific society, or leave as General Purpose to make this category available to all societies."
            />
          )}

          <Input
            label="Category Name"
            placeholder="e.g. Catering & Food, Sound & DJ, Security Services"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Category Code (Optional)"
              placeholder="e.g. CATG_CATERING, DJ_SOUND"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />

            <Input
              label="Sort / Display Order"
              type="number"
              placeholder="0"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <Palette className="w-3.5 h-3.5 text-indigo-600" />
              <span>Theme / Badge Color Code</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, colorCode: color })}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    formData.colorCode === color ? 'ring-2 ring-indigo-500 scale-110 border-white' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="color"
                  value={formData.colorCode}
                  onChange={(e) => setFormData({ ...formData, colorCode: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0.5"
                />
                <span className="text-xs font-mono text-slate-500">{formData.colorCode}</span>
              </div>
            </div>
          </div>

          <Textarea
            label="Description / Scope of Work"
            placeholder="Brief details regarding what this expense category covers..."
            rows={2}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onChange={(val) => setFormData({ ...formData, isActive: val })}
                label="Active & Enabled for Allocation"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                {isEditing ? 'Save Changes' : 'Create Category'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Expense Category"
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

export default ExpenseCategoryListPage;
