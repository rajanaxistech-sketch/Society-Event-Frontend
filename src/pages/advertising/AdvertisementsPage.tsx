import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { advertisementsService } from '../../api/advertisementsService';
import { advertisementCategoriesService } from '../../api/advertisementCategoriesService';
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
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
} from 'lucide-react';
import clsx from 'clsx';

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

export const AdvertisementsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedSocietyId } = useAuth();

  const [ads, setAds] = useState<AdvertisementItem[]>([]);
  const [adsMeta, setAdsMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsSearch, setAdsSearch] = useState('');
  const [adsStatusFilter, setAdsStatusFilter] = useState('');
  const [adsCategoryFilter, setAdsCategoryFilter] = useState('');

  // Master options
  const [allCategories, setAllCategories] = useState<AdvertisementCategoryItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);

  // Form Modal State
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

  // Delete State
  const [adDeleteTarget, setAdDeleteTarget] = useState<AdvertisementItem | null>(null);
  const [isDeletingAd, setIsDeletingAd] = useState(false);

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
    } catch (err) {
      console.error('Failed to load master data', err);
    }
  };

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
    loadMasterData();
  }, [selectedSocietyId]);

  useEffect(() => {
    fetchAds();
  }, [adsMeta.page, adsSearch, adsStatusFilter, adsCategoryFilter, selectedSocietyId]);

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
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete advertisement'));
    } finally {
      setIsDeletingAd(false);
    }
  };

  const adsStats = useMemo(() => {
    let completed = 0;
    let partial = 0;
    let pending = 0;

    ads.forEach((ad) => {
      const status = (ad.paymentStatus || (ad as any).payment_status || 'pending').toLowerCase();
      if (status === 'completed') completed += 1;
      else if (status === 'partial') partial += 1;
      else pending += 1;
    });

    return { total: adsMeta.total || ads.length, completed, partial, pending };
  }, [ads, adsMeta.total]);

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

  const formatCurrency = (amount: number | string | undefined) => {
    const val = Number(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-3.5 animate-in fade-in duration-200 pb-8">
      {/* Header with Back Button */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(AppRoutes.ADVERTISING)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
            title="Back to Advertising"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              Advertisements
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Manage advertisements & spots</p>
          </div>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenCreateAdModal}>
          <Plus className="w-4 h-4 mr-1" />
          Add Ad
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-[10.5px] font-medium text-slate-500 uppercase tracking-wider block">
            Total Ads
          </span>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{adsStats.total}</p>
        </div>
        <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/60 shadow-2xs">
          <span className="text-[10.5px] font-semibold text-emerald-700 uppercase tracking-wider block">
            Completed
          </span>
          <p className="text-lg font-bold text-emerald-800 mt-0.5">{adsStats.completed}</p>
        </div>
        <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-200/60 shadow-2xs">
          <span className="text-[10.5px] font-semibold text-blue-700 uppercase tracking-wider block">
            Partial
          </span>
          <p className="text-lg font-bold text-blue-800 mt-0.5">{adsStats.partial}</p>
        </div>
        <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/60 shadow-2xs">
          <span className="text-[10.5px] font-semibold text-amber-700 uppercase tracking-wider block">
            Pending
          </span>
          <p className="text-lg font-bold text-amber-800 mt-0.5">{adsStats.pending}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-2">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={adsSearch}
            onChange={(e) => {
              setAdsSearch(e.target.value);
              setAdsMeta((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Search by element, category, mode..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={adsStatusFilter}
            onChange={(e) => {
              setAdsStatusFilter(e.target.value);
              setAdsMeta((prev) => ({ ...prev, page: 1 }));
            }}
            className="flex-1 sm:flex-none text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="">All Status</option>
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
            className="flex-1 sm:flex-none text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none"
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
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ads List */}
      {adsLoading ? (
        <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center border border-slate-200/80 shadow-xs">
          <Spinner size="md" label="Loading advertisements..." />
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-2">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No advertisements found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            {adsSearch || adsStatusFilter || adsCategoryFilter
              ? 'No advertisement matched your filters.'
              : 'Add your first advertisement spot.'}
          </p>
          <div className="mt-3">
            <Button size="sm" variant="primary" onClick={handleOpenCreateAdModal}>
              <Plus className="w-4 h-4 mr-1" />
              Add Advertisement
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2.5">
            {ads.map((ad) => {
              const cat = ad.advertisementCategory;
              const catName = cat?.categoryName || (cat as any)?.category_name || 'Category';
              const catAmount = cat?.categoryAmount ?? (cat as any)?.category_amount ?? 0;
              const paymentMode = ad.modeOfPayment || (ad as any).mode_of_payment || 'CASH';
              const paymentStatus = ad.paymentStatus || (ad as any).payment_status || 'pending';

              return (
                <div
                  key={ad.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-100">
                          {catName}
                        </span>
                        {renderPaymentStatusBadge(paymentStatus)}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                        {ad.element}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {formatCurrency(catAmount)}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAdModal(ad)}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200/80 flex items-center justify-center transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdDeleteTarget(ad)}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200/80 flex items-center justify-center transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-1">
                    <div className="flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      <span>Mode: <strong className="text-slate-700">{paymentMode}</strong></span>
                    </div>
                    {ad.remarks && (
                      <p className="text-[10.5px] text-slate-600 italic bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[200px]">
                        "{ad.remarks}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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

      {/* Modal: Add / Edit Advertisement */}
      <Modal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        title={isEditingAd ? 'Edit Advertisement' : 'Add Advertisement'}
        size="md"
      >
        <form onSubmit={handleSaveAd} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Element <span className="text-rose-500">*</span>
            </label>
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
            {adFormErrors.element && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{adFormErrors.element}</p>
            )}
          </div>

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
            {adFormErrors.advertisementCategoryId && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">
                {adFormErrors.advertisementCategoryId}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mode of Payment <span className="text-rose-500">*</span>
              </label>
              <select
                value={adFormData.modeOfPayment}
                onChange={(e) => setAdFormData({ ...adFormData, modeOfPayment: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              >
                {paymentMethods.length > 0 ? (
                  paymentMethods.map((m) => (
                    <option key={m.id} value={m.code}>
                      {m.name} ({m.code})
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={adFormData.remarks}
              onChange={(e) => setAdFormData({ ...adFormData, remarks: e.target.value })}
              placeholder="e.g. Sponsor contact details, placement notes..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!adDeleteTarget}
        onClose={() => setAdDeleteTarget(null)}
        onConfirm={handleDeleteAd}
        title="Delete Advertisement"
        message={`Are you sure you want to delete the advertisement "${adDeleteTarget?.element}"?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeletingAd}
      />
    </div>
  );
};

export default AdvertisementsPage;
