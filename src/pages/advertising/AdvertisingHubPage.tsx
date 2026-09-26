import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { advertisementCategoriesService } from '../../api/advertisementCategoriesService';
import { advertisementsService } from '../../api/advertisementsService';
import { paymentMethodsService } from '../../api/paymentMethodsService';
import { societiesService } from '../../api/societiesService';
import {
  AdvertisementCategoryItem,
  AdvertisementItem,
  AdvertisementPaymentStatus,
  PaginationMeta,
  PaymentMethodItem,
} from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../hooks/useAuth';
import { Permissions } from '../../constants/permissions';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import Spinner from '../../components/ui/Spinner';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Tag,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  FileText,
  DollarSign,
  TrendingUp,
  Search,
  Sparkles,
  Building2,
  HelpCircle,
} from 'lucide-react';
import clsx from 'clsx';

// Predefined suggestions for advertisement element placement
const ELEMENT_SUGGESTIONS = [
  'Main Entrance Banner',
  'Stage Backdrop Logo',
  'Souvenir Brochure Full Page',
  'Souvenir Brochure Half Page',
  'Event Stall / Canopy Space',
  'LED Video Screen Reel',
  'Gate Arch Branding',
  'Activity Area Standee',
  'Event Pamphlet Insertion',
  'Digital App Notice Banner',
];

