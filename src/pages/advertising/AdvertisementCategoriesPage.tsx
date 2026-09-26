import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { advertisementCategoriesService } from '../../api/advertisementCategoriesService';
import { AdvertisementCategoryItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { AppRoutes } from '../../constants/routes';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  ArrowLeft,
  Layers,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
} from 'lucide-react';
import clsx from 'clsx';

export const AdvertisementCategoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedSocietyId } = useAuth();

  const [categories, setCategories] = useState<AdvertisementCategoryItem[]>([]);
  const [catMeta, setCatMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [catLoading, setCatLoading] = useState(true);
  const [catSearch, setCatSearch] = useState('');
  const [catStatusFilter, setCatStatusFilter] = useState('');

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isEditingCat, setIsEditingCat] = useState(false);
  const [currentCatId, setCurrentCatId] = useState<string | null>(null);
  const [catFormData, setCatFormData] = useState({
    categoryName: '',
    categoryAmount: '' as number | string,
    categoryDescription: '',
    numberOfUnits: 1 as number | string,
    societyId: '',
  });
  const [catFormErrors, setCatFormErrors] = useState<Record<string, string>>({});
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);

  // Delete State
  const [catDeleteTarget, setCatDeleteTarget] = useState<AdvertisementCategoryItem | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      const res = await advertisementCategoriesService.getAll({
        page: catMeta.page,
        limit: catMeta.limit,
        search: catSearch || undefined,
        status: catStatusFilter || undefined,
        societyId: selectedSocietyId || undefined,
      });

      if (res.success && res.data) {
        setCategories(res.data);
        if (res.meta) {
          setCatMeta(res.meta);
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load advertisement categories'));
    } finally {
      setCatLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [catMeta.page, catSearch, catStatusFilter, selectedSocietyId]);

  const handleOpenCreateCatModal = () => {
    setIsEditingCat(false);
    setCurrentCatId(null);
    setCatFormData({
      categoryName: '',
      categoryAmount: '',
      categoryDescription: '',
      numberOfUnits: 1,
      societyId: selectedSocietyId || '',
    });
    setCatFormErrors({});
    setIsCatModalOpen(true);
  };

  const handleOpenEditCatModal = (item: AdvertisementCategoryItem) => {
    setIsEditingCat(true);
    setCurrentCatId(item.id);
    setCatFormData({
      categoryName: item.categoryName || (item as any).category_name || '',
      categoryAmount: item.categoryAmount ?? (item as any).category_amount ?? 0,
      categoryDescription: item.categoryDescription || (item as any).category_description || '',
      numberOfUnits: item.numberOfUnits ?? (item as any).number_of_units ?? 1,
      societyId: item.societyId || (item as any).society_id || selectedSocietyId || '',
    });
    setCatFormErrors({});
    setIsCatModalOpen(true);
  };

  const validateCatForm = () => {
    const errors: Record<string, string> = {};
    if (!catFormData.categoryName.trim()) {
      errors.categoryName = 'Category Name is required';
    }
    const amountNum = Number(catFormData.categoryAmount);
    if (catFormData.categoryAmount === '' || isNaN(amountNum) || amountNum < 0) {
      errors.categoryAmount = 'Category Amount must be a valid positive number or 0';
    }
    const unitsNum = Number(catFormData.numberOfUnits);
    if (catFormData.numberOfUnits === '' || isNaN(unitsNum) || unitsNum < 1 || !Number.isInteger(unitsNum)) {
      errors.numberOfUnits = 'Number of Units must be at least 1 (whole number)';
    }
    setCatFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCatForm()) return;

    try {
      setIsCatSubmitting(true);
      const payload = {
        categoryName: catFormData.categoryName.trim(),
        categoryAmount: Number(catFormData.categoryAmount),
        categoryDescription: catFormData.categoryDescription.trim() || null,
        numberOfUnits: Number(catFormData.numberOfUnits),
        societyId: catFormData.societyId || undefined,
      };

      if (isEditingCat && currentCatId) {
        await advertisementCategoriesService.update(currentCatId, payload);
        toast.success('Category updated successfully');
      } else {
        await advertisementCategoriesService.create(payload);
        toast.success('Category created successfully');
      }
      setIsCatModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save category'));
    } finally {
      setIsCatSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!catDeleteTarget) return;
    try {
      setIsDeletingCat(true);
      await advertisementCategoriesService.delete(catDeleteTarget.id);
      toast.success('Category deleted successfully');
      setCatDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete category'));
    } finally {
      setIsDeletingCat(false);
    }
  };

  const formatCurrency = (amount: number | string | undefined) => {
    const val = Number(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-200 pb-8">
      {/* Sleek Minimalist Header */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(AppRoutes.ADVERTISING)}
            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            title="Back to Advertising"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
              Advertisement Categories
            </h1>
            {catMeta.total > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                {catMeta.total}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateCatModal}
          className="w-8 h-8 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0"
          title="Add Category"
          aria-label="Add Category"
        >
          <Plus className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Search & Refresh Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={catSearch}
            onChange={(e) => {
              setCatSearch(e.target.value);
              setCatMeta((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Search categories..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 shadow-2xs transition-all"
          />
        </div>

        <button
          type="button"
          onClick={() => fetchCategories()}
          className="p-2 rounded-xl bg-white border border-slate-200/90 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-2xs transition-all cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={clsx('w-4 h-4', catLoading && 'animate-spin text-purple-600')} />
        </button>
      </div>

      {/* Categories List */}
      {catLoading ? (
        <div className="bg-white rounded-xl p-10 flex flex-col items-center justify-center border border-slate-200/80 shadow-2xs">
          <Spinner size="md" label="Loading advertisement categories..." />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200/80 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-2">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No categories found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Create advertisement categories to define rates and slots.
          </p>
          <div className="mt-3">
            <Button size="sm" variant="primary" onClick={handleOpenCreateCatModal}>
              <Plus className="w-4 h-4 mr-1" />
              Add Category
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 gap-2.5">
            {categories.map((c) => {
              const name = c.categoryName || (c as any).category_name || '';
              const amount = c.categoryAmount ?? (c as any).category_amount ?? 0;
              const units = c.numberOfUnits ?? (c as any).number_of_units ?? 1;
              const desc = c.categoryDescription || (c as any).category_description || '';
              const adsCount = c.advertisementsCount ?? (c as any)._count?.advertisements ?? 0;

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 hover:border-slate-300 shadow-2xs transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {name}
                        </h4>
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          {units} {units === 1 ? 'Unit' : 'Units'}
                        </span>
                        <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                          {adsCount} Active {adsCount === 1 ? 'Ad' : 'Ads'}
                        </span>
                      </div>

                      {desc && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {desc}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(amount)}
                      </span>

                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCatModal(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatDeleteTarget(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {catMeta.totalPages > 1 && (
            <div className="pt-2 flex justify-center">
              <Pagination
                meta={catMeta}
                onPageChange={(p) => setCatMeta((prev) => ({ ...prev, page: p }))}
              />
            </div>
          )}
        </div>
      )}

      {/* Modal: Add / Edit Category */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={isEditingCat ? 'Edit Advertisement Category' : 'Add Advertisement Category'}
        size="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={catFormData.categoryName}
              onChange={(e) => setCatFormData({ ...catFormData, categoryName: e.target.value })}
              placeholder="e.g. Banner Advertisement, Event Sponsor"
              className={clsx(
                'w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                catFormErrors.categoryName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              )}
            />
            {catFormErrors.categoryName && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{catFormErrors.categoryName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Description
            </label>
            <textarea
              rows={3}
              value={catFormData.categoryDescription}
              onChange={(e) => setCatFormData({ ...catFormData, categoryDescription: e.target.value })}
              placeholder="e.g. Main entrance banner advertisement with 10x4 ft dimension specifications."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={catFormData.categoryAmount}
                  onChange={(e) => setCatFormData({ ...catFormData, categoryAmount: e.target.value })}
                  placeholder="5000"
                  className={clsx(
                    'w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                    catFormErrors.categoryAmount ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  )}
                />
              </div>
              {catFormErrors.categoryAmount && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{catFormErrors.categoryAmount}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category Units <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={catFormData.numberOfUnits}
                onChange={(e) => setCatFormData({ ...catFormData, numberOfUnits: e.target.value })}
                placeholder="10"
                className={clsx(
                  'w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                  catFormErrors.numberOfUnits ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                )}
              />
              {catFormErrors.numberOfUnits && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{catFormErrors.numberOfUnits}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCatModalOpen(false)}
              disabled={isCatSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCatSubmitting}>
              {isEditingCat ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!catDeleteTarget}
        onClose={() => setCatDeleteTarget(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete the category "${catDeleteTarget?.categoryName || (catDeleteTarget as any)?.category_name}"?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeletingCat}
      />
    </div>
  );
};

export default AdvertisementCategoriesPage;
