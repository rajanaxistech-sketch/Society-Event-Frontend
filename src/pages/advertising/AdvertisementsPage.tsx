import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { advertisementsService } from '../../api/advertisementsService';
import { advertisementCategoriesService } from '../../api/advertisementCategoriesService';
import { paymentMethodsService } from '../../api/paymentMethodsService';
import { eventsService } from '../../api/eventsService';
import {
  AdvertisementCategoryItem,
  AdvertisementItem,
  AdvertisementPaymentStatus,
  PaginationMeta,
  PaymentMethodItem,
  EventItem,
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
import sampleQrCodeImg from '../../assets/Sample-Qr-Code.png';
import { SAMPLE_QR_CODE_DATA_URL } from '../../assets/sampleQrCodeData';
import { UpiProofCapture } from '../../components/common/UpiProofCapture';
import {
  ArrowLeft,
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  QrCode,
  Banknote,
  FileText,
  Building2,
  Check,
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

const getEventDisplayName = (ev?: EventItem | null): string => {
  if (!ev) return '';
  return ev.name || (ev as any).title || 'Event';
};

const isNavratriEvent = (ev?: EventItem | null): boolean => {
  if (!ev) return false;
  return Boolean(
    ev.is_navratri ||
    (ev as any).isNavratri ||
    /navratri/i.test(ev.name || (ev as any).title || '')
  );
};

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

  // Events & Master options
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [allCategories, setAllCategories] = useState<AdvertisementCategoryItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);

  // QR Modal & Proof Capture State
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | Blob | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);

  // Form Modal State
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [currentAdId, setCurrentAdId] = useState<string | null>(null);
  const [adFormData, setAdFormData] = useState({
    element: '',
    advertisementCategoryId: '',
    eventId: '',
    modeOfPayment: 'CASH',
    paymentStatus: 'pending' as AdvertisementPaymentStatus,
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionReference: '',
    chequeNumber: '',
    bankName: '',
    chequeDate: '',
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
      const [catRes, payRes, eventsRes] = await Promise.all([
        advertisementCategoriesService.getAll({
          limit: 100,
          societyId: selectedSocietyId || undefined,
          status: 'active',
        }).catch(() => null),
        paymentMethodsService.getAll().catch(() => null),
        eventsService.getAll({
          societyId: selectedSocietyId || undefined,
          limit: 100,
          sortBy: 'start_date',
          sortOrder: 'asc',
        }).catch(() => null),
      ]);

      if (catRes?.success && catRes.data) {
        setAllCategories(catRes.data);
      }
      if (payRes?.success && payRes.data) {
        setPaymentMethods(payRes.data);
      }
      if (eventsRes?.success && eventsRes.data) {
        const evList = eventsRes.data;
        setEvents(evList);
        if (evList.length > 0) {
          const navratriEvent = evList.find((e) => isNavratriEvent(e));
          const defaultEvent = navratriEvent || evList[0];
          setSelectedEventId((prev) => prev || defaultEvent.id);
        }
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
        eventId: selectedEventId || undefined,
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
  }, [adsMeta.page, adsSearch, adsStatusFilter, adsCategoryFilter, selectedEventId, selectedSocietyId]);

  const dynamicElementSuggestions = useMemo(() => {
    const existingAdElements = ads.map((a) => a.element).filter(Boolean);
    return Array.from(new Set([...ELEMENT_SUGGESTIONS, ...existingAdElements]));
  }, [ads]);

  const handleOpenCreateAdModal = () => {
    setIsEditingAd(false);
    setCurrentAdId(null);
    const navratriEv = events.find((e) => isNavratriEvent(e));
    const defaultEvId =
      selectedEventId ||
      navratriEv?.id ||
      (events.length > 0 ? events[0].id : '');

    const defaultCat = allCategories.length > 0 ? allCategories[0] : null;
    const defaultCatId = defaultCat ? defaultCat.id : '';
    const defaultAmount = defaultCat ? String(defaultCat.categoryAmount ?? (defaultCat as any).category_amount ?? '') : '';
    const numAmt = Number(defaultAmount || 0);
    const defaultStatus: AdvertisementPaymentStatus = numAmt > 0 ? 'completed' : 'pending';

    setAdFormData({
      element: '',
      advertisementCategoryId: defaultCatId,
      eventId: defaultEvId,
      modeOfPayment: 'CASH',
      paymentStatus: defaultStatus,
      amountPaid: defaultAmount,
      paymentDate: new Date().toISOString().split('T')[0],
      transactionReference: '',
      chequeNumber: '',
      bankName: '',
      chequeDate: '',
      remarks: '',
      societyId: selectedSocietyId || '',
    });
    setProofFile(null);
    setProofPreviewUrl(null);
    setAdFormErrors({});
    setIsAdModalOpen(true);
  };

  const handleOpenEditAdModal = (item: AdvertisementItem) => {
    setIsEditingAd(true);
    setCurrentAdId(item.id);
    const navratriEv = events.find((e) => isNavratriEvent(e));
    const fallbackEvId = selectedEventId || navratriEv?.id || (events.length > 0 ? events[0].id : '');

    const catId = item.advertisementCategoryId || (item as any).advertisement_category_id || '';
    const chosenCat = allCategories.find((c) => c.id === catId) || item.advertisementCategory;
    const catTotalAmount = chosenCat?.categoryAmount != null
      ? Number(chosenCat.categoryAmount)
      : (chosenCat as any)?.category_amount != null
        ? Number((chosenCat as any).category_amount)
        : 0;

    const catAmount = item.amountPaid != null
      ? String(item.amountPaid)
      : (item as any).amount_paid != null
        ? String((item as any).amount_paid)
        : catTotalAmount > 0
          ? String(catTotalAmount)
          : '';

    const numPaid = Number(catAmount || 0);
    let computedStatus: AdvertisementPaymentStatus = 'pending';
    if (numPaid <= 0) {
      computedStatus = 'pending';
    } else if (catTotalAmount > 0 && numPaid < catTotalAmount) {
      computedStatus = 'partial';
    } else {
      computedStatus = 'completed';
    }

    setAdFormData({
      element: item.element || '',
      advertisementCategoryId: catId,
      eventId: item.eventId || (item as any).event_id || fallbackEvId || '',
      modeOfPayment: item.modeOfPayment || (item as any).mode_of_payment || 'CASH',
      paymentStatus: computedStatus,
      amountPaid: catAmount,
      paymentDate: item.paymentDate
        ? item.paymentDate.split('T')[0]
        : (item as any).payment_date
          ? (item as any).payment_date.split('T')[0]
          : new Date().toISOString().split('T')[0],
      transactionReference: item.transactionReference || (item as any).transaction_reference || '',
      chequeNumber: item.chequeNumber || (item as any).cheque_number || '',
      bankName: item.bankName || (item as any).bank_name || '',
      chequeDate: item.chequeDate ? item.chequeDate.split('T')[0] : (item as any).cheque_date ? (item as any).cheque_date.split('T')[0] : '',
      remarks: item.remarks || '',
      societyId: item.societyId || (item as any).society_id || selectedSocietyId || '',
    });
    setProofFile(null);
    setProofPreviewUrl(item.proofUrl || (item as any).proof_url || null);
    setAdFormErrors({});
    setIsAdModalOpen(true);
  };

  const validateAdForm = () => {
    const errors: Record<string, string> = {};
    if (!adFormData.element.trim()) {
      errors.element = 'Name is required';
    }
    if (!adFormData.advertisementCategoryId) {
      errors.advertisementCategoryId = 'Please select an Advertisement Category';
    }
    if (!adFormData.modeOfPayment.trim()) {
      errors.modeOfPayment = 'Mode of Payment is required';
    }
    if (adFormData.modeOfPayment === 'CHEQUE' && !adFormData.chequeNumber.trim()) {
      errors.chequeNumber = 'Cheque Number is required';
    }
    setAdFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAdForm()) return;

    try {
      setIsAdSubmitting(true);
      const navratriEv = events.find((e) => isNavratriEvent(e));
      const targetEventId =
        adFormData.eventId ||
        selectedEventId ||
        navratriEv?.id ||
        (events.length > 0 ? events[0].id : undefined);

      const chosenCat = allCategories.find((c) => c.id === adFormData.advertisementCategoryId);
      const catName = chosenCat?.categoryName || (chosenCat as any)?.category_name || 'Advertisement';
      const catAmount = chosenCat ? Number(chosenCat.categoryAmount ?? (chosenCat as any).category_amount ?? 0) : 0;
      const numPaid = Number(adFormData.amountPaid || 0);

      let computedStatus: AdvertisementPaymentStatus = 'pending';
      if (numPaid <= 0) {
        computedStatus = 'pending';
      } else if (catAmount > 0 && numPaid < catAmount) {
        computedStatus = 'partial';
      } else {
        computedStatus = 'completed';
      }

      const adName = adFormData.element.trim() || catName;
      const payload: any = {
        name: adName,
        element: adName,
        advertisementCategoryId: adFormData.advertisementCategoryId,
        eventId: targetEventId,
        modeOfPayment: adFormData.modeOfPayment,
        paymentStatus: computedStatus,
        amountPaid: adFormData.amountPaid ? Number(adFormData.amountPaid) : (numPaid > 0 ? numPaid : 0),
        paymentDate: adFormData.paymentDate || undefined,
        transactionReference: adFormData.transactionReference.trim() || null,
        chequeNumber: adFormData.chequeNumber.trim() || null,
        bankName: adFormData.bankName.trim() || null,
        chequeDate: adFormData.chequeDate || null,
        proofUrl: proofPreviewUrl || null,
        remarks: adFormData.remarks.trim() || null,
        societyId: adFormData.societyId || undefined,
      };

      if (isEditingAd && currentAdId) {
        await advertisementsService.update(currentAdId, payload);
        toast.success('Advertisement updated successfully');
      } else {
        await advertisementsService.create(payload);
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
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
          Completed
        </span>
      );
    }
    if (norm === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
          <Clock className="w-2.5 h-2.5 text-blue-600" />
          Partial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
        <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
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
              Advertisements
            </h1>
            {adsMeta.total > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                {adsMeta.total}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateAdModal}
          className="w-8 h-8 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer shrink-0"
          title="Add Advertisement"
          aria-label="Add Advertisement"
        >
          <Plus className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Sleek Search & Master Filter Row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={adsSearch}
            onChange={(e) => {
              setAdsSearch(e.target.value);
              setAdsMeta((prev) => ({ ...prev, page: 1 }));
            }}
            placeholder="Search advertisements..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 shadow-2xs transition-all"
          />
        </div>

        {events.length > 0 && (
          <select
            value={selectedEventId}
            onChange={(e) => {
              setSelectedEventId(e.target.value);
              setAdsMeta((prev) => ({ ...prev, page: 1 }));
            }}
            className="text-xs bg-white border border-slate-200/90 rounded-xl px-2.5 py-2 text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[130px] truncate cursor-pointer font-medium"
            title="Filter by event"
          >
            <option value="">All Events</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {getEventDisplayName(ev)}
              </option>
            ))}
          </select>
        )}

        {allCategories.length > 0 && (
          <select
            value={adsCategoryFilter}
            onChange={(e) => {
              setAdsCategoryFilter(e.target.value);
              setAdsMeta((prev) => ({ ...prev, page: 1 }));
            }}
            className="text-xs bg-white border border-slate-200/90 rounded-xl px-2.5 py-2 text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 max-w-[120px] truncate cursor-pointer font-medium"
            title="Filter by category"
          >
            <option value="">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.categoryName || (cat as any).category_name}
              </option>
            ))}
          </select>
        )}

        <button
          type="button"
          onClick={() => fetchAds()}
          className="p-2 rounded-xl bg-white border border-slate-200/90 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-2xs transition-all cursor-pointer shrink-0"
          title="Refresh"
        >
          <RefreshCw className={clsx('w-4 h-4', adsLoading && 'animate-spin text-indigo-600')} />
        </button>
      </div>

      {/* Minimalist Status Filter Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => {
            setAdsStatusFilter('');
            setAdsMeta((prev) => ({ ...prev, page: 1 }));
          }}
          className={clsx(
            'px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border',
            adsStatusFilter === ''
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 shadow-2xs'
          )}
        >
          All ({adsStats.total})
        </button>
        <button
          type="button"
          onClick={() => {
            setAdsStatusFilter('completed');
            setAdsMeta((prev) => ({ ...prev, page: 1 }));
          }}
          className={clsx(
            'px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5',
            adsStatusFilter === 'completed'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
              : 'bg-white text-emerald-700 border-slate-200/90 hover:bg-emerald-50/50 shadow-2xs'
          )}
        >
          <span className={clsx('w-1.5 h-1.5 rounded-full', adsStatusFilter === 'completed' ? 'bg-white' : 'bg-emerald-500')} />
          Completed ({adsStats.completed})
        </button>
        <button
          type="button"
          onClick={() => {
            setAdsStatusFilter('partial');
            setAdsMeta((prev) => ({ ...prev, page: 1 }));
          }}
          className={clsx(
            'px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5',
            adsStatusFilter === 'partial'
              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
              : 'bg-white text-blue-700 border-slate-200/90 hover:bg-blue-50/50 shadow-2xs'
          )}
        >
          <span className={clsx('w-1.5 h-1.5 rounded-full', adsStatusFilter === 'partial' ? 'bg-white' : 'bg-blue-500')} />
          Partial ({adsStats.partial})
        </button>
        <button
          type="button"
          onClick={() => {
            setAdsStatusFilter('pending');
            setAdsMeta((prev) => ({ ...prev, page: 1 }));
          }}
          className={clsx(
            'px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1.5',
            adsStatusFilter === 'pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
              : 'bg-white text-amber-700 border-slate-200/90 hover:bg-amber-50/50 shadow-2xs'
          )}
        >
          <span className={clsx('w-1.5 h-1.5 rounded-full', adsStatusFilter === 'pending' ? 'bg-white' : 'bg-amber-500')} />
          Pending ({adsStats.pending})
        </button>
      </div>

      {/* Advertisements List */}
      {adsLoading ? (
        <div className="bg-white rounded-xl p-10 flex flex-col items-center justify-center border border-slate-200/80 shadow-2xs">
          <Spinner size="md" label="Loading advertisements..." />
        </div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-slate-200/80 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
            <Megaphone className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No advertisements found</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Create advertisement spots to manage sponsors and placements.
          </p>
          <div className="mt-3">
            <Button size="sm" variant="primary" onClick={handleOpenCreateAdModal}>
              <Plus className="w-4 h-4 mr-1" />
              Add Advertisement
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-1 gap-2.5">
            {ads.map((ad) => {
              const cat = ad.advertisementCategory;
              const catName = cat?.categoryName || (cat as any)?.category_name || 'Category';
              const catAmount = cat?.categoryAmount ?? (cat as any)?.category_amount ?? 0;
              const paidAmount = ad.amountPaid != null ? Number(ad.amountPaid) : (ad as any).amount_paid != null ? Number((ad as any).amount_paid) : 0;
              const paymentMode = ad.modeOfPayment || (ad as any).mode_of_payment || 'CASH';
              const paymentStatus = ad.paymentStatus || (ad as any).payment_status || 'pending';
              const eventObj = events.find((e) => e.id === (ad.eventId || (ad as any).event_id));
              const eventTitle = ad.event?.name || ad.event?.title || (eventObj ? getEventDisplayName(eventObj) : null);

              return (
                <div
                  key={ad.id}
                  className="bg-white rounded-xl p-3 sm:p-3.5 border border-slate-200/80 hover:border-slate-300 shadow-2xs transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-[10.5px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/80">
                          {catName}
                        </span>
                        {renderPaymentStatusBadge(paymentStatus)}
                        {eventTitle && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10.5px] font-medium">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            {eventTitle}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                        {ad.element}
                      </h4>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                        {formatCurrency(paidAmount)}
                      </div>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAdModal(ad)}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setAdDeleteTarget(ad)}
                          className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 flex items-center justify-center transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200/80 font-semibold text-slate-700">
                        {paymentMode === 'UPI' || paymentMode === 'QR' ? (
                          <QrCode className="w-3 h-3 text-indigo-600" />
                        ) : paymentMode === 'CASH' ? (
                          <Banknote className="w-3 h-3 text-emerald-600" />
                        ) : paymentMode === 'CHEQUE' ? (
                          <FileText className="w-3 h-3 text-amber-600" />
                        ) : (
                          <Building2 className="w-3 h-3 text-sky-600" />
                        )}
                        <span>{paymentMode === 'UPI' ? 'UPI / QR' : paymentMode === 'BANK_TRANSFER' ? 'Transfer' : paymentMode === 'CHEQUE' ? 'Cheque' : 'Cash'}</span>
                      </div>

                      {(ad.chequeNumber || (ad as any).cheque_number) && (
                        <span className="text-[10.5px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200/70 font-medium">
                          Chq #{ad.chequeNumber || (ad as any).cheque_number}
                        </span>
                      )}

                      {(ad.transactionReference || (ad as any).transaction_reference) && (
                        <span className="text-[10.5px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          Ref: {ad.transactionReference || (ad as any).transaction_reference}
                        </span>
                      )}
                    </div>

                    {ad.remarks && (
                      <p className="text-[10.5px] text-slate-500 italic bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[200px]">
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
          {/* Person / Advertiser Name */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
              Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Raj Shah, Amit Patel, Ramesh Mehta"
              value={adFormData.element}
              onChange={(e) => setAdFormData({ ...adFormData, element: e.target.value })}
              className={clsx(
                'w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800',
                adFormErrors.element ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
              )}
            />
            {adFormErrors.element && (
              <p className="text-xs text-rose-500 mt-1 font-medium">{adFormErrors.element}</p>
            )}
          </div>

          {/* Select Advertisement Category */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1">
              Select Advertisement Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={adFormData.advertisementCategoryId}
              onChange={(e) => {
                const newCatId = e.target.value;
                const chosenCat = allCategories.find((c) => c.id === newCatId);
                const chosenAmount = chosenCat ? String(chosenCat.categoryAmount ?? (chosenCat as any).category_amount ?? '') : '';
                const numAmt = Number(chosenAmount || 0);
                const chosenStatus: AdvertisementPaymentStatus = numAmt > 0 ? 'completed' : 'pending';
                setAdFormData({
                  ...adFormData,
                  advertisementCategoryId: newCatId,
                  amountPaid: chosenAmount || adFormData.amountPaid,
                  paymentStatus: chosenStatus,
                });
              }}
              className={clsx(
                'w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800',
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
              <p className="text-[11px] text-amber-600 mt-1 font-medium">
                No active advertisement categories found. Please create one in Category settings.
              </p>
            )}
            {adFormErrors.advertisementCategoryId && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">
                {adFormErrors.advertisementCategoryId}
              </p>
            )}
          </div>

          {/* Payment Method with Visual Cards & Icons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {[
                {
                  code: 'UPI',
                  name: 'UPI / QR',
                  subtitle: 'GPay, QR',
                  icon: QrCode,
                  activeClass: 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs',
                  iconColor: 'text-indigo-600 bg-indigo-100',
                },
                {
                  code: 'CASH',
                  name: 'Cash',
                  subtitle: 'Physical',
                  icon: Banknote,
                  activeClass: 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs',
                  iconColor: 'text-emerald-600 bg-emerald-100',
                },
                {
                  code: 'CHEQUE',
                  name: 'Cheque',
                  subtitle: 'DD / Chq',
                  icon: FileText,
                  activeClass: 'border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs',
                  iconColor: 'text-amber-600 bg-amber-100',
                },
                {
                  code: 'BANK_TRANSFER',
                  name: 'Transfer',
                  subtitle: 'NEFT / IMPS',
                  icon: Building2,
                  activeClass: 'border-sky-600 bg-sky-50/90 text-sky-950 ring-2 ring-sky-500/20 shadow-xs',
                  iconColor: 'text-sky-600 bg-sky-100',
                },
              ].map((item) => {
                const isSelected = adFormData.modeOfPayment === item.code || (item.code === 'UPI' && adFormData.modeOfPayment === 'QR');
                const Icon = item.icon;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setAdFormData({ ...adFormData, modeOfPayment: item.code });
                      if (item.code === 'UPI' || item.code === 'QR') {
                        setIsQrModalOpen(true);
                      }
                    }}
                    className={`relative flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? item.activeClass
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? item.iconColor : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-300 animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs sm:text-sm font-bold leading-tight block truncate w-full">
                      {item.name}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-500 block truncate w-full mt-0.5">
                      {item.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Amount and Payment Date in one row */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                Payment Amount (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={adFormData.amountPaid}
                onChange={(e) => {
                  const val = e.target.value;
                  const chosenCat = allCategories.find((c) => c.id === adFormData.advertisementCategoryId);
                  const catAmount = chosenCat ? Number(chosenCat.categoryAmount ?? (chosenCat as any).category_amount ?? 0) : 0;
                  const numPaid = Number(val || 0);
                  let computedStatus: AdvertisementPaymentStatus = 'pending';
                  if (numPaid <= 0) {
                    computedStatus = 'pending';
                  } else if (catAmount > 0 && numPaid < catAmount) {
                    computedStatus = 'partial';
                  } else {
                    computedStatus = 'completed';
                  }
                  setAdFormData({
                    ...adFormData,
                    amountPaid: val,
                    paymentStatus: computedStatus,
                  });
                }}
                placeholder="e.g. 5000"
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={adFormData.paymentDate}
                onChange={(e) => setAdFormData({ ...adFormData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Dynamic Payment Status Display (Auto-calculated based on Amount Paid vs Category Cost) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Status <span className="text-slate-400 font-normal text-[10.5px]">(Auto-calculated)</span>
            </label>
            {(() => {
              const chosenCat = allCategories.find((c) => c.id === adFormData.advertisementCategoryId);
              const catAmount = chosenCat ? Number(chosenCat.categoryAmount ?? (chosenCat as any).category_amount ?? 0) : 0;
              const numPaid = Number(adFormData.amountPaid || 0);

              if (adFormData.paymentStatus === 'completed') {
                return (
                  <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block leading-tight">Completed</span>
                        <span className="text-[10.5px] text-emerald-800/80 block">
                          Full payment done ({formatCurrency(numPaid || catAmount)} received)
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-950">
                      Completed
                    </span>
                  </div>
                );
              }

              if (adFormData.paymentStatus === 'partial') {
                const remaining = Math.max(0, catAmount - numPaid);
                return (
                  <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 text-blue-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold block leading-tight">Partial Payment</span>
                        <span className="text-[10.5px] text-blue-800/80 block">
                          {formatCurrency(numPaid)} paid • {formatCurrency(remaining)} remaining
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider bg-blue-200 text-blue-950">
                      Partial
                    </span>
                  </div>
                );
              }

              return (
                <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block leading-tight">Pending</span>
                      <span className="text-[10.5px] text-amber-800/80 block">
                        Full payment remaining ({formatCurrency(catAmount)} to be paid)
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold uppercase tracking-wider bg-amber-200 text-amber-950">
                    Pending
                  </span>
                </div>
              );
            })()}
          </div>

          {/* UPI QR Code Quick View Card */}
          {(adFormData.modeOfPayment === 'UPI' || adFormData.modeOfPayment === 'QR') && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-slate-50 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <QrCode className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-indigo-950 block truncate">Society Payment QR Code</span>
                  <span className="text-[10px] text-slate-500 block truncate">Scan using any UPI app (GPay, PhonePe, Paytm, BHIM)</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsQrModalOpen(true)}
                className="border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 h-8 text-xs font-semibold px-2.5 shadow-xs shrink-0 ml-2"
              >
                <QrCode className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                View QR Code
              </Button>
            </div>
          )}

          {/* UPI Live Camera Snapshot / Screenshot Upload Section */}
          {(adFormData.modeOfPayment === 'UPI' || adFormData.modeOfPayment === 'QR') && (
            <UpiProofCapture
              onImageCaptured={(file, preview) => {
                setProofFile(file);
                setProofPreviewUrl(preview);
              }}
              existingProofUrl={proofPreviewUrl}
            />
          )}

          {/* Cheque Details */}
          {adFormData.modeOfPayment === 'CHEQUE' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
              <span className="text-xs font-bold text-amber-900 block">Cheque Information</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">
                    Cheque Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 102938"
                    value={adFormData.chequeNumber}
                    onChange={(e) => setAdFormData({ ...adFormData, chequeNumber: e.target.value })}
                    className={clsx(
                      'w-full px-3 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-slate-800',
                      adFormErrors.chequeNumber ? 'border-rose-400' : 'border-amber-200'
                    )}
                  />
                  {adFormErrors.chequeNumber && (
                    <p className="text-[10px] text-rose-500 mt-1 font-medium">{adFormErrors.chequeNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India"
                    value={adFormData.bankName}
                    onChange={(e) => setAdFormData({ ...adFormData, bankName: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">
                    Cheque Date
                  </label>
                  <input
                    type="date"
                    value={adFormData.chequeDate}
                    onChange={(e) => setAdFormData({ ...adFormData, chequeDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transaction / UPI Reference Number */}
          {adFormData.modeOfPayment !== 'CHEQUE' && adFormData.modeOfPayment !== 'CASH' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Transaction / UPI Reference Number
              </label>
              <input
                type="text"
                placeholder={adFormData.modeOfPayment === 'UPI' || adFormData.modeOfPayment === 'QR' ? 'e.g. UPI/2026/09/99214' : 'e.g. NEFT/IMPS/2026/09/99214'}
                value={adFormData.transactionReference}
                onChange={(e) => setAdFormData({ ...adFormData, transactionReference: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks (Optional)
            </label>
            <textarea
              rows={2}
              value={adFormData.remarks}
              onChange={(e) => setAdFormData({ ...adFormData, remarks: e.target.value })}
              placeholder="e.g. Sponsor contact details, placement notes..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800"
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

      {/* Society UPI QR Code Modal Popup */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        size="sm"
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm sm:text-base block leading-tight">UPI Payment QR</span>
              <span className="text-[10px] text-slate-500 block font-normal">Scan with GPay, PhonePe, Paytm, or BHIM</span>
            </div>
          </div>
        }
      >
        <div className="flex flex-col items-center text-center space-y-3 py-1">
          {/* Target Element & Category Details */}
          <div className="w-full bg-slate-50 rounded-xl p-2.5 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Spot / Element</span>
              <span className="font-bold text-slate-800 truncate max-w-[150px] block">
                {adFormData.element || 'Advertisement Spot'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Amount to Pay</span>
              <span className="font-extrabold text-indigo-600 text-sm">
                {formatCurrency(Number(adFormData.amountPaid) || 0)}
              </span>
            </div>
          </div>

          {/* QR Code Container Box */}
          <div className="relative p-3.5 bg-white rounded-2xl border-2 border-indigo-100 shadow-md flex flex-col items-center w-full max-w-[280px]">
            <div className="w-52 h-52 sm:w-56 sm:h-56 rounded-xl overflow-hidden bg-white p-1 flex items-center justify-center">
              <img
                src={SAMPLE_QR_CODE_DATA_URL || sampleQrCodeImg}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src !== SAMPLE_QR_CODE_DATA_URL) {
                    target.src = SAMPLE_QR_CODE_DATA_URL;
                  }
                }}
                alt="Society Payment UPI QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Red Warning Line under the QR code with * */}
            <div className="w-full mt-2.5 pt-2 border-t border-rose-200">
              <p className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1">
                <span className="text-rose-600 font-extrabold text-sm leading-none">*</span>
                <span>This is the sample QR code</span>
              </p>
            </div>
          </div>

          {/* Supported UPI apps */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium">
            <span>Accepted via:</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">GPay</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">PhonePe</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">Paytm</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">BHIM UPI</span>
          </div>

          {/* Action Button */}
          <div className="w-full pt-1">
            <Button
              type="button"
              variant="primary"
              onClick={() => setIsQrModalOpen(false)}
              className="w-full justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Done / Capture Payment Receipt
            </Button>
          </div>
        </div>
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