const formatPaymentMethodName = (m: PaymentMethodItem) => {
  if (!m) return '';
  const code = (m.code || '').trim();
  const name = (m.name || '').trim();

  if (name && name.toLowerCase() !== code.toLowerCase()) {
    return name;
  }

  const raw = name || code;
  if (raw.toUpperCase() === 'UPI') return 'UPI / QR Code';
  if (raw.toUpperCase() === 'BANK_TRANSFER') return 'Bank Transfer (NEFT/RTGS)';
  if (raw.toUpperCase() === 'CASH') return 'Cash';
  if (raw.toUpperCase() === 'CHEQUE') return 'Cheque';
  if (raw.toUpperCase() === 'ONLINE') return 'Online Portal';

  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const AdvertisingHubPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'ads'; // 'ads' or 'categories'
  const [activeTab, setActiveTab] = useState<'ads' | 'categories'>(
    activeTabParam === 'categories' ? 'categories' : 'ads'
  );

  const toast = useToast();
  const { can, isSuperAdmin } = usePermission();
  const { selectedSocietyId } = useAuth();

  // Sync tab with URL query param
  const handleTabChange = (tab: 'ads' | 'categories') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // ==========================================
  // SHARED MASTER DATA
  // ==========================================
  const [allCategories, setAllCategories] = useState<AdvertisementCategoryItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [societies, setSocieties] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch reference masters
  const loadMasterData = async () => {
    try {
      const [catRes, payRes] = await Promise.all([
        advertisementCategoriesService.getAll({
          limit: 100,
          societyId: selectedSocietyId || undefined,
          status: 'active',
        }).catch(() => null),
        paymentMethodsService.getAll().catch(() => null),
      ]);

      if (catRes?.success && catRes.data) {
        setAllCategories(catRes.data);
      }
      if (payRes?.success && payRes.data) {
        setPaymentMethods(payRes.data);
      }

      if (isSuperAdmin) {
        const socRes = await societiesService.getAll({ limit: 100 }).catch(() => null);
        if (socRes?.success && socRes.data) {
          setSocieties(socRes.data.map((s: any) => ({ id: s.id, name: s.name })));
        }
      }
    } catch (err) {
      console.error('Failed to load master data', err);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, [selectedSocietyId, isSuperAdmin]);

  // ==========================================
  // 1. ADVERTISEMENTS STATE & LOGIC
  // ==========================================
  const [ads, setAds] = useState<AdvertisementItem[]>([]);
  const [adsMeta, setAdsMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsSearch, setAdsSearch] = useState('');
  const [adsStatusFilter, setAdsStatusFilter] = useState('');
  const [adsCategoryFilter, setAdsCategoryFilter] = useState('');

  // Advertisement Form Modal State
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [currentAdId, setCurrentAdId] = useState<string | null>(null);
  const [adFormData, setAdFormData] = useState({
    element: '',
    advertisementCategoryId: '',
    modeOfPayment: 'UPI',
    paymentStatus: 'pending' as AdvertisementPaymentStatus,
    remarks: '',
    societyId: '',
  });
  const [adFormErrors, setAdFormErrors] = useState<Record<string, string>>({});
  const [isAdSubmitting, setIsAdSubmitting] = useState(false);

  // Advertisement Delete State
  const [adDeleteTarget, setAdDeleteTarget] = useState<AdvertisementItem | null>(null);
  const [isDeletingAd, setIsDeletingAd] = useState(false);

  const fetchAds = async () => {
    try {
      setAdsLoading(true);
      const res = await advertisementsService.getAll({
        page: adsMeta.page,
        limit: adsMeta.limit,
        search: adsSearch || undefined,
        paymentStatus: adsStatusFilter || undefined,
        advertisementCategoryId: adsCategoryFilter || undefined,
        societyId: selectedSocietyId || undefined,
      });

      if (res.success && res.data) {
        setAds(res.data);
        if (res.meta) {
          setAdsMeta(res.meta);
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load advertisements'));
    } finally {
      setAdsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ads') {
      fetchAds();
    }
  }, [activeTab, adsMeta.page, adsSearch, adsStatusFilter, adsCategoryFilter, selectedSocietyId]);

  const handleOpenCreateAdModal = () => {
    setIsEditingAd(false);
    setCurrentAdId(null);
    setAdFormData({
      element: '',
      advertisementCategoryId: allCategories.length > 0 ? allCategories[0].id : '',
      modeOfPayment: paymentMethods.length > 0 ? paymentMethods[0].code : 'UPI',
      paymentStatus: 'pending',
      remarks: '',
      societyId: selectedSocietyId || '',
    });
    setAdFormErrors({});
    setIsAdModalOpen(true);
  };

  const handleOpenEditAdModal = (item: AdvertisementItem) => {
    setIsEditingAd(true);
    setCurrentAdId(item.id);
    setAdFormData({
      element: item.element,
      advertisementCategoryId: item.advertisementCategoryId || (item as any).advertisement_category_id || '',
      modeOfPayment: item.modeOfPayment || (item as any).mode_of_payment || 'CASH',
      paymentStatus: (item.paymentStatus || (item as any).payment_status || 'pending') as AdvertisementPaymentStatus,
      remarks: item.remarks || '',
      societyId: item.societyId || (item as any).society_id || selectedSocietyId || '',
    });
    setAdFormErrors({});
    setIsAdModalOpen(true);
  };

  const validateAdForm = () => {
    const errors: Record<string, string> = {};
    if (!adFormData.element.trim()) {
      errors.element = 'Element / Placement is required';
    }
    if (!adFormData.advertisementCategoryId) {
      errors.advertisementCategoryId = 'Please select an Advertisement Category';
    }
    if (!adFormData.modeOfPayment.trim()) {
      errors.modeOfPayment = 'Mode of Payment is required';
    }
    if (!['pending', 'partial', 'completed'].includes(adFormData.paymentStatus)) {
      errors.paymentStatus = 'Payment status must be Pending, Partial, or Completed';
    }
    setAdFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAdForm()) return;

    try {
      setIsAdSubmitting(true);
      if (isEditingAd && currentAdId) {
        await advertisementsService.update(currentAdId, {
          element: adFormData.element.trim(),
          advertisementCategoryId: adFormData.advertisementCategoryId,
          modeOfPayment: adFormData.modeOfPayment,
          paymentStatus: adFormData.paymentStatus,
          remarks: adFormData.remarks.trim() || null,
          societyId: adFormData.societyId || undefined,
        });
        toast.success('Advertisement updated successfully');
      } else {
        await advertisementsService.create({
          element: adFormData.element.trim(),
          advertisementCategoryId: adFormData.advertisementCategoryId,
          modeOfPayment: adFormData.modeOfPayment,
          paymentStatus: adFormData.paymentStatus,
          remarks: adFormData.remarks.trim() || null,
          societyId: adFormData.societyId || undefined,
        });
        toast.success('Advertisement created successfully');
      }
      setIsAdModalOpen(false);
      fetchAds();
      loadMasterData();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save advertisement'));
    } finally {
      setIsAdSubmitting(false);
    }
  };

  const handleDeleteAd = async () => {
    if (!adDeleteTarget) return;
    try {
      setIsDeletingAd(true);
      await advertisementsService.delete(adDeleteTarget.id);
      toast.success('Advertisement deleted successfully');
      setAdDeleteTarget(null);
      fetchAds();
      loadMasterData();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete advertisement'));
    } finally {
      setIsDeletingAd(false);
    }
  };

  // ==========================================
  // 2. ADVERTISEMENT CATEGORIES STATE & LOGIC
  // ==========================================
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

  // Category Delete State
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
    if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab, catMeta.page, catSearch, catStatusFilter, selectedSocietyId]);

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
      loadMasterData();
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
      loadMasterData();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete category'));
    } finally {
      setIsDeletingCat(false);
    }
  };

  // ==========================================
  // SUMMARY CALCULATIONS
  // ==========================================
  const adsStats = useMemo(() => {
    let completed = 0;
    let partial = 0;
    let pending = 0;
    let totalRevenue = 0;

    ads.forEach((ad) => {
      const status = (ad.paymentStatus || (ad as any).payment_status || 'pending').toLowerCase();
      const amount = Number(ad.advertisementCategory?.categoryAmount || (ad.advertisementCategory as any)?.category_amount || 0);

      if (status === 'completed') {
        completed += 1;
        totalRevenue += amount;
      } else if (status === 'partial') {
        partial += 1;
        totalRevenue += amount * 0.5; // Estimated realization
      } else {
        pending += 1;
      }
    });

    return { total: adsMeta.total || ads.length, completed, partial, pending, totalRevenue };
  }, [ads, adsMeta.total]);

  // Payment Status Badge Helper
  const renderPaymentStatusBadge = (status: string) => {
    const norm = (status || '').toLowerCase();
    if (norm === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed
        </span>
      );
    }
    if (norm === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-600" />
          Partial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <AlertCircle className="w-3 h-3 text-amber-600" />
        Pending
      </span>
    );
  };

  // Format Currency
  const formatCurrency = (amount: number | string | undefined) => {
    const val = Number(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200 pb-8">
      {/* Header Section */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Advertising & Sponsorships
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage advertisement categories, commercial spots, and tracking
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            {activeTab === 'ads' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateAdModal}
                className="w-full sm:w-auto shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Advertisement
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateCatModal}
                className="w-full sm:w-auto shadow-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Category
              </Button>
            )}
          </div>
        </div>

        {/* Segmented Navigation Tab Switcher */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTabChange('ads')}
            className={clsx(
              'flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all duration-150',
              activeTab === 'ads'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            )}
          >
            <Megaphone className="w-3.5 h-3.5" />
            <span>Advertisements</span>
            {adsMeta.total > 0 && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  activeTab === 'ads' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                )}
              >
                {adsMeta.total}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('categories')}
            className={clsx(
              'flex-1 sm:flex-none flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold transition-all duration-150',
              activeTab === 'categories'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Advertisement Categories</span>
            {catMeta.total > 0 && (
              <span
                className={clsx(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  activeTab === 'categories' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                )}
              >
                {catMeta.total}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: ADVERTISEMENTS TAB */}
      {/* ========================================================================= */}
      {activeTab === 'ads' && (
        <div className="space-y-4">
          {/* Advertisements Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
                Total Ads
              </span>
              <p className="text-xl font-bold text-slate-800 mt-1">{adsStats.total}</p>
            </div>
            <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/60 shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">
                Completed
              </span>
              <p className="text-xl font-bold text-emerald-800 mt-1">{adsStats.completed}</p>
            </div>
            <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200/60 shadow-2xs">
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">
                Partial
              </span>
              <p className="text-xl font-bold text-blue-800 mt-1">{adsStats.partial}</p>
            </div>
            <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/60 shadow-2xs">
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
                Pending
              </span>
              <p className="text-xl font-bold text-amber-800 mt-1">{adsStats.pending}</p>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={adsSearch}
                onChange={(e) => {
                  setAdsSearch(e.target.value);
                  setAdsMeta((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="Search by element, category, payment mode..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={adsStatusFilter}
                onChange={(e) => {
                  setAdsStatusFilter(e.target.value);
                  setAdsMeta((prev) => ({ ...prev, page: 1 }));
                }}
                className="flex-1 sm:flex-none text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="completed">Completed</option>
              </select>

              <select
                value={adsCategoryFilter}
                onChange={(e) => {
                  setAdsCategoryFilter(e.target.value);
                  setAdsMeta((prev) => ({ ...prev, page: 1 }));
                }}
                className="flex-1 sm:flex-none text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All Categories</option>
                {allCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.categoryName || (c as any).category_name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => fetchAds()}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
                title="Refresh Advertisements"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Advertisements List */}
          {adsLoading ? (
            <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center border border-slate-200/80 shadow-xs">
              <Spinner size="md" label="Loading advertisements..." />
            </div>
          ) : ads.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <Megaphone className="w-7 h-7" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">No advertisements found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                {adsSearch || adsStatusFilter || adsCategoryFilter
                  ? 'No advertisement matched your search or filters.'
                  : 'Get started by adding your first advertisement spot or commercial entry.'}
              </p>
              <div className="mt-4">
                <Button size="sm" variant="primary" onClick={handleOpenCreateAdModal}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Advertisement
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mobile Card List (shown on mobile, responsive) */}
              <div className="grid grid-cols-1 gap-3">
                {ads.map((ad) => {
                  const cat = ad.advertisementCategory;
                  const catName = cat?.categoryName || (cat as any)?.category_name || 'Category';
                  const catAmount = cat?.categoryAmount ?? (cat as any)?.category_amount ?? 0;
                  const paymentMode = ad.modeOfPayment || (ad as any).mode_of_payment || 'CASH';
                  const paymentStatus = ad.paymentStatus || (ad as any).payment_status || 'pending';

                  return (
                    <div
                      key={ad.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-200/80 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10.5px] font-bold border border-indigo-100">
                              {catName}
                            </span>
                            {renderPaymentStatusBadge(paymentStatus)}
                          </div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug break-words">
                            {ad.element}
                          </h4>
                        </div>

                        {/* Amount & Actions */}
                        <div className="text-right shrink-0">
                          <div className="text-sm font-extrabold text-slate-900">
                            {formatCurrency(catAmount)}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAdModal(ad)}
                              className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200/80 flex items-center justify-center transition-all"
                              title="Edit Advertisement"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdDeleteTarget(ad)}
                              className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 flex items-center justify-center transition-all"
                              title="Delete Advertisement"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Details row */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                          <span>Mode: <strong className="text-slate-700">{paymentMode}</strong></span>
                        </div>
                        {ad.remarks && (
                          <p className="text-[11px] text-slate-600 italic bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 max-w-full truncate">
                            "{ad.remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {adsMeta.totalPages > 1 && (
                <div className="pt-2 flex justify-center">
                  <Pagination
                    meta={adsMeta}
                    onPageChange={(p) => setAdsMeta((prev) => ({ ...prev, page: p }))}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ADVERTISEMENT CATEGORIES TAB */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* Category Metric Info Bar */}
          <div className="bg-indigo-50/60 rounded-2xl p-3.5 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Categories define advertisement pricing, availability slots, and sponsorship types.
              </span>
            </div>
            <span className="font-bold text-indigo-700 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200 shadow-2xs">
              {catMeta.total} {catMeta.total === 1 ? 'Category' : 'Categories'}
            </span>
          </div>

          {/* Search & Refresh */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catSearch}
                onChange={(e) => {
                  setCatSearch(e.target.value);
                  setCatMeta((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="Search category name or description..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={() => fetchCategories()}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
              title="Refresh Categories"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Category Cards List */}
          {catLoading ? (
            <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center border border-slate-200/80 shadow-xs">
              <Spinner size="md" label="Loading advertisement categories..." />
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-200/80 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">No categories created yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Add categories like Banner Advertisement, Event Sponsor, Stall Space to start accepting ads.
              </p>
              <div className="mt-4">
                <Button size="sm" variant="primary" onClick={handleOpenCreateCatModal}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Category
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map((c) => {
                  const name = c.categoryName || (c as any).category_name || '';
                  const amount = c.categoryAmount ?? (c as any).category_amount ?? 0;
                  const units = c.numberOfUnits ?? (c as any).number_of_units ?? 1;
                  const desc = c.categoryDescription || (c as any).category_description || '';
                  const adsCount = c.advertisementsCount ?? (c as any)._count?.advertisements ?? 0;

                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-200/80 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 leading-tight">
                              {name}
                            </h4>
                            <span className="inline-block text-[11px] font-semibold text-indigo-600 mt-0.5">
                              {units} {units === 1 ? 'Unit Available' : 'Units Available'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-slate-900 block">
                              {formatCurrency(amount)}
                            </span>
                          </div>
                        </div>

                        {desc ? (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                            {desc}
                          </p>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic mt-1">
                            No description provided
                          </p>
                        )}
                      </div>

                      {/* Footer Info & Actions */}
                      <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                          <strong>{adsCount}</strong> Active {adsCount === 1 ? 'Ad' : 'Ads'}
                        </span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCatModal(c)}
                            className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200/80 flex items-center justify-center transition-all"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCatDeleteTarget(c)}
                            className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 flex items-center justify-center transition-all"
                            title="Delete Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT ADVERTISEMENT */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        title={isEditingAd ? 'Edit Advertisement' : 'Add Advertisement'}
        size="md"
      >
        <form onSubmit={handleSaveAd} className="space-y-4">
          {/* Select Element */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Element <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-1.5">
              <input
                type="text"
                list="element-suggestions"
                value={adFormData.element}
                onChange={(e) => setAdFormData({ ...adFormData, element: e.target.value })}
                placeholder="e.g. Main Entrance Banner, Stage Backdrop"
                className={clsx(
                  'w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all',
                  adFormErrors.element ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                )}
              />
              <datalist id="element-suggestions">
                {ELEMENT_SUGGESTIONS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </div>
            {adFormErrors.element && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{adFormErrors.element}</p>
            )}
          </div>

          {/* Select Advertisement Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Advertisement Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={adFormData.advertisementCategoryId}
              onChange={(e) => setAdFormData({ ...adFormData, advertisementCategoryId: e.target.value })}
              className={clsx(
                'w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all',
                adFormErrors.advertisementCategoryId ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              )}
            >
              <option value="">-- Choose Category --</option>
              {allCategories.map((cat) => {
                const cName = cat.categoryName || (cat as any).category_name;
                const cAmt = cat.categoryAmount ?? (cat as any).category_amount ?? 0;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cName} ({formatCurrency(cAmt)})
                  </option>
                );
              })}
            </select>
            {allCategories.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">
                No categories found. Create a category in the "Advertisement Categories" tab first.
              </p>
            )}
            {adFormErrors.advertisementCategoryId && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">
                {adFormErrors.advertisementCategoryId}
              </p>
            )}
          </div>

          {/* Mode of Payment & Payment Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Mode of Payment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mode of Payment <span className="text-rose-500">*</span>
              </label>
              <select
                value={adFormData.modeOfPayment}
                onChange={(e) => setAdFormData({ ...adFormData, modeOfPayment: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800"
              >
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((m) => (
                    <option key={m.id} value={m.code}>
                      {formatPaymentMethodName(m)}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="ONLINE">Online Portal</option>
                  </>
                )}
              </select>
            </div>

            {/* Payment Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={adFormData.paymentStatus}
                onChange={(e) =>
                  setAdFormData({ ...adFormData, paymentStatus: e.target.value as AdvertisementPaymentStatus })
                }
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={adFormData.remarks}
              onChange={(e) => setAdFormData({ ...adFormData, remarks: e.target.value })}
              placeholder="e.g. Sponsor contact details, artwork submission status, booth location notes..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAdModalOpen(false)}
              disabled={isAdSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isAdSubmitting}>
              {isEditingAd ? 'Update Advertisement' : 'Create Advertisement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT ADVERTISEMENT CATEGORY */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title={isEditingCat ? 'Edit Advertisement Category' : 'Add Advertisement Category'}
        size="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          {/* 1. Category Name */}
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
                'w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all',
                catFormErrors.categoryName ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              )}
            />
            {catFormErrors.categoryName && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{catFormErrors.categoryName}</p>
            )}
          </div>

          {/* 2. Category Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category Description
            </label>
            <textarea
              rows={3}
              value={catFormData.categoryDescription}
              onChange={(e) => setCatFormData({ ...catFormData, categoryDescription: e.target.value })}
              placeholder="e.g. Main entrance banner advertisement with 10x4 ft dimension specifications."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* 3 & 4. Category Amount & Category Units */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Amount */}
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
                    'w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all',
                    catFormErrors.categoryAmount ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                  )}
                />
              </div>
              {catFormErrors.categoryAmount && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{catFormErrors.categoryAmount}</p>
              )}
            </div>

            {/* Category Units */}
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
                  'w-full px-3 py-2 text-xs bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all',
                  catFormErrors.numberOfUnits ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                )}
              />
              {catFormErrors.numberOfUnits && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">{catFormErrors.numberOfUnits}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
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

      {/* ========================================================================= */}
      {/* CONFIRM DIALOGS: DELETE */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={!!adDeleteTarget}
        onClose={() => setAdDeleteTarget(null)}
        onConfirm={handleDeleteAd}
        title="Delete Advertisement"
        message={`Are you sure you want to delete the advertisement "${adDeleteTarget?.element}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeletingAd}
      />

      <ConfirmDialog
        isOpen={!!catDeleteTarget}
        onClose={() => setCatDeleteTarget(null)}
        onConfirm={handleDeleteCategory}
        title="Delete Category"
        message={`Are you sure you want to delete the advertisement category "${catDeleteTarget?.categoryName || (catDeleteTarget as any)?.category_name}"?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeletingCat}
      />
    </div>
  );
};

export default AdvertisingHubPage;
