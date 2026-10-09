import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { useDebounce } from '../../hooks/useDebounce';
import DynamicUpiQrModal from '../../components/payments/DynamicUpiQrModal';
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
  ChevronDown,
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
  const [statusCounts, setStatusCounts] = useState({ total: 0, completed: 0, partial: 0, pending: 0 });
  const [financialSummary, setFinancialSummary] = useState({
    totalCollected: 0,
    totalPending: 0,
    pendingAds: 0,
    totalAds: 0,
  });
  const [adsLoading, setAdsLoading] = useState(true);
  const [adsSearch, setAdsSearch] = useState('');
  const debouncedAdsSearch = useDebounce(adsSearch, 400);
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

  // Bottom 2-Second Quick Feedback State
  const [paymentFeedback, setPaymentFeedback] = useState<string | null>(null);
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerBottomFeedback = (msg: string) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setPaymentFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => {
      setPaymentFeedback(null);
    }, 2000);
  };

  // Form Modal State
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [currentAdId, setCurrentAdId] = useState<string | null>(null);
  const [adFormData, setAdFormData] = useState({
    element: '',
    advertisementCategoryId: '',
    eventId: '',
    modeOfPayment: 'CASH',
    paymentStatus: 'completed' as AdvertisementPaymentStatus,
    totalAmount: '',
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

  const handlePaymentAmountChange = (newTotal: string, newPaid: string) => {
    const total = Number(newTotal || 0);
    const paid = Number(newPaid || 0);
    let status: AdvertisementPaymentStatus = 'pending';
    if (paid <= 0) {
      status = 'pending';
    } else if (total > 0 && paid < total) {
      status = 'partial';
    } else {
      status = 'completed';
    }
    setAdFormData((prev) => ({
      ...prev,
      totalAmount: newTotal,
      amountPaid: newPaid,
      paymentStatus: status,
    }));
    setAdFormErrors((prev) => {
      const next = { ...prev };
      if (Number(newTotal) > 0) delete next.totalAmount;
      if (Number(newPaid) >= 0 && (Number(newTotal) <= 0 || Number(newPaid) <= Number(newTotal))) {
        delete next.amountPaid;
      }
      return next;
    });
  };

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

  const fetchStatusCounts = async () => {
    try {
      const res = await advertisementsService.getAll({
        limit: 1000,
        search: debouncedAdsSearch || undefined,
        advertisementCategoryId: adsCategoryFilter || undefined,
        eventId: selectedEventId || undefined,
        societyId: selectedSocietyId || undefined,
      });

      if (res.success && res.data) {
        let completed = 0;
        let partial = 0;
        let pending = 0;
        let totalCollected = 0;
        let totalPending = 0;
        let pendingAds = 0;

        res.data.forEach((ad: AdvertisementItem) => {
          const cat = ad.advertisementCategory;
          const catAmount = cat?.categoryAmount ?? (cat as any)?.category_amount ?? 0;
          const total = ad.totalAmount != null
            ? Number(ad.totalAmount)
            : (ad as any).total_amount != null
              ? Number((ad as any).total_amount)
              : catAmount;
          const paid = ad.amountPaid != null ? Number(ad.amountPaid) : (ad as any).amount_paid != null ? Number((ad as any).amount_paid) : 0;
          const due = Math.max(0, total - paid);

          totalCollected += paid;
          totalPending += due;

          const isPaidComplete = (ad.paymentStatus || (ad as any).payment_status) === 'completed' || (paid >= total && total > 0);
          const isPaidPartial = !isPaidComplete && paid > 0;

          if (isPaidComplete) {
            completed += 1;
          } else if (isPaidPartial) {
            partial += 1;
            pendingAds += 1;
          } else {
            pending += 1;
            pendingAds += 1;
          }
        });

        setStatusCounts({
          total: res.meta?.total ?? res.data.length,
          completed,
          partial,
          pending,
        });

        setFinancialSummary({
          totalCollected,
          totalPending,
          pendingAds,
          totalAds: res.meta?.total ?? res.data.length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch advertisement status counts', err);
    }
  };

  const fetchAds = async () => {
    try {
      setAdsLoading(true);
      const res = await advertisementsService.getAll({
        page: adsMeta.page,
        limit: adsMeta.limit,
        search: debouncedAdsSearch || undefined,
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
    fetchStatusCounts();
  }, [debouncedAdsSearch, adsCategoryFilter, selectedEventId, selectedSocietyId]);

  useEffect(() => {
    fetchAds();
  }, [adsMeta.page, debouncedAdsSearch, adsStatusFilter, adsCategoryFilter, selectedEventId, selectedSocietyId]);

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

    setAdFormData({
      element: '',
      advertisementCategoryId: defaultCatId,
      eventId: defaultEvId,
      modeOfPayment: 'CASH',
      paymentStatus: 'completed',
      totalAmount: defaultAmount,
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
    const catAmount = chosenCat?.categoryAmount != null
      ? Number(chosenCat.categoryAmount)
      : (chosenCat as any)?.category_amount != null
        ? Number((chosenCat as any).category_amount)
        : 0;

    const savedTotal = item.totalAmount != null
      ? Number(item.totalAmount)
      : (item as any).total_amount != null
        ? Number((item as any).total_amount)
        : catAmount;

    const catTotalAmount = savedTotal > 0 ? savedTotal : catAmount;

    const paidAmt = item.amountPaid != null
      ? String(item.amountPaid)
      : (item as any).amount_paid != null
        ? String((item as any).amount_paid)
        : '0';

    const numPaid = Number(paidAmt || 0);
    let autoStatus: AdvertisementPaymentStatus = 'pending';
    if (numPaid <= 0) {
      autoStatus = 'pending';
    } else if (catTotalAmount > 0 && numPaid < catTotalAmount) {
      autoStatus = 'partial';
    } else {
      autoStatus = 'completed';
    }

    const rawStatus = ((item.paymentStatus || (item as any).payment_status || '') as string).toLowerCase();
    const currentStatus: AdvertisementPaymentStatus =
      rawStatus === 'completed' || rawStatus === 'partial' || rawStatus === 'pending'
        ? (rawStatus as AdvertisementPaymentStatus)
        : autoStatus;

    setAdFormData({
      element: item.element || '',
      advertisementCategoryId: catId,
      eventId: item.eventId || (item as any).event_id || fallbackEvId || '',
      modeOfPayment: item.modeOfPayment || (item as any).mode_of_payment || 'CASH',
      paymentStatus: currentStatus,
      totalAmount: catTotalAmount > 0 ? String(catTotalAmount) : '',
      amountPaid: paidAmt,
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

    // Amount validation: Total cost cannot be 0 or empty
    const total = Number(adFormData.totalAmount || 0);
    if (!adFormData.totalAmount || total <= 0) {
      errors.totalAmount = 'Total cost cannot be 0 or empty';
    }

    // Amount Paid validation: cannot be negative or exceed total cost
    if (adFormData.amountPaid !== '') {
      const paid = Number(adFormData.amountPaid);
      if (paid < 0) {
        errors.amountPaid = 'Amount paid cannot be negative';
      } else if (total > 0 && paid > total) {
        errors.amountPaid = 'Amount paid cannot exceed total cost';
      }
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

      const adName = adFormData.element.trim() || catName;
      const payload: any = {
        name: adName,
        element: adName,
        advertisementCategoryId: adFormData.advertisementCategoryId,
        eventId: targetEventId,
        modeOfPayment: adFormData.modeOfPayment,
        paymentStatus: adFormData.paymentStatus,
        totalAmount: adFormData.totalAmount !== '' ? Number(adFormData.totalAmount) : (chosenCat?.categoryAmount ?? 0),
        amountPaid: adFormData.amountPaid !== '' ? Number(adFormData.amountPaid) : 0,
        paymentDate: adFormData.paymentDate || undefined,
        transactionReference: adFormData.transactionReference.trim() || null,
        chequeNumber: adFormData.chequeNumber.trim() || null,
        bankName: adFormData.bankName.trim() || null,
        chequeDate: adFormData.chequeDate || null,
        proofUrl: proofPreviewUrl || null,
        remarks: adFormData.remarks.trim() || null,
        societyId: adFormData.societyId || undefined,
      };

      const paidNum = Number(payload.amountPaid || 0);
      if (isEditingAd && currentAdId) {
        await advertisementsService.update(currentAdId, payload);
        triggerBottomFeedback(
          paidNum > 0
            ? `✓ Payment updated (${formatCurrency(paidNum)}) successfully`
            : '✓ Advertisement updated successfully'
        );
      } else {
        await advertisementsService.create(payload);
        triggerBottomFeedback(
          paidNum > 0
            ? `✓ Payment of ${formatCurrency(paidNum)} recorded successfully`
            : '✓ Advertisement created successfully'
        );
      }
      setIsAdModalOpen(false);
      await Promise.all([fetchAds(), fetchStatusCounts()]);
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
      triggerBottomFeedback('✓ Advertisement deleted successfully');
      setAdDeleteTarget(null);
      await Promise.all([fetchAds(), fetchStatusCounts()]);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete advertisement'));
    } finally {
      setIsDeletingAd(false);
    }
  };

  const renderPaymentStatusBadge = (status: string) => {
    const norm = (status || '').toLowerCase();
    if (norm === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Completed
        </span>
      );
    }
    if (norm === 'partial') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <Clock className="w-3 h-3 text-blue-600" />
          Partial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
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
    <div className="space-y-3 animate-in fade-in duration-200 pb-12">
      {/* Sleek Minimalist Header */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2.5">
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
            {statusCounts.total > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full">
                {statusCounts.total}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              fetchAds();
              fetchStatusCounts();
            }}
            className="p-1.5 rounded-xl bg-white border border-slate-200/90 text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-2xs transition-all cursor-pointer shrink-0"
            title="Refresh"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', adsLoading && 'animate-spin text-indigo-600')} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreateAdModal}
            className="h-8 px-3 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer shrink-0 text-xs font-bold"
            title="Add Advertisement"
            aria-label="Add Advertisement"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Advertisement</span>
          </button>
        </div>
      </div>

      {/* Top Summary Financial Metric Card (Matching Flat Collections) */}
      <div className="bg-white px-2.5 py-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="grid grid-cols-3 divide-x divide-slate-100 text-center items-center">
          <div className="px-1 py-0.5">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-tight block whitespace-nowrap">
              TOTAL COLLECTED
            </span>
            <span className="text-[13px] sm:text-sm font-extrabold text-slate-900 block mt-0.5 whitespace-nowrap">
              {formatCurrency(financialSummary.totalCollected)}
            </span>
          </div>
          <div className="px-1 py-0.5">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-tight block whitespace-nowrap">
              PENDING DUE
            </span>
            <span className="text-[13px] sm:text-sm font-extrabold text-amber-600 block mt-0.5 whitespace-nowrap">
              {formatCurrency(financialSummary.totalPending)}
            </span>
          </div>
          <div className="px-1 py-0.5">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-tight block whitespace-nowrap">
              PENDING UNITS
            </span>
            <span className="text-[13px] sm:text-sm font-extrabold text-slate-700 block mt-0.5 whitespace-nowrap">
              {financialSummary.pendingAds}
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={adsSearch}
          onChange={(e) => {
            setAdsSearch(e.target.value);
            setAdsMeta((prev) => ({ ...prev, page: 1 }));
          }}
          placeholder="Search sponsor name (e.g. A-101) or resident..."
          className="w-full h-8 pl-8 pr-7 text-xs bg-white border border-slate-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400 shadow-2xs transition-all"
        />
        {adsSearch && (
          <button
            type="button"
            onClick={() => setAdsSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Event & Category Filter Row (if present) */}
      {(events.length > 0 || allCategories.length > 0) && (
        <div className="grid grid-cols-2 gap-2">
          {events.length > 0 ? (
            <div className="relative">
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setAdsMeta((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full text-xs bg-white border border-slate-200/80 rounded-lg pl-2.5 pr-7 py-1.5 text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate cursor-pointer font-medium appearance-none"
                title="Filter by event"
              >
                <option value="">All Events</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {getEventDisplayName(ev)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : <div />}

          {allCategories.length > 0 ? (
            <div className="relative">
              <select
                value={adsCategoryFilter}
                onChange={(e) => {
                  setAdsCategoryFilter(e.target.value);
                  setAdsMeta((prev) => ({ ...prev, page: 1 }));
                }}
                className="w-full text-xs bg-white border border-slate-200/80 rounded-lg pl-2.5 pr-7 py-1.5 text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate cursor-pointer font-medium appearance-none"
                title="Filter by category"
              >
                <option value="">All Categories</option>
                {allCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoryName || (cat as any).category_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ) : <div />}
        </div>
      )}

      {/* Modern Status Filter Segmented Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => {
            setAdsStatusFilter('');
            setAdsMeta((prev) => ({ ...prev, page: 1 }));
          }}
          className={clsx(
            'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border shrink-0',
            adsStatusFilter === ''
              ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
              : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 shadow-2xs'
          )}
        >
          All ({statusCounts.total})
        </button>
        <button
          type="button"
          onClick={() => {
            setAdsStatusFilter('completed');
            setAdsMeta((prev) => ({ ...prev, page: 1 }));
          }}
          className={clsx(
            'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 shrink-0',
            adsStatusFilter === 'completed'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
              : 'bg-white text-emerald-700 border-slate-200/90 hover:bg-emerald-50/50 shadow-2xs'
          )}
        >
          <span className={clsx('w-1.5 h-1.5 rounded-full', adsStatusFilter === 'completed' ? 'bg-white' : 'bg-emerald-500')} />
          Paid ({statusCounts.completed})
        </button>
        <button
          type="button"
          onClick={() => {
            setAdsStatusFilter('partial');
            setAdsMeta((prev) => ({ ...prev, page: 1 }));
          }}
          className={clsx(
            'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 shrink-0',
            adsStatusFilter === 'partial'
              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
              : 'bg-white text-blue-700 border-slate-200/90 hover:bg-blue-50/50 shadow-2xs'
          )}
        >
          <span className={clsx('w-1.5 h-1.5 rounded-full', adsStatusFilter === 'partial' ? 'bg-white' : 'bg-blue-500')} />
          Partial ({statusCounts.partial})
        </button>
        <button
          type="button"
          onClick={() => {
            setAdsStatusFilter('pending');
            setAdsMeta((prev) => ({ ...prev, page: 1 }));
          }}
          className={clsx(
            'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border flex items-center gap-1 shrink-0',
            adsStatusFilter === 'pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
              : 'bg-white text-amber-700 border-slate-200/90 hover:bg-amber-50/50 shadow-2xs'
          )}
        >
          <span className={clsx('w-1.5 h-1.5 rounded-full', adsStatusFilter === 'pending' ? 'bg-white' : 'bg-amber-500')} />
          Due ({statusCounts.pending})
        </button>
      </div>

      {/* Advertisements List View (Matching Flat Collections Card Style) */}
      {adsLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading advertisements...</div>
      ) : ads.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
            <Megaphone className="w-5 h-5" />
          </div>
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">No advertisements found</h3>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto mt-1">
            Create advertisement spots to manage sponsors, placements, and collections.
          </p>
          <div className="mt-3">
            <Button size="sm" variant="primary" onClick={handleOpenCreateAdModal}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Advertisement
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {ads.map((ad) => {
            const cat = ad.advertisementCategory;
            const catName = cat?.categoryName || (cat as any)?.category_name || 'Category';
            const catAmount = cat?.categoryAmount ?? (cat as any)?.category_amount ?? 0;
            const effectiveTotalAmount = ad.totalAmount != null
              ? Number(ad.totalAmount)
              : (ad as any).total_amount != null
                ? Number((ad as any).total_amount)
                : catAmount;
            const paidAmount = ad.amountPaid != null ? Number(ad.amountPaid) : (ad as any).amount_paid != null ? Number((ad as any).amount_paid) : 0;
            const dueAmount = Math.max(0, effectiveTotalAmount - paidAmount);
            const isCompleted = (ad.paymentStatus || (ad as any).payment_status) === 'completed' || (paidAmount >= effectiveTotalAmount && effectiveTotalAmount > 0);
            const isPartial = !isCompleted && paidAmount > 0;
            const paymentMode = ad.modeOfPayment || (ad as any).mode_of_payment || 'CASH';
            const eventObj = events.find((e) => e.id === (ad.eventId || (ad as any).event_id));
            const eventTitle = ad.event?.name || ad.event?.title || (eventObj ? getEventDisplayName(eventObj) : null);

            return (
              <div
                key={ad.id}
                onClick={() => handleOpenEditAdModal(ad)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isCompleted
                  ? 'bg-[#F0FDF4] border-[#DCFCE7] hover:bg-[#E2FBE8]'
                  : isPartial
                    ? 'bg-[#EFF6FF] border-[#BFDBFE] hover:bg-[#DBEAFE]'
                    : 'bg-[#FEFCE8] border-[#FEF08A] hover:bg-[#FEF9C3]'
                  }`}
              >
                {/* Left Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${isCompleted
                      ? 'bg-emerald-500'
                      : isPartial
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                      }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                        {ad.element}
                      </span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded border border-purple-200/50 shrink-0">
                        {catName}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {paymentMode === 'UPI' ? 'UPI / QR' : paymentMode === 'BANK_TRANSFER' ? 'Transfer' : paymentMode === 'CHEQUE' ? `Cheque${ad.chequeNumber ? ` #${ad.chequeNumber}` : ''}` : 'Cash'}
                      {eventTitle ? ` • ${eventTitle}` : ''}
                    </p>
                  </div>
                </div>

                {/* Right Info & Actions */}
                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 block leading-tight">
                      ₹{isCompleted ? paidAmount.toLocaleString('en-IN') : (dueAmount > 0 ? dueAmount.toLocaleString('en-IN') : effectiveTotalAmount.toLocaleString('en-IN'))}
                    </span>
                    <span
                      className={`text-[10px] font-medium leading-tight block mt-0.5 ${isCompleted ? 'text-emerald-700' : isPartial ? 'text-blue-700' : 'text-amber-700'
                        }`}
                    >
                      {isCompleted ? 'Paid' : isPartial ? 'Partial' : 'Due'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditAdModal(ad);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                    title="Edit Advertisement"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditAdModal(ad);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-xs transition-all"
                    >
                      Pay
                    </button>
                  )}
                </div>
              </div>
            );
          })}

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
        isLoading={isAdSubmitting}
        title={isEditingAd ? 'Edit Advertisement' : 'Add Advertisement'}
        size="md"
      >
        <form onSubmit={handleSaveAd} className="space-y-2.5 sm:space-y-3">
          {/* Top Live Payment Summary Metric Cards: Total Due, Paid, Pending */}
          {(() => {
            const total = Number(adFormData.totalAmount || 0);
            const paid = Number(adFormData.amountPaid || 0);
            const pending = Math.max(0, total - paid);

            return (
              <div className="grid grid-cols-3 gap-1.5 p-2 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="p-1.5 bg-white rounded-lg border border-slate-100 text-center shadow-2xs">
                  <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">
                    Total Due
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 block mt-0.5 truncate">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="p-1.5 bg-emerald-50/90 rounded-lg border border-emerald-100 text-center shadow-2xs">
                  <span className="text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Amount Paid
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-700 block mt-0.5 truncate">
                    {formatCurrency(paid)}
                  </span>
                </div>

                <div className="p-1.5 bg-amber-50/90 rounded-lg border border-amber-100 text-center shadow-2xs">
                  <span className="text-[9.5px] font-bold text-amber-700 uppercase tracking-wider block">
                    Pending
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-amber-700 block mt-0.5 truncate">
                    {formatCurrency(pending)}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* Name & Description (Category) in 2 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            {/* Person / Advertiser Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Raj Shah"
                value={adFormData.element}
                onChange={(e) => setAdFormData({ ...adFormData, element: e.target.value })}
                className={clsx(
                  'w-full px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800',
                  adFormErrors.element ? 'border-rose-400 bg-rose-50/20' : 'border-slate-200'
                )}
              />
              {adFormErrors.element && (
                <p className="text-[10.5px] text-rose-500 mt-0.5 font-medium">{adFormErrors.element}</p>
              )}
            </div>

            {/* Description / Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description <span className="text-rose-500">*</span>
              </label>
              <select
                value={adFormData.advertisementCategoryId}
                onChange={(e) => {
                  const newCatId = e.target.value;
                  const chosenCat = allCategories.find((c) => c.id === newCatId);
                  const chosenAmount = chosenCat ? String(chosenCat.categoryAmount ?? (chosenCat as any).category_amount ?? '') : '';
                  handlePaymentAmountChange(chosenAmount, chosenAmount || adFormData.amountPaid);
                  setAdFormData((prev) => ({
                    ...prev,
                    advertisementCategoryId: newCatId,
                  }));
                }}
                className={clsx(
                  'w-full px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800',
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
                <p className="text-[10px] text-amber-600 mt-0.5 font-medium">
                  No active categories found. Please create one in Settings.
                </p>
              )}
              {adFormErrors.advertisementCategoryId && (
                <p className="text-[10.5px] text-rose-500 mt-0.5 font-medium">
                  {adFormErrors.advertisementCategoryId}
                </p>
              )}
            </div>
          </div>

          {/* Payment Method with Visual Cards & Icons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                {
                  code: 'UPI',
                  name: 'UPI / QR',
                  subtitle: 'GPay, QR',
                  icon: QrCode,
                  activeClass: 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-2 ring-indigo-500/20 shadow-2xs',
                  iconColor: 'text-indigo-600 bg-indigo-100',
                },
                {
                  code: 'CASH',
                  name: 'Cash',
                  subtitle: 'Physical',
                  icon: Banknote,
                  activeClass: 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-2xs',
                  iconColor: 'text-emerald-600 bg-emerald-100',
                },
                {
                  code: 'CHEQUE',
                  name: 'Cheque',
                  subtitle: 'DD / Chq',
                  icon: FileText,
                  activeClass: 'border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-2xs',
                  iconColor: 'text-amber-600 bg-amber-100',
                },
                {
                  code: 'BANK_TRANSFER',
                  name: 'Transfer',
                  subtitle: 'NEFT/IMPS',
                  icon: Building2,
                  activeClass: 'border-sky-600 bg-sky-50/90 text-sky-950 ring-2 ring-sky-500/20 shadow-2xs',
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
                    className={`relative flex flex-col items-start p-1.5 sm:p-2.5 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                      ? item.activeClass
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                      }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${isSelected ? item.iconColor : 'bg-slate-100 text-slate-600'
                          }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 ring-2 ring-indigo-300 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold leading-tight block truncate w-full">
                      {item.name}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate w-full mt-0.5">
                      {item.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row: Total Cost (₹) & Amount Paid (₹) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Total Cost (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={adFormData.totalAmount}
                onChange={(e) => handlePaymentAmountChange(e.target.value, adFormData.amountPaid)}
                placeholder="e.g. 50000"
                className={clsx(
                  "w-full px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium text-slate-800",
                  adFormErrors.totalAmount
                    ? "border-rose-400 bg-rose-50/20 focus:ring-rose-500/20"
                    : "border-slate-200 focus:ring-indigo-500/20"
                )}
              />
              {adFormErrors.totalAmount && (
                <p className="text-[10.5px] text-rose-500 font-semibold mt-1">
                  {adFormErrors.totalAmount}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount Paid (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={adFormData.amountPaid}
                onChange={(e) => handlePaymentAmountChange(adFormData.totalAmount, e.target.value)}
                placeholder="e.g. 20000"
                className={clsx(
                  "w-full px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50 border rounded-xl focus:bg-white focus:outline-none focus:ring-2 transition-all font-medium text-slate-800",
                  adFormErrors.amountPaid
                    ? "border-rose-400 bg-rose-50/20 focus:ring-rose-500/20"
                    : "border-slate-200 focus:ring-indigo-500/20"
                )}
              />
              {adFormErrors.amountPaid && (
                <p className="text-[10.5px] text-rose-500 font-semibold mt-1">
                  {adFormErrors.amountPaid}
                </p>
              )}
            </div>
          </div>

          {/* Row: Payment Date & Payment Status in ONE row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={adFormData.paymentDate}
                onChange={(e) => setAdFormData({ ...adFormData, paymentDate: e.target.value })}
                className="w-full px-2.5 py-1.5 sm:py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Status
              </label>
              {(() => {
                const total = Number(adFormData.totalAmount || 0);
                const paid = Number(adFormData.amountPaid || 0);
                const status = paid <= 0 ? 'pending' : paid < total ? 'partial' : 'completed';

                return (
                  <div
                    className={clsx(
                      'w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl border flex items-center justify-between gap-1.5 transition-all select-none',
                      status === 'completed' && 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs',
                      status === 'partial' && 'bg-blue-50 text-blue-800 border-blue-200 shadow-2xs',
                      status === 'pending' && 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs'
                    )}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      {status === 'partial' && <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      {status === 'pending' && <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                      <span className="capitalize">{status}</span>
                    </div>
                    <span className="text-[10px] font-medium opacity-75 shrink-0 hidden sm:inline">
                      {status === 'completed' ? 'Full Paid' : status === 'partial' ? 'Partial Paid' : 'Awaiting'}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* UPI QR Code Quick View Card */}
          {(adFormData.modeOfPayment === 'UPI' || adFormData.modeOfPayment === 'QR') && (
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-slate-50 shadow-2xs animate-in fade-in duration-150">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs shrink-0">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-indigo-950 block truncate">Society Payment QR Code</span>
                  <span className="text-[9.5px] text-slate-500 block truncate">Scan using any UPI app (GPay, PhonePe, BHIM)</span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsQrModalOpen(true)}
                className="border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 h-7 text-[11px] font-semibold px-2 shadow-2xs shrink-0 ml-2"
              >
                <QrCode className="w-3 h-3 mr-1 text-indigo-600" />
                View QR
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
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-900 block">Cheque Information</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-0.5">
                    Cheque Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 102938"
                    value={adFormData.chequeNumber}
                    onChange={(e) => setAdFormData({ ...adFormData, chequeNumber: e.target.value })}
                    className={clsx(
                      'w-full px-2.5 py-1.5 text-xs bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-slate-800',
                      adFormErrors.chequeNumber ? 'border-rose-400' : 'border-amber-200'
                    )}
                  />
                  {adFormErrors.chequeNumber && (
                    <p className="text-[10px] text-rose-500 mt-0.5 font-medium">{adFormErrors.chequeNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-0.5">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SBI"
                    value={adFormData.bankName}
                    onChange={(e) => setAdFormData({ ...adFormData, bankName: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-amber-900 mb-0.5">
                    Cheque Date
                  </label>
                  <input
                    type="date"
                    value={adFormData.chequeDate}
                    onChange={(e) => setAdFormData({ ...adFormData, chequeDate: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all font-medium text-slate-800"
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
                className="w-full px-3 py-1.5 sm:py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800"
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
              className="w-full px-3 py-1.5 sm:py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium text-slate-800"
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

      {/* Society Dynamic UPI QR Code Modal Popup */}
      {(() => {
        const total = Number(adFormData.totalAmount || 0);
        const paid = Number(adFormData.amountPaid || 0);
        const pendingAmount = Math.max(0, total - paid);
        const qrAmount = pendingAmount > 0 ? pendingAmount : (total > 0 ? total : paid);

        return (
          <DynamicUpiQrModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            amount={qrAmount}
            unitOrAdvertiserName={adFormData.element || 'Advertisement Spot'}
            categoryOrEventName="Advertisement / Sponsorship"
            transactionNote={`Ad Payment: ${adFormData.element || 'Sponsor'}`}
            eventId={selectedEventId}
            onDone={() => {
              if (total > 0 && paid < total) {
                handlePaymentAmountChange(String(total), String(total));
              }
              setIsQrModalOpen(false);
            }}
          />
        );
      })()}

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

      {/* 2-Second Small Downside Payment Confirmation Pill */}
      {paymentFeedback && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/95 text-white shadow-xl border border-slate-800/80 text-xs font-medium backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-150 pointer-events-none whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{paymentFeedback}</span>
        </div>
      )}
    </div>
  );
};

export default AdvertisementsPage;
