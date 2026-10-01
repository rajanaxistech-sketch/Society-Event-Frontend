import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collectionsService } from '../../api/collectionsService';
import { eventsService } from '../../api/eventsService';
import { flatsService } from '../../api/flatsService';
import { bungalowsService } from '../../api/bungalowsService';
import { paymentMethodsService } from '../../api/paymentMethodsService';
import {
  EventCollectionItem,
  FlatItem,
  BungalowItem,
  PaymentItem,
  PaymentMethodItem,
  PaginationMeta,
  EventItem,
} from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import StatusBadge from '../../components/common/StatusBadge';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import { getEventTheme } from '../../utils/eventTheme';
import { getFileUrl } from '../../utils/fileHelper';
import { UpiProofCapture } from '../../components/common/UpiProofCapture';
import DynamicUpiQrModal from '../../components/payments/DynamicUpiQrModal';

import {
  Plus,
  Edit2,
  Wallet,
  Home,
  Building2,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  History,
  CreditCard,
  Layers,
  Phone,
  CheckSquare,
  Square,
  Sparkles,
  ArrowLeft,
  Calendar,
  ExternalLink,
  LayoutGrid,
  List,
  Banknote,
  QrCode,
  FileText,
  Smartphone,
  Landmark,
  Eye,
  Image as ImageIcon,
  X,
  Ticket,
  ChevronDown,
  Check,
  XCircle,
  HelpCircle,
} from 'lucide-react';

export const normalizeInterestStatus = (status?: string | null): string => {
  if (!status) return 'INTERESTED';
  const s = String(status).toUpperCase();
  if (s === 'OPTED_OUT' || s === 'OPTED OUT') return 'HOUSE_CLOSED';
  return s;
};

export const isZeroRequiredStatus = (status?: string | null): boolean => {
  const s = normalizeInterestStatus(status);
  return s === 'NOT_INTERESTED' || s === 'HOUSE_CLOSED';
};

export const isUncertainStatus = (status?: string | null): boolean => {
  const s = normalizeInterestStatus(status);
  return s === 'SECOND_HOME';
};

export const CONTRIBUTION_INTEREST_OPTIONS = [
  {
    value: 'INTERESTED',
    label: 'Interested',
    subtitle: 'Participating in event',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    iconBg: 'bg-emerald-100 text-emerald-700',
    activeClass: 'bg-emerald-50 text-emerald-950 border-emerald-300',
  },
  {
    value: 'TO_BE_CONFIRMED',
    label: 'To Be Confirmed',
    subtitle: 'Awaiting resident confirmation',
    icon: Clock,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/80',
    iconBg: 'bg-amber-100 text-amber-700',
    activeClass: 'bg-amber-50 text-amber-950 border-amber-300',
  },
  {
    value: 'NOT_INTERESTED',
    label: 'Not Interested',
    subtitle: 'Not attending this event',
    icon: XCircle,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
    iconBg: 'bg-slate-200 text-slate-700',
    activeClass: 'bg-slate-100 text-slate-900 border-slate-300',
  },
  {
    value: 'HOUSE_CLOSED',
    label: 'House Closed',
    subtitle: 'Premises locked / resident away',
    icon: Home,
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-300',
    iconBg: 'bg-zinc-200 text-zinc-700',
    activeClass: 'bg-zinc-100 text-zinc-900 border-zinc-300',
  },
  {
    value: 'SECOND_HOME',
    label: 'Second Home',
    subtitle: 'May Come / May Not Come',
    icon: HelpCircle,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    iconBg: 'bg-sky-100 text-sky-700',
    activeClass: 'bg-sky-50 text-sky-950 border-sky-300',
  },
];

const isUuid = (val: any): boolean => {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
};

export const getBlockPrefix = (towerOrBlock: any, fallbackIndex?: number): string => {
  if (!towerOrBlock) return fallbackIndex !== undefined ? String.fromCharCode(65 + fallbackIndex) : '';
  
  const code = (towerOrBlock.code || '').toString().trim();
  const name = (towerOrBlock.name || towerOrBlock.towerName || towerOrBlock.blockName || '').toString().trim();

  // If short alphanumeric code without space (e.g. 'A', 'B', 'T-A', 'BLK-A')
  if (code && code.length <= 4 && !code.includes(' ')) {
    return code.toUpperCase();
  }

  // Extract from name: e.g. "Tower A" -> "A", "Block B" -> "B", "Wing C" -> "C", "Tower-1" -> "1"
  const match = name.match(/^(?:tower|block|wing|building)\s*[-_]?\s*([a-zA-Z0-9]+)$/i);
  if (match && match[1]) {
    return match[1].toUpperCase();
  }

  if (name) {
    const cleaned = name.replace(/^(?:tower|block|wing|building)\s*/i, '').trim().toUpperCase();
    if (cleaned) return cleaned;
    return name.toUpperCase();
  }

  return fallbackIndex !== undefined ? String.fromCharCode(65 + fallbackIndex) : '';
};

export const formatFlatDisplayNumber = (
  flatNumber: string | number | undefined | null,
  blockPrefix?: string
): string => {
  if (flatNumber === undefined || flatNumber === null || flatNumber === '') return 'Unit';
  const raw = String(flatNumber).trim();
  if (!blockPrefix) return raw;

  const cleanPrefix = blockPrefix.trim().toUpperCase();
  // Check if raw already begins with the prefix (e.g., "A-101", "A101", "A 101", "A-201")
  const regex = new RegExp(`^${cleanPrefix}[-_\\s]*`, 'i');
  if (regex.test(raw)) {
    const numPart = raw.replace(regex, '');
    return numPart ? `${cleanPrefix}-${numPart}` : raw;
  }

  return `${cleanPrefix}-${raw}`;
};

const getTowerDisplayName = (tower: any, index?: number): string => {
  if (!tower) return index !== undefined ? `Tower ${index + 1}` : 'Tower';
  const rawName = (tower.name || tower.towerName || tower.code || (index !== undefined ? `${index + 1}` : '')).toString().trim();
  if (!rawName) return index !== undefined ? `Tower ${index + 1}` : 'Tower';
  if (/^(tower|wing|block|building)/i.test(rawName)) {
    return rawName;
  }
  return `Tower ${rawName}`;
};

const getFloorDisplayName = (floor: any): string => {
  if (!floor) return 'Floor';
  if (floor.floorName && typeof floor.floorName === 'string' && floor.floorName.trim().length > 0) {
    return floor.floorName;
  }
  if (floor.name && typeof floor.name === 'string' && floor.name.trim().length > 0) {
    return floor.name;
  }
  if (floor.floorNumber !== undefined && floor.floorNumber !== null) {
    return `Floor ${floor.floorNumber}`;
  }
  return 'Floor';
};

const generateMockMatrix = () => {
  const towers = ['A', 'B', 'C'].map((name) => {
    let towerTotal = 40;
    const floors: Array<{
      floorNumber: number;
      name: string;
      floorName: string;
      totalUnits: number;
      paidUnits: number;
      pendingUnits: number;
      flats: any[];
    }> = [];
    for (let f = 1; f <= 10; f++) {
      const flats: any[] = [];
      const suffixes = ['A', 'B', 'C', 'D'];
      suffixes.forEach((suf, idx) => {
        const flatNum = `${f}0${idx + 1}`;
        flats.push({
          id: `tower-${name.toLowerCase()}-${flatNum}`,
          flatNumber: flatNum,
          displayFlatNumber: `${name}-${flatNum}`,
          blockPrefix: name,
          status: 'pending',
          amount: 4000,
          amountPaid: 0,
          pendingAmount: 4000,
          passes: 0,
          interestStatus: 'INTERESTED',
          interest_status: 'INTERESTED',
          residentName: `Resident ${flatNum}`,
          phone: '+91 98765 43210',
          paymentMethod: undefined,
        });
      });
      floors.push({
        floorNumber: f,
        name: `Floor ${f}`,
        floorName: `Floor ${f}`,
        totalUnits: 4,
        paidUnits: 0,
        pendingUnits: 4,
        flats,
      });
    }
    return {
      name: `Tower ${name}`,
      towerName: name,
      code: name,
      totalUnits: 40,
      paidUnits: 0,
      pendingUnits: 40,
      floors,
    };
  });

  const totalUnits = 120;
  const paidUnits = 0;

  return {
    summary: {
      totalUnits,
      paidUnits,
      pendingUnits: totalUnits,
      totalTarget: totalUnits * 4000,
      totalCollected: 0,
      progressPercentage: 0,
    },
    towers,
  };
};

interface EventCollectionsPageProps {
  eventId?: string;
}

export const EventCollectionsPage: React.FC<EventCollectionsPageProps> = ({ eventId: propEventId }) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = decodeId(propEventId || routeEventId);
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [collections, setCollections] = useState<EventCollectionItem[]>([]);
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [bungalows, setBungalows] = useState<BungalowItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);

  // Modals
  // 1. Mark as Paid (Record Payment) Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [payingCollection, setPayingCollection] = useState<EventCollectionItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [passes, setPasses] = useState<number>(0);
  const [interestStatus, setInterestStatus] = useState<string>('interested');
  const [isPassesDropdownOpen, setIsPassesDropdownOpen] = useState(false);
  const [isInterestDropdownOpen, setIsInterestDropdownOpen] = useState(false);
  const passesDropdownRef = useRef<HTMLDivElement>(null);
  const interestDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (passesDropdownRef.current && !passesDropdownRef.current.contains(e.target as Node)) {
        setIsPassesDropdownOpen(false);
      }
      if (interestDropdownRef.current && !interestDropdownRef.current.contains(e.target as Node)) {
        setIsInterestDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);
  const [proofFile, setProofFile] = useState<File | Blob | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [enlargedProofUrl, setEnlargedProofUrl] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodItem[]>([]);

  // 1b. Expected Fee Editing State (inside Payment Modal & Seat Map)
  const [isEditingExpectedFee, setIsEditingExpectedFee] = useState(false);
  const [customExpectedFee, setCustomExpectedFee] = useState('');
  const [isSavingExpectedFee, setIsSavingExpectedFee] = useState(false);

  // 2. Adjust / Override Amount Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustTarget, setAdjustTarget] = useState<EventCollectionItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [isUpdatingAmount, setIsUpdatingAmount] = useState(false);

  // 3. Payment History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<EventCollectionItem | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 4. Create Individual Obligation Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [unitType, setUnitType] = useState<'flat' | 'bungalow'>('flat');
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [selectedBungalowId, setSelectedBungalowId] = useState('');
  const [modalDefaultAmount, setModalDefaultAmount] = useState('5000');
  const [modalCustomAmount, setModalCustomAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 5. Bulk Mark Paid Modal
  const [bulkPayModalOpen, setBulkPayModalOpen] = useState(false);
  const [bulkPayMethod, setBulkPayMethod] = useState('CASH');
  const [isProcessingBulkPay, setIsProcessingBulkPay] = useState(false);

  // 6. Bulk Update Amount Modal
  const [bulkAmountModalOpen, setBulkAmountModalOpen] = useState(false);
  const [bulkNewAmount, setBulkNewAmount] = useState('5000');
  const [isProcessingBulkAmount, setIsProcessingBulkAmount] = useState(false);

  // 7. Auto-Generate / Sync Dialog
  const [generateConfirmOpen, setGenerateConfirmOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load supporting society unit data & event details
  useEffect(() => {
    if (eventId) {
      eventsService.getById(eventId).then((res) => {
        if (res.success && res.data) {
          setEvent(res.data);
          if (res.data.default_collection_amount) {
            setModalDefaultAmount(String(res.data.default_collection_amount));
          }
        }
      });
    }
    flatsService.getAll({ limit: 200 }).then((res) => {
      if (res.success && res.data) setFlats(res.data);
    });
    bungalowsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setBungalows(res.data);
    });
  }, [eventId]);

  const fetchPaymentMethods = async () => {
    try {
      const res = await paymentMethodsService.getAll({ status: 'active' });
      if (res.success && res.data) {
        const activeOnly = res.data.filter(
          (m) => (m.status ? m.status.toLowerCase() === 'active' : m.is_active !== false)
        );
        setAvailablePaymentMethods(activeOnly);
        if (activeOnly.length > 0) {
          setPayMethod((prev) => (activeOnly.some((m) => m.code === prev) ? prev : activeOnly[0].code));
          setBulkPayMethod((prev) => (activeOnly.some((m) => m.code === prev) ? prev : activeOnly[0].code));
        } else {
          setPayMethod('');
          setBulkPayMethod('');
        }
      }
    } catch { }
  };

  const fetchCollections = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const res = await collectionsService.listByEvent(eventId, {
        page: meta.page,
        limit: meta.limit,
        search: searchQuery || undefined,
        status: statusFilter || undefined,
      });
      if (res.success && res.data) {
        setCollections(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load collections'));
    } finally {
      setIsLoading(false);
    }
  };

  // Flat Collections State
  const [matrixData, setMatrixData] = useState<any>(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [selectedTowerIndex, setSelectedTowerIndex] = useState(0);
  const [selectedFlatForPayment, setSelectedFlatForPayment] = useState<any>(null);

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

  const fetchMatrix = async (showSpinner = false) => {
    if (!eventId) {
      setIsLoadingMatrix(false);
      return;
    }

    try {
      if (showSpinner) {
        setIsLoadingMatrix(true);
      }
      const res = await collectionsService.getMatrix(eventId);
      if (res.success && res.data && res.data.towers?.length > 0) {
        setMatrixData(res.data);
      } else {
        const mock = generateMockMatrix();
        setMatrixData((prev: any) => prev || mock);
      }
    } catch (err: any) {
      const mock = generateMockMatrix();
      setMatrixData((prev: any) => prev || mock);
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  // 1. Initial one-time comprehensive refresh on page arrival
  useEffect(() => {
    if (eventId) {
      fetchPaymentMethods();
      fetchMatrix(true);
      fetchCollections();
    }
  }, [eventId]);

  // 2. Subsequent pagination / status filter changes for ledger table
  useEffect(() => {
    if (eventId) {
      fetchCollections();
    }
  }, [meta.page, meta.limit, statusFilter]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefreshAll = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchCollections(),
        fetchMatrix(false),
        fetchPaymentMethods(),
      ]);
      toast.success('Collection data refreshed successfully');
    } catch {
      toast.error('Failed to refresh collection data');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSeatMapFlatClick = (flat: any) => {
    setPayingCollection(null);
    setSelectedFlatForPayment(flat);
    const curInterest = normalizeInterestStatus(flat.interestStatus || flat.interest_status);
    const isZeroReq = isZeroRequiredStatus(curInterest);
    const isUncertain = isUncertainStatus(curInterest);
    const defaultFee = Number(event?.default_collection_amount || 2500);
    const rawAmt = Number(flat.amount ?? defaultFee);
    const expAmt = isZeroReq ? 0 : (rawAmt > 0 ? rawAmt : defaultFee);
    const paidAmt = isZeroReq ? 0 : Number(flat.amountPaid ?? 0);
    const pendingAmt = isZeroReq ? 0 : Math.max(0, expAmt - paidAmt);

    // If flat is NOT_INTERESTED or HOUSE_CLOSED, payAmount is 0. If SECOND_HOME, payAmount is 0 unless paidAmt > 0
    let defaultPayAmt = '0';
    if (!isZeroReq) {
      if (paidAmt > 0) {
        defaultPayAmt = String(paidAmt);
      } else if (isUncertain) {
        defaultPayAmt = '0';
      } else {
        defaultPayAmt = String(pendingAmt > 0 ? pendingAmt : expAmt);
      }
    }

    setPayAmount(defaultPayAmt);
    setCustomExpectedFee(String(expAmt));
    setIsEditingExpectedFee(false);

    // Pre-fill Payment Method: restore previously saved method (UPI, CASH, CHEQUE, BANK_TRANSFER), fallback to CASH
    const savedMethod = (flat.paymentMethod || flat.payment_method || (flat.payments?.[0]?.payment_method?.code) || 'CASH').toUpperCase();
    setPayMethod(savedMethod);

    // Pre-fill Remarks / Notes & Reference Details
    const lastPayment = flat.payments?.[0];
    const savedNotes = flat.notes !== undefined && flat.notes !== null ? flat.notes : (lastPayment?.notes || '');
    setPayNotes(savedNotes);

    const savedTxRef = flat.transactionReference || flat.transaction_reference || lastPayment?.transaction_reference || '';
    setTransactionReference(savedTxRef);

    const savedChequeNumber = flat.chequeNumber || flat.cheque_number || lastPayment?.cheque_number || '';
    setChequeNumber(savedChequeNumber);

    const savedBankName = flat.bankName || flat.bank_name || lastPayment?.bank_name || '';
    setBankName(savedBankName);

    const savedChequeDate = flat.chequeDate || flat.cheque_date || (lastPayment?.cheque_date ? lastPayment.cheque_date.split('T')[0] : '');
    setChequeDate(savedChequeDate);

    const savedPayDate = flat.paidAt || flat.paymentDate || (lastPayment?.payment_date ? lastPayment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setPayDate(savedPayDate);

    setProofFile(null);
    setProofPreviewUrl(flat.proofUrl || flat.proof_url || lastPayment?.proof_url || null);

    let defaultPasses = 0;
    if (!isZeroReq && !isUncertain) {
      defaultPasses = flat.passes !== undefined && flat.passes !== null ? Number(flat.passes) : (flat.numberOfPasses ? Number(flat.numberOfPasses) : 0);
    } else if (isUncertain) {
      defaultPasses = flat.passes !== undefined && flat.passes !== null ? Number(flat.passes) : 0;
    }

    setPasses(defaultPasses);
    setInterestStatus(curInterest);
    setIsQrModalOpen(false);
    setPayModalOpen(true);
  };

  const handleSaveExpectedFee = async () => {
    const newFee = Number(customExpectedFee);
    if (isNaN(newFee) || newFee <= 0) {
      toast.warning('Expected fee must be greater than 0');
      return;
    }

    try {
      setIsSavingExpectedFee(true);
      if (selectedFlatForPayment) {
        if (!isUuid(eventId) || !isUuid(selectedFlatForPayment.id)) {
          // Instant in-memory update for mock/demo
          if (matrixData) {
            const updated = JSON.parse(JSON.stringify(matrixData));
            for (const tower of updated.towers || []) {
              for (const floor of tower.floors || []) {
                for (const flat of floor.flats || []) {
                  if (flat.id === selectedFlatForPayment.id || flat.flatNumber === selectedFlatForPayment.flatNumber) {
                    flat.amount = newFee;
                    flat.pendingAmount = Math.max(0, newFee - Number(flat.amountPaid || 0));
                  }
                }
              }
            }
            setMatrixData(updated);
          }
          selectedFlatForPayment.amount = newFee;
          toast.success(`Expected fee updated to ₹${newFee} for Flat ${selectedFlatForPayment.displayFlatNumber || selectedFlatForPayment.flatNumber}`);
          setIsEditingExpectedFee(false);
          return;
        }

        const res = await collectionsService.updateFlatAmount(eventId, selectedFlatForPayment.id, newFee);
        if (res.success) {
          toast.success(`Expected fee updated to ₹${newFee} for Flat ${selectedFlatForPayment.displayFlatNumber || selectedFlatForPayment.flatNumber}`);
          setIsEditingExpectedFee(false);
          selectedFlatForPayment.amount = newFee;
          await Promise.all([fetchMatrix(false), fetchCollections()]);
        } else {
          toast.error(res.message || 'Failed to update expected fee');
        }
      } else if (payingCollection) {
        if (!isUuid(payingCollection.id)) {
          payingCollection.expected_amount = newFee;
          payingCollection.pending_amount = Math.max(0, newFee - Number(payingCollection.amount_paid || 0));
          toast.success(`Expected fee updated to ₹${newFee}`);
          setIsEditingExpectedFee(false);
          return;
        }

        const res = await collectionsService.update(payingCollection.id, { custom_amount: newFee });
        if (res.success) {
          toast.success(`Expected fee updated to ₹${newFee}`);
          setIsEditingExpectedFee(false);
          payingCollection.expected_amount = newFee;
          payingCollection.pending_amount = Math.max(0, newFee - Number(payingCollection.amount_paid || 0));
          await Promise.all([fetchCollections(), fetchMatrix()]);
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update expected fee'));
    } finally {
      setIsSavingExpectedFee(false);
    }
  };

  const handleSeatMapPaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFlatForPayment || !eventId) return;

    const normInterest = normalizeInterestStatus(interestStatus);
    const isZeroReq = isZeroRequiredStatus(normInterest);
    const enteredAmount = isZeroReq ? 0 : Number(payAmount);
    const finalPasses = isZeroReq ? 0 : Number(passes);
    const defaultFee = Number(event?.default_collection_amount || 2500);
    const rawExpected = Number(customExpectedFee || selectedFlatForPayment.amount || defaultFee);
    const expectedAmount = isZeroReq ? 0 : (rawExpected > 0 ? rawExpected : defaultFee);
    const newPending = isZeroReq ? 0 : Math.max(0, expectedAmount - enteredAmount);
    const newStatus = isZeroReq ? 'pending' : (newPending <= 0 && expectedAmount > 0 ? 'paid' : enteredAmount > 0 ? 'partially_paid' : 'pending');

    try {
      setIsProcessingPayment(true);

      // Upload proof file if user snapped/selected a receipt image
      let uploadedProofUrl: string | undefined = undefined;
      if (proofFile && !isZeroReq) {
        try {
          const uploadRes = await collectionsService.uploadProof(proofFile);
          if (uploadRes.success && uploadRes.data?.proof_url) {
            uploadedProofUrl = uploadRes.data.proof_url;
          }
        } catch (uploadErr) {
          console.warn('Failed to upload proof image, proceeding without proof:', uploadErr);
        }
      }

      const res = await collectionsService.payFlat(eventId, selectedFlatForPayment.id, {
        amount: enteredAmount,
        payment_method: payMethod || 'CASH',
        transaction_reference: transactionReference || undefined,
        proof_url: uploadedProofUrl !== undefined ? uploadedProofUrl : (proofPreviewUrl || undefined),
        notes: payNotes || undefined,
        cheque_number: chequeNumber || undefined,
        bank_name: bankName || undefined,
        cheque_date: chequeDate || undefined,
        passes: finalPasses,
        interest_status: normInterest,
        interestStatus: normInterest,
      });

      if (res.success) {
        const savedProof = uploadedProofUrl !== undefined ? uploadedProofUrl : (proofPreviewUrl || undefined);
        selectedFlatForPayment.passes = finalPasses;
        selectedFlatForPayment.interestStatus = normInterest;
        selectedFlatForPayment.interest_status = normInterest;
        selectedFlatForPayment.amount = expectedAmount;
        selectedFlatForPayment.amountPaid = enteredAmount;
        selectedFlatForPayment.pendingAmount = newPending;
        selectedFlatForPayment.status = newStatus;
        selectedFlatForPayment.paymentMethod = isZeroReq ? null : payMethod;
        selectedFlatForPayment.notes = payNotes;
        selectedFlatForPayment.transactionReference = transactionReference;
        selectedFlatForPayment.chequeNumber = chequeNumber;
        selectedFlatForPayment.bankName = bankName;
        selectedFlatForPayment.chequeDate = chequeDate;
        selectedFlatForPayment.paidAt = payDate;
        selectedFlatForPayment.proofUrl = savedProof;

        if (matrixData) {
          const updated = JSON.parse(JSON.stringify(matrixData));
          for (const tower of updated.towers || []) {
            for (const floor of tower.floors || []) {
              for (const flat of floor.flats || []) {
                if (flat.id === selectedFlatForPayment.id || flat.flatNumber === selectedFlatForPayment.flatNumber) {
                  flat.status = newStatus;
                  flat.amount = expectedAmount;
                  flat.amountPaid = enteredAmount;
                  flat.pendingAmount = newPending;
                  flat.paymentMethod = isZeroReq ? null : payMethod;
                  flat.passes = finalPasses;
                  flat.interestStatus = normInterest;
                  flat.interest_status = normInterest;
                  flat.notes = payNotes;
                  flat.transactionReference = transactionReference;
                  flat.chequeNumber = chequeNumber;
                  flat.bankName = bankName;
                  flat.chequeDate = chequeDate;
                  flat.paidAt = payDate;
                  flat.proofUrl = savedProof;
                }
              }
            }
          }
          setMatrixData(updated);
        }

        let toastMsg = res.data?.message;
        if (!toastMsg) {
          if (normInterest === 'HOUSE_CLOSED') {
            toastMsg = `Flat ${selectedFlatForPayment.displayFlatNumber || selectedFlatForPayment.flatNumber} marked as House Closed`;
          } else if (normInterest === 'NOT_INTERESTED') {
            toastMsg = `Flat ${selectedFlatForPayment.displayFlatNumber || selectedFlatForPayment.flatNumber} marked as Not Interested`;
          } else if (normInterest === 'SECOND_HOME') {
            toastMsg = `Flat ${selectedFlatForPayment.displayFlatNumber || selectedFlatForPayment.flatNumber} marked as Second Home`;
          } else {
            toastMsg = `🎉 Flat ${selectedFlatForPayment.displayFlatNumber || selectedFlatForPayment.flatNumber} payment updated to ₹${enteredAmount}`;
          }
        }
        toast.success(toastMsg);
        setPayModalOpen(false);
        setSelectedFlatForPayment(null);
        await Promise.all([fetchMatrix(), fetchCollections()]);
      } else {
        toast.error(res.message || 'Failed to update flat payment');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update flat payment'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMeta((prev) => ({ ...prev, page: 1 }));
    fetchCollections();
  };

  // Dashboard summary metrics calculation
  const dashboardMetrics = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalPending = 0;
    let paidCount = 0;
    let partialCount = 0;
    let notPaidCount = 0;

    collections.forEach((c) => {
      const exp = Number(c.expected_amount || 0);
      const paid = Number(c.amount_paid || 0);
      const pend = Number(c.pending_amount || 0);

      totalExpected += exp;
      totalCollected += paid;
      totalPending += pend;

      if (c.status === 'paid') paidCount++;
      else if (c.status === 'partially_paid') partialCount++;
      else notPaidCount++;
    });

    const totalFlats = meta.total || collections.length;

    return {
      totalFlats,
      totalExpected,
      totalCollected,
      totalPending,
      paidCount,
      partialCount,
      notPaidCount,
    };
  }, [collections, meta.total]);

  // Payment Modal handler
  const openPayModal = (col: EventCollectionItem) => {
    setSelectedFlatForPayment(null);
    setPayingCollection(col);
    const curInterest = normalizeInterestStatus((col as any).interest_status || (col as any).interestStatus);
    const isZeroReq = isZeroRequiredStatus(curInterest);
    const isUncertain = isUncertainStatus(curInterest);
    const defaultFee = Number(event?.default_collection_amount || 2500);
    const rawAmt = Number(col.expected_amount ?? defaultFee);
    const expAmt = isZeroReq ? 0 : (rawAmt > 0 ? rawAmt : defaultFee);
    const paidAmt = isZeroReq ? 0 : Number(col.amount_paid ?? 0);
    const pendingAmt = isZeroReq ? 0 : Math.max(0, expAmt - paidAmt);

    let defaultPayAmt = '0';
    if (!isZeroReq) {
      if (paidAmt > 0) {
        defaultPayAmt = String(paidAmt);
      } else if (isUncertain) {
        defaultPayAmt = '0';
      } else {
        defaultPayAmt = String(pendingAmt > 0 ? pendingAmt : expAmt);
      }
    }

    setPayAmount(defaultPayAmt);
    setCustomExpectedFee(String(expAmt));
    setIsEditingExpectedFee(false);

    const lastPayment = col.payments?.[0];
    const savedMethod = (lastPayment?.payment_method?.code || (col as any).paymentMethod || (col as any).payment_method || 'CASH').toUpperCase();
    setPayMethod(savedMethod);
    const savedPayDate = lastPayment?.payment_date ? lastPayment.payment_date.split('T')[0] : (col.last_payment_date ? col.last_payment_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setPayDate(savedPayDate);
    setChequeNumber(lastPayment?.cheque_number || (col as any).chequeNumber || '');
    setBankName(lastPayment?.bank_name || (col as any).bankName || '');
    setChequeDate(lastPayment?.cheque_date ? lastPayment.cheque_date.split('T')[0] : ((col as any).chequeDate ? (col as any).chequeDate.split('T')[0] : ''));
    setTransactionReference(lastPayment?.transaction_reference || (col as any).transactionReference || '');
    setPayNotes(lastPayment?.notes !== undefined && lastPayment?.notes !== null ? lastPayment.notes : ((col as any).notes || ''));

    let defaultPasses = 0;
    if (!isZeroReq && !isUncertain) {
      defaultPasses = col.passes !== undefined && col.passes !== null ? Number(col.passes) : 0;
    } else if (isUncertain) {
      defaultPasses = col.passes !== undefined && col.passes !== null ? Number(col.passes) : 0;
    }

    setPasses(defaultPasses);
    setInterestStatus(curInterest);
    setProofFile(null);
    setProofPreviewUrl(col.payments?.[0]?.proof_url || (col as any).proofUrl || null);
    setIsQrModalOpen(false);
    setPayModalOpen(true);
    fetchPaymentMethods();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCollection) return;

    const normInterest = normalizeInterestStatus(interestStatus);
    const isZeroReq = isZeroRequiredStatus(normInterest);
    const amt = isZeroReq ? 0 : Number(payAmount);
    const finalPasses = isZeroReq ? 0 : Number(passes);
    const defaultFee = Number(event?.default_collection_amount || 2500);
    const rawExpected = Number(customExpectedFee || payingCollection.expected_amount || defaultFee);
    const expected = isZeroReq ? 0 : (rawExpected > 0 ? rawExpected : defaultFee);

    if (amt < 0) {
      toast.warning('Payment amount cannot be negative');
      return;
    }
    if (amt > expected && !isZeroReq) {
      toast.error(`Payment cannot exceed expected fee of ${formatCurrency(expected)}`);
      return;
    }

    try {
      setIsProcessingPayment(true);

      // Upload proof file if user snapped/selected a receipt image
      let uploadedProofUrl: string | undefined = undefined;
      if (proofFile && !isZeroReq) {
        try {
          const uploadRes = await collectionsService.uploadProof(proofFile);
          if (uploadRes.success && uploadRes.data?.proof_url) {
            uploadedProofUrl = uploadRes.data.proof_url;
          }
        } catch (uploadErr) {
          console.warn('Failed to upload proof image, proceeding without proof:', uploadErr);
        }
      }

      const res = await collectionsService.recordPayment(payingCollection.id, {
        amount: amt,
        payment_method: payMethod || 'CASH',
        payment_date: payDate,
        cheque_number: payMethod === 'CHEQUE' ? chequeNumber : null,
        bank_name: payMethod === 'CHEQUE' ? bankName : null,
        cheque_date: payMethod === 'CHEQUE' && chequeDate ? chequeDate : null,
        transaction_reference: transactionReference || null,
        proof_url: uploadedProofUrl !== undefined ? uploadedProofUrl : (proofPreviewUrl || null),
        notes: payNotes || null,
        passes: finalPasses,
        interest_status: normInterest,
        interestStatus: normInterest,
      });

      if (res.success) {
        const savedProof = uploadedProofUrl !== undefined ? uploadedProofUrl : (proofPreviewUrl || null);
        payingCollection.expected_amount = expected;
        payingCollection.amount_paid = amt;
        payingCollection.pending_amount = isZeroReq ? 0 : Math.max(0, expected - amt);
        payingCollection.passes = finalPasses;
        payingCollection.interest_status = normInterest;
        payingCollection.interestStatus = normInterest;
        (payingCollection as any).paymentMethod = isZeroReq ? null : payMethod;
        (payingCollection as any).notes = payNotes;
        (payingCollection as any).transactionReference = transactionReference;
        (payingCollection as any).chequeNumber = chequeNumber;
        (payingCollection as any).bankName = bankName;
        (payingCollection as any).chequeDate = chequeDate;
        (payingCollection as any).paidAt = payDate;
        (payingCollection as any).proofUrl = savedProof;

        let successMsg = `✓ Payment updated to ${formatCurrency(amt)} successfully`;
        if (normInterest === 'HOUSE_CLOSED') successMsg = '✓ Marked as House Closed';
        else if (normInterest === 'NOT_INTERESTED') successMsg = '✓ Marked as Not Interested';
        else if (normInterest === 'SECOND_HOME') successMsg = '✓ Marked as Second Home';
        triggerBottomFeedback(successMsg);
        setPayModalOpen(false);
        fetchCollections();
        fetchMatrix();
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to record payment'));
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Adjust Amount Modal handler
  const openAdjustModal = (col: EventCollectionItem) => {
    setAdjustTarget(col);
    setAdjustAmount(col.custom_amount ? String(col.custom_amount) : String(col.expected_amount));
    setAdjustModalOpen(true);
  };

  const handleUpdateAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustTarget) return;

    const amt = Number(adjustAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.warning('Collection amount must be greater than 0');
      return;
    }

    try {
      setIsUpdatingAmount(true);
      const res = await collectionsService.update(adjustTarget.id, {
        custom_amount: amt,
      });

      if (res.success) {
        toast.success(`Collection amount adjusted to ${formatCurrency(amt)}.`);
        setAdjustModalOpen(false);
        fetchCollections();
      } else {
        toast.error(res.message || 'Failed to adjust amount');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update collection amount'));
    } finally {
      setIsUpdatingAmount(false);
    }
  };

  // Payment History Modal handler
  const openHistoryModal = async (col: EventCollectionItem) => {
    setHistoryTarget(col);
    setHistoryModalOpen(true);
    try {
      setIsLoadingHistory(true);
      const res = await collectionsService.getPaymentHistory(col.id);
      if (res.success && res.data) {
        setPaymentHistory(res.data);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load payment history'));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Generate / Sync All Society Units
  const handleGenerateCollections = async () => {
    if (!eventId) return;
    try {
      setIsGenerating(true);
      const res = await collectionsService.generate(eventId);
      if (res.success && res.data) {
        toast.success(
          `Collections synchronized! ${res.data.newlyGenerated} new unit record(s) prepared.`
        );
        setGenerateConfirmOpen(false);
        fetchCollections();
      } else {
        toast.error(res.message || 'Failed to generate collections');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to sync collections'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Bulk Mark Paid
  const handleBulkPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCollectionIds.length === 0) return;

    if (!bulkPayMethod) {
      toast.warning('Please select an active payment method');
      return;
    }

    try {
      setIsProcessingBulkPay(true);
      const res = await collectionsService.bulkMarkPaid({
        collection_ids: selectedCollectionIds,
        payment_method: bulkPayMethod,
        payment_date: new Date().toISOString().split('T')[0],
      });

      if (res.success && res.data) {
        toast.success(`Successfully marked ${res.data.processed} collection record(s) as paid.`);
        setBulkPayModalOpen(false);
        setSelectedCollectionIds([]);
        fetchCollections();
      } else {
        toast.error(res.message || 'Failed to process bulk payments');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to execute bulk payment'));
    } finally {
      setIsProcessingBulkPay(false);
    }
  };

  // Bulk Update Collection Amount
  const handleBulkUpdateAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCollectionIds.length === 0) return;

    try {
      setIsProcessingBulkAmount(true);
      const res = await collectionsService.bulkUpdateAmount({
        collection_ids: selectedCollectionIds,
        amount: Number(bulkNewAmount) || 5000,
      });

      if (res.success && res.data) {
        toast.success(`Updated expected amount for ${res.data.updated} selected unit(s).`);
        setBulkAmountModalOpen(false);
        setSelectedCollectionIds([]);
        fetchCollections();
      } else {
        toast.error(res.message || 'Failed to update amounts');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to execute bulk update'));
    } finally {
      setIsProcessingBulkAmount(false);
    }
  };

  // CSV Export
  const handleExportCsv = async () => {
    if (!eventId) return;
    try {
      const blob = await collectionsService.exportCsv(eventId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event?.name || 'Event'}_Collections_Report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Collection report exported successfully.');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to export collections report'));
    }
  };

  // Selection toggle
  const toggleSelectAll = () => {
    if (selectedCollectionIds.length === collections.length) {
      setSelectedCollectionIds([]);
    } else {
      setSelectedCollectionIds(collections.map((c) => c.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const columns: Column<EventCollectionItem>[] = [
    {
      key: 'select',
      header: (
        <button type="button" onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-700">
          {collections.length > 0 && selectedCollectionIds.length === collections.length ? (
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>
      ),
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleSelectRow(row.id);
          }}
          className="text-slate-400 hover:text-slate-700"
        >
          {selectedCollectionIds.includes(row.id) ? (
            <CheckSquare className="w-4 h-4 text-indigo-600" />
          ) : (
            <Square className="w-4 h-4" />
          )}
        </button>
      ),
    },
    {
      key: 'unit',
      header: 'Flat / Unit',
      render: (row) => {
        if (row.flat) {
          const prefix = getBlockPrefix(row.flat.floor?.block);
          const dispNum = formatFlatDisplayNumber(row.flat.flat_number, prefix);
          return (
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <Home className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                Flat {dispNum}{' '}
                <span className="font-normal text-slate-400">({row.flat.floor?.block?.name || 'Block'})</span>
              </span>
            </div>
          );
        }
        if (row.bungalow) {
          return (
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Bungalow {row.bungalow.bungalow_number}</span>
            </div>
          );
        }
        return <span className="text-slate-400 text-xs">—</span>;
      },
    },
    {
      key: 'owner',
      header: 'Member / Resident',
      render: (row) => {
        const owner =
          row.flat?.persons?.find((p) => p.is_primary_owner) ||
          row.flat?.persons?.[0] ||
          row.bungalow?.persons?.find((p) => p.is_primary_owner) ||
          row.bungalow?.persons?.[0];

        return (
          <div>
            <span className="text-xs font-semibold text-slate-800 block">{owner?.full_name || '—'}</span>
            {owner?.phone && (
              <span className="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                <Phone className="w-2.5 h-2.5" /> {owner.phone}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'expected_amount',
      header: 'Expected Fee',
      align: 'right',
      render: (row) => (
        <div>
          <CurrencyDisplay amount={row.expected_amount} className="font-bold text-slate-900" />
          {row.custom_amount !== null && row.custom_amount !== undefined && (
            <span className="text-[9px] text-amber-600 font-bold block uppercase tracking-tight">
              Override
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'amount_paid',
      header: 'Paid Amount',
      align: 'right',
      render: (row) => <CurrencyDisplay amount={row.amount_paid} trend="positive" />,
    },
    {
      key: 'pending_amount',
      header: 'Balance Remaining',
      align: 'right',
      render: (row) => (
        <CurrencyDisplay
          amount={row.pending_amount}
          trend={Number(row.pending_amount) > 0 ? 'negative' : 'neutral'}
          className="font-extrabold"
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => {
        const norm = normalizeInterestStatus(row.interest_status || (row as any).interestStatus);
        if (norm === 'HOUSE_CLOSED') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-300">
              House Closed
            </span>
          );
        }
        if (norm === 'NOT_INTERESTED') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-300">
              Not Interested
            </span>
          );
        }
        if (norm === 'SECOND_HOME') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              Second Home
            </span>
          );
        }
        if (norm === 'TO_BE_CONFIRMED') {
          return (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
              To Confirm
            </span>
          );
        }
        const st = row.status === 'pending' ? 'Not Paid' : row.status === 'partially_paid' ? 'Partial' : 'Paid';
        return <StatusBadge status={row.status} label={st} size="sm" />;
      },
    },
    {
      key: 'last_payment',
      header: 'Payment Info',
      render: (row) => {
        if (!row.last_payment_date && Number(row.amount_paid) === 0) {
          return <span className="text-[11px] text-slate-400 italic">No payments</span>;
        }
        return (
          <div className="text-[11px]">
            <span className="font-medium text-slate-700 block">{formatDate(row.last_payment_date)}</span>
            {row.receipt_reference && (
              <span className="text-[10px] text-slate-400 block font-mono">{row.receipt_reference}</span>
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
          <button
            type="button"
            onClick={() => openHistoryModal(row)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Payment History"
          >
            <History className="w-3.5 h-3.5" />
          </button>

          <PermissionGuard permission={Permissions.COLLECTION_UPDATE}>
            <button
              type="button"
              onClick={() => openAdjustModal(row)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Override Collection Amount"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>

          <PermissionGuard permission={Permissions.PAYMENT_CREATE}>
            {Number(row.pending_amount) > 0 ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => openPayModal(row)}
                className="text-[11px] h-7 px-2.5 font-bold"
              >
                Pay
              </Button>
            ) : (
              <span className="text-[11px] text-emerald-600 font-bold px-2 py-0.5 bg-emerald-50 rounded">
                Paid
              </span>
            )}
          </PermissionGuard>
        </div>
      ),
    },
  ];

  const isStandalone = !propEventId;

  const currentTower = matrixData?.towers?.[selectedTowerIndex] || matrixData?.towers?.[0];

  const flatList: any[] = useMemo(() => {
    if (currentTower?.floors && currentTower.floors.length > 0) {
      const prefix = getBlockPrefix(currentTower, selectedTowerIndex);
      return currentTower.floors.flatMap((fl: any) =>
        (fl.flats || []).map((f: any) => ({
          ...f,
          displayFlatNumber: formatFlatDisplayNumber(f.flatNumber, prefix),
          blockPrefix: prefix,
          towerName: currentTower.name || currentTower.towerName,
        }))
      );
    }
    if (matrixData?.towers && matrixData.towers.length > 0) {
      return matrixData.towers.flatMap((t: any, tIdx: number) => {
        const prefix = getBlockPrefix(t, tIdx);
        return (
          t.floors?.flatMap((fl: any) =>
            (fl.flats || []).map((f: any) => ({
              ...f,
              displayFlatNumber: formatFlatDisplayNumber(f.flatNumber, prefix),
              blockPrefix: prefix,
              towerName: t.name || t.towerName,
            }))
          ) || []
        );
      });
    }
    if (collections && collections.length > 0) {
      return collections.map((c) => {
        const owner =
          c.flat?.persons?.find((p) => p.is_primary_owner) ||
          c.flat?.persons?.[0] ||
          c.bungalow?.persons?.find((p) => p.is_primary_owner) ||
          c.bungalow?.persons?.[0];

        const block = c.flat?.floor?.block;
        const prefix = block ? getBlockPrefix(block) : getBlockPrefix(currentTower, selectedTowerIndex);
        const rawFlatNumber = c.flat?.flat_number || c.bungalow?.bungalow_number || 'Unit';
        const displayFlatNumber = c.flat
          ? formatFlatDisplayNumber(rawFlatNumber, prefix)
          : `Bungalow ${rawFlatNumber}`;

        const normInterest = normalizeInterestStatus((c as any).interest_status || (c as any).interestStatus);
        const isZeroReq = isZeroRequiredStatus(normInterest);
        const defaultFee = Number(event?.default_collection_amount || 2500);
        const rawExpected = Number(c.expected_amount || defaultFee);
        const expectedAmt = isZeroReq ? 0 : (rawExpected > 0 ? rawExpected : defaultFee);
        const paidAmt = isZeroReq ? 0 : Number(c.amount_paid || 0);
        const pendingAmt = isZeroReq ? 0 : (c.pending_amount !== undefined ? Number(c.pending_amount) : Math.max(0, expectedAmt - paidAmt));
        const lastPayment = c.payments?.[0];

        return {
          id: c.flat_id || c.id,
          collectionId: c.id,
          flatNumber: rawFlatNumber,
          displayFlatNumber,
          blockPrefix: prefix,
          towerName: block?.name || currentTower?.name,
          status: isZeroReq ? 'pending' : c.status,
          amount: expectedAmt,
          amountPaid: paidAmt,
          pendingAmount: pendingAmt,
          residentName: owner?.full_name || 'Resident',
          passes: isZeroReq ? 0 : (c.passes !== undefined && c.passes !== null ? Number(c.passes) : 0),
          interestStatus: normInterest,
          interest_status: normInterest,
          paymentMethod: lastPayment?.payment_method?.code || (c as any).paymentMethod || null,
          paidAt: c.last_payment_date ? c.last_payment_date.split('T')[0] : (lastPayment?.payment_date ? lastPayment.payment_date.split('T')[0] : null),
          notes: lastPayment?.notes || null,
          transactionReference: lastPayment?.transaction_reference || null,
          chequeNumber: lastPayment?.cheque_number || null,
          bankName: lastPayment?.bank_name || null,
          chequeDate: lastPayment?.cheque_date ? lastPayment.cheque_date.split('T')[0] : null,
          proofUrl: lastPayment?.proof_url || null,
          payments: c.payments || [],
          rawCollection: c,
        };
      });
    }
    return [];
  }, [currentTower, selectedTowerIndex, matrixData, collections]);

  const displayedFlats = useMemo(() => {
    if (!searchQuery.trim()) return flatList;
    const q = searchQuery.toLowerCase().trim();
    const cleanQ = q.replace(/[-_\s]/g, '');

    return flatList.filter((f: any) => {
      const rawNum = String(f.flatNumber || '').toLowerCase();
      const displayNum = String(f.displayFlatNumber || f.flatNumber || '').toLowerCase();
      const resident = String(f.residentName || '').toLowerCase();

      const cleanRawNum = rawNum.replace(/[-_\s]/g, '');
      const cleanDisplayNum = displayNum.replace(/[-_\s]/g, '');

      return (
        displayNum.includes(q) ||
        rawNum.includes(q) ||
        resident.includes(q) ||
        (cleanQ.length > 0 && (cleanDisplayNum.includes(cleanQ) || cleanRawNum.includes(cleanQ)))
      );
    });
  }, [flatList, searchQuery]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-3 px-1 sm:px-0">
      {/* 1. Minimal Header (if standalone) */}
      {isStandalone && (
        <div className="flex items-center justify-between gap-2 py-1">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => navigate(AppRoutes.DASHBOARD)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors shrink-0"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {event?.name || 'Flat Collections'}
              </h1>
              <p className="text-[10px] text-slate-400 font-normal truncate">
                {event?.society?.name || 'Society Event'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isRefreshing || isLoading || isLoadingMatrix}
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 active:scale-95 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Minimal Collection Summary */}
      {(() => {
        const defaultAmt = Number(event?.default_collection_amount || 2500);
        const summary = matrixData?.summary;
        const totalUnits = summary?.totalUnits ?? summary?.totalFlats ?? (flatList.length > 0 ? flatList.length : 120);
        const paidUnits = summary?.paidUnits ?? summary?.paidFlats ?? flatList.filter((f: any) => f.status === 'paid' && !isZeroRequiredStatus(f.interestStatus)).length;
        const pendingUnits = summary?.pendingUnits ?? summary?.pendingFlats ?? flatList.filter((f: any) => Number(f.pendingAmount || 0) > 0 && !isZeroRequiredStatus(f.interestStatus)).length;
        const totalCollected = summary?.totalCollected ?? flatList.reduce((sum: number, f: any) => sum + Number(f.amountPaid || 0), 0);
        const totalTarget = summary?.totalTarget ?? (flatList.length > 0 ? flatList.reduce((sum: number, f: any) => sum + (isZeroRequiredStatus(f.interestStatus) ? 0 : Number(f.amount || defaultAmt)), 0) : totalUnits * defaultAmt);
        const totalPending = Math.max(0, totalTarget - totalCollected);

        return (
          <div className="bg-white px-2.5 py-2 rounded-xl border border-slate-200/70 shadow-2xs">
            <div className="grid grid-cols-3 divide-x divide-slate-100 text-center items-center">
              <div className="px-1 py-0.5">
                <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-tight block whitespace-nowrap">
                  Total Collected
                </span>
                <span className="text-[13px] font-bold text-slate-900 block mt-0.5 whitespace-nowrap">
                  {formatCurrency(totalCollected)}
                </span>
              </div>
              <div className="px-1 py-0.5">
                <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-tight block whitespace-nowrap">
                  Pending Due
                </span>
                <span className="text-[13px] font-bold text-amber-600 block mt-0.5 whitespace-nowrap">
                  {formatCurrency(totalPending)}
                </span>
              </div>
              <div className="px-1 py-0.5">
                <span className="text-[9.5px] font-semibold text-slate-400 uppercase tracking-tight block whitespace-nowrap">
                  Pending Units
                </span>
                <span className="text-[13px] font-bold text-slate-700 block mt-0.5 whitespace-nowrap">
                  {pendingUnits}
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Tower / Wing Selector (if multiple towers exist) */}
      {matrixData?.towers && matrixData.towers.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {matrixData.towers.map((tower: any, tIdx: number) => {
            const isSelected = selectedTowerIndex === tIdx;
            const towerLabel = getTowerDisplayName(tower, tIdx);
            return (
              <button
                key={tower.id || tower.towerName || tower.name || tIdx}
                type="button"
                onClick={() => setSelectedTowerIndex(tIdx)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${isSelected
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50'
                  }`}
              >
                {towerLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Minimal Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search flat number (e.g. A-101) or resident..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-8 pl-8 pr-3 text-xs bg-white border border-slate-200/80 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
        />
      </div>

      {/* 5. Flat Collection List View */}
      {displayedFlats.length > 0 ? (
        <div className="space-y-1.5">
          {displayedFlats.map((flat: any) => {
            const normInterest = normalizeInterestStatus(flat.interestStatus || flat.interest_status);
            const isZeroReq = isZeroRequiredStatus(normInterest);
            const isUncertain = isUncertainStatus(normInterest);
            const isPaid = flat.status === 'paid' && !isZeroReq;
            const expectedAmt = Number(flat.amount ?? 4000);
            const paidAmt = Number(flat.amountPaid ?? (isPaid ? expectedAmt : 0));
            const pendingAmt = Number(flat.pendingAmount ?? (isPaid ? 0 : expectedAmt));

            return (
              <div
                key={flat.id || flat.flatNumber}
                onClick={() => handleSeatMapFlatClick(flat)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  normInterest === 'HOUSE_CLOSED'
                    ? 'bg-zinc-100/80 border-zinc-300/80 hover:bg-zinc-200/70 shadow-none'
                    : normInterest === 'NOT_INTERESTED'
                    ? 'bg-slate-100 border-slate-300/80 hover:bg-slate-200/70 shadow-none'
                    : isUncertain
                    ? 'bg-sky-50/70 border-sky-200 hover:bg-sky-100/70'
                    : isPaid
                    ? 'bg-[#F0FDF4] border-[#DCFCE7] hover:bg-[#E2FBE8]'
                    : 'bg-[#FEFCE8] border-[#FEF08A] hover:bg-[#FEF9C3]'
                }`}
              >
                {/* Left Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      normInterest === 'HOUSE_CLOSED'
                        ? 'bg-zinc-400'
                        : normInterest === 'NOT_INTERESTED'
                        ? 'bg-slate-400'
                        : isUncertain
                        ? 'bg-sky-500'
                        : isPaid
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-1.5">
                      <span className={`font-semibold text-xs sm:text-sm ${isZeroReq ? 'text-slate-700' : 'text-slate-900'}`}>
                        Flat {flat.displayFlatNumber || flat.flatNumber}
                      </span>
                      {flat.isUserFlat && (
                        <span className="text-[9px] font-medium px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200/50">
                          You
                        </span>
                      )}
                      {!isZeroReq && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded border border-purple-200/50">
                          {flat.passes !== undefined && flat.passes !== null ? Number(flat.passes) : 0}{' '}
                          {(flat.passes !== undefined && flat.passes !== null ? Number(flat.passes) : 0) === 1 ? 'Pass' : 'Passes'}
                        </span>
                      )}
                      {normInterest === 'HOUSE_CLOSED' ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded border bg-zinc-200 text-zinc-700 border-zinc-300">
                          House Closed
                        </span>
                      ) : normInterest === 'NOT_INTERESTED' ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded border bg-slate-200 text-slate-700 border-slate-300">
                          Not Interested
                        </span>
                      ) : normInterest === 'SECOND_HOME' ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded border bg-sky-100 text-sky-700 border-sky-300">
                          Second Home
                        </span>
                      ) : normInterest === 'TO_BE_CONFIRMED' ? (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded border bg-amber-50 text-amber-700 border-amber-200/50">
                          To Confirm
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {flat.residentName || (flat.isOccupied ? 'Occupied' : 'Vacant')}
                    </p>
                  </div>
                </div>

                {/* Right Info & Actions */}
                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <div className="text-right">
                    {normInterest === 'HOUSE_CLOSED' ? (
                      <span className="text-[11px] font-medium text-zinc-500 block leading-tight">
                        House Closed
                      </span>
                    ) : normInterest === 'NOT_INTERESTED' ? (
                      <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                        Not Interested
                      </span>
                    ) : normInterest === 'SECOND_HOME' && paidAmt === 0 ? (
                      <span className="text-[11px] font-medium text-sky-600 block leading-tight">
                        May Come
                      </span>
                    ) : (
                      <>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 block leading-tight">
                          ₹{isPaid ? paidAmt.toLocaleString() : (pendingAmt > 0 ? pendingAmt.toLocaleString() : expectedAmt.toLocaleString())}
                        </span>
                        <span
                          className={`text-[10px] font-medium leading-tight block mt-0.5 ${
                            isPaid ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {isPaid ? 'Paid' : 'Due'}
                        </span>
                      </>
                    )}
                  </div>

                  {!isZeroReq && can(Permissions.COLLECTION_UPDATE) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeatMapFlatClick(flat);
                        setIsEditingExpectedFee(false);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                      title="Edit Payment / Unit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!isPaid && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeatMapFlatClick(flat);
                      }}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shadow-xs ${
                        isZeroReq
                          ? 'text-slate-700 bg-zinc-200/90 hover:bg-zinc-300 border border-zinc-300/80'
                          : 'text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                      }`}
                    >
                      Pay
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : isLoadingMatrix || isLoading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading flat collections...</div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400">No flats found for this selection.</div>
      )}

      {/* 1. Mark as Paid / Self-Pay Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => {
          setPayModalOpen(false);
          setSelectedFlatForPayment(null);
          setIsEditingExpectedFee(false);
          setIsPassesDropdownOpen(false);
          setIsInterestDropdownOpen(false);
        }}
        title={
          selectedFlatForPayment
            ? `${Number(selectedFlatForPayment.amountPaid || 0) > 0 ? 'Update Payment' : 'Record Payment'}: Flat ${selectedFlatForPayment.displayFlatNumber || formatFlatDisplayNumber(selectedFlatForPayment.flatNumber, selectedFlatForPayment.blockPrefix || getBlockPrefix(currentTower, selectedTowerIndex))}`
            : `${Number(payingCollection?.amount_paid || 0) > 0 ? 'Update Payment' : 'Record Payment'}: ${payingCollection?.flat ? `Flat ${formatFlatDisplayNumber(payingCollection.flat.flat_number, getBlockPrefix(payingCollection.flat.floor?.block))}` : `Bungalow ${payingCollection?.bungalow?.bungalow_number}`}`
        }
        description="Record contribution receipt via UPI, Cash, or Cheque."
      >
        {(() => {
          const normCurrent = normalizeInterestStatus(interestStatus);
          const isZeroReq = isZeroRequiredStatus(normCurrent);
          const defaultFee = Number(event?.default_collection_amount || 2500);
          const rawExpected = Number(customExpectedFee || selectedFlatForPayment?.amount || payingCollection?.expected_amount || defaultFee);
          const currentExpectedFee = isZeroReq ? 0 : (rawExpected > 0 ? rawExpected : defaultFee);
          const currentPaidFee = isZeroReq ? 0 : Number(selectedFlatForPayment?.amountPaid ?? payingCollection?.amount_paid ?? 0);
          const currentBalanceDue = isZeroReq ? 0 : Math.max(0, currentExpectedFee - currentPaidFee);

          return (
            <form onSubmit={selectedFlatForPayment ? handleSeatMapPaySubmit : handleRecordPayment} className="space-y-3.5">
              {/* Member & Balance Context - Minimalist Clean Summary */}
              <div className="p-3 sm:p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80">
                <div className="grid grid-cols-3 divide-x divide-slate-200/80 text-center">
                  <div className="px-1 flex flex-col items-center justify-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-slate-500 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                        Expected
                      </span>
                      {can(Permissions.COLLECTION_UPDATE) && !isEditingExpectedFee && !isZeroReq && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomExpectedFee(String(currentExpectedFee));
                            setIsEditingExpectedFee(true);
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors inline-flex"
                          title="Change Expected Fee"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="font-bold text-slate-800 text-sm sm:text-base mt-0.5">
                      {formatCurrency(currentExpectedFee)}
                    </span>
                  </div>

                  <div className="px-1 flex flex-col items-center justify-center">
                    <span className="text-slate-500 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                      Paid
                    </span>
                    <span className="font-bold text-emerald-600 text-sm sm:text-base mt-0.5">
                      {formatCurrency(currentPaidFee)}
                    </span>
                  </div>

                  <div className="px-1 flex flex-col items-center justify-center">
                    <span className="text-slate-500 uppercase text-[10px] sm:text-xs font-bold tracking-wider">
                      Balance Due
                    </span>
                    <span
                      className={`font-bold text-sm sm:text-base mt-0.5 ${currentBalanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                    >
                      {formatCurrency(currentBalanceDue)}
                    </span>
                  </div>
                </div>

                {/* Inline Fee Editor when editing */}
                {isEditingExpectedFee && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
                          <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                          Set Expected Fee:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingExpectedFee(false)}
                          className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Amount"
                            value={customExpectedFee}
                            onChange={(e) => setCustomExpectedFee(e.target.value)}
                            className="w-full h-8 pl-6 pr-2 text-sm font-bold bg-white border border-indigo-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800"
                            autoFocus
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          onClick={handleSaveExpectedFee}
                          isLoading={isSavingExpectedFee}
                          className="h-8 px-3 text-xs sm:text-sm shrink-0"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method with Visual Cards & Icons */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
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
                    const isSelected = payMethod === item.code || (item.code === 'UPI' && payMethod === 'QR');
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setPayMethod(item.code);
                          if (item.code === 'UPI' || item.code === 'QR') {
                            setIsQrModalOpen(true);
                          }
                        }}
                        className={`relative flex flex-col items-start p-2.5 sm:p-3 rounded-xl border text-left transition-all ${isSelected
                          ? item.activeClass
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                          }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <div
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center ${isSelected ? item.iconColor : 'bg-slate-100 text-slate-600'
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
                <Input
                  label="Payment Amount (₹)"
                  type="number"
                  requiredIndicator={!isZeroRequiredStatus(interestStatus)}
                  disabled={isZeroRequiredStatus(interestStatus)}
                  placeholder="e.g. 2500"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
                <Input
                  label="Payment Date"
                  type="date"
                  requiredIndicator
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>

              {/* Passes & Interest Status */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* 1. Dynamic Themed Passes Dropdown */}
                <div className="relative" ref={passesDropdownRef}>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                    Passes <span className="text-slate-400 font-normal text-xs">(Allotted)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPassesDropdownOpen(!isPassesDropdownOpen);
                      setIsInterestDropdownOpen(false);
                    }}
                    disabled={isZeroRequiredStatus(interestStatus)}
                    className={`w-full h-9 sm:h-10 px-3 bg-white border rounded-lg flex items-center justify-between transition-all text-xs sm:text-sm font-semibold ${
                      isZeroRequiredStatus(interestStatus)
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : isPassesDropdownOpen
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 text-slate-900 shadow-xs'
                        : 'border-slate-300 hover:border-slate-400 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-purple-50 border border-purple-200/60 flex items-center justify-center shrink-0">
                        <Ticket className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <span className="font-bold text-slate-800 truncate">
                        {isZeroRequiredStatus(interestStatus) ? '0 Passes' : `${passes} ${passes === 1 ? 'Pass' : 'Passes'}`}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                        isPassesDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    />
                  </button>

                  {/* Dynamic Passes Menu */}
                  {isPassesDropdownOpen && (
                    <div className="absolute left-0 right-0 bottom-full mb-1.5 p-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto overscroll-contain">
                      <div className="flex items-center justify-between px-1 mb-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          Select Passes
                        </span>
                        <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200/50">
                          {passes} {passes === 1 ? 'Pass' : 'Passes'}
                        </span>
                      </div>
                      <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const isSelected = passes === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                setPasses(num);
                                setIsPassesDropdownOpen(false);
                              }}
                              className={`h-8 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-purple-600 text-white shadow-xs font-black scale-105 ring-2 ring-purple-300'
                                  : 'bg-slate-50 text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200/60'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-100 text-xs text-slate-400 text-center">
                        Passes allotted upon receipt confirmation
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Dynamic Themed Interest Status Dropdown */}
                <div className="relative" ref={interestDropdownRef}>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">
                    Interest Status
                  </label>
                  {(() => {
                    const normCurrent = normalizeInterestStatus(interestStatus);
                    const currentStatus =
                      CONTRIBUTION_INTEREST_OPTIONS.find((opt) => opt.value === normCurrent) ||
                      CONTRIBUTION_INTEREST_OPTIONS[0];
                    const StatusIcon = currentStatus.icon;

                    return (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsInterestDropdownOpen(!isInterestDropdownOpen);
                            setIsPassesDropdownOpen(false);
                          }}
                          className={`w-full h-9 sm:h-10 px-3 bg-white border rounded-lg flex items-center justify-between transition-all text-xs sm:text-sm font-semibold ${
                            isInterestDropdownOpen
                              ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'border-slate-300 hover:border-slate-400 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`px-2 py-0.5 sm:py-1 rounded-md text-xs font-bold border flex items-center gap-1.5 ${currentStatus.badgeClass}`}>
                              <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{currentStatus.label}</span>
                            </span>
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                              isInterestDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                            }`}
                          />
                        </button>

                        {/* Dynamic Interest Status Menu */}
                        {isInterestDropdownOpen && (
                          <div className="absolute left-0 right-0 bottom-full mb-1.5 p-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 max-h-56 sm:max-h-60 overflow-y-auto overscroll-contain">
                            {CONTRIBUTION_INTEREST_OPTIONS.map((opt) => {
                              const isSelected = normCurrent === opt.value;
                              const OptIcon = opt.icon;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    const prevNorm = normalizeInterestStatus(interestStatus);
                                    setInterestStatus(opt.value);
                                    if (opt.value === 'NOT_INTERESTED' || opt.value === 'HOUSE_CLOSED') {
                                      setPasses(0);
                                      setPayAmount('0');
                                      setCustomExpectedFee('0');
                                    } else if (opt.value === 'SECOND_HOME') {
                                      // participation is uncertain ("May Come / May Not Come") and should not automatically assign passes or payment unless specifically confirmed
                                      setPasses(0);
                                      setPayAmount('0');
                                    } else if (prevNorm === 'NOT_INTERESTED' || prevNorm === 'HOUSE_CLOSED' || prevNorm === 'SECOND_HOME') {
                                      setPasses(1);
                                      const defaultFee = Number(event?.default_collection_amount || 2500);
                                      const origAmount = Number(selectedFlatForPayment?.amount ?? payingCollection?.expected_amount ?? defaultFee);
                                      const effectiveExpected = origAmount > 0 ? origAmount : defaultFee;
                                      setCustomExpectedFee(String(effectiveExpected));
                                      const paidAmt = Number(selectedFlatForPayment?.amountPaid ?? payingCollection?.amount_paid ?? 0);
                                      const pendingAmt = Math.max(0, effectiveExpected - paidAmt);
                                      setPayAmount(String(paidAmt > 0 ? paidAmt : (pendingAmt > 0 ? pendingAmt : effectiveExpected)));
                                    }
                                    setIsInterestDropdownOpen(false);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all border ${
                                    isSelected
                                      ? opt.activeClass
                                      : 'border-transparent hover:bg-slate-50 text-slate-700'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${opt.iconBg}`}>
                                      <OptIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <span className="text-xs sm:text-sm font-bold block leading-tight">{opt.label}</span>
                                      <span className="text-xs text-slate-500 block truncate">{opt.subtitle}</span>
                                    </div>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-indigo-600 shrink-0 ml-1" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* UPI QR Code Quick View Card */}
              {(payMethod === 'UPI' || payMethod === 'QR') && (
                <div className="flex items-center justify-between p-3 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-purple-50/50 to-slate-50 shadow-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-indigo-950 block truncate">Society Payment QR Code</span>
                      <span className="text-xs text-slate-500 block truncate">Scan using any UPI app (GPay, PhonePe, Paytm, BHIM)</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQrModalOpen(true)}
                    className="border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 h-8.5 text-xs sm:text-sm font-semibold px-2.5 shadow-xs shrink-0 ml-2"
                  >
                    <QrCode className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                    View QR Code
                  </Button>
                </div>
              )}

              {/* UPI Live Camera Snapshot / Screenshot Upload Section */}
              {(payMethod === 'UPI' || payMethod === 'QR') && (
                <UpiProofCapture
                  onImageCaptured={(file, preview) => {
                    setProofFile(file);
                    setProofPreviewUrl(preview);
                  }}
                  existingProofUrl={proofPreviewUrl}
                />
              )}

              {payMethod === 'CHEQUE' && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
                  <span className="text-xs sm:text-sm font-bold text-amber-900 block">Cheque Information</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <Input
                      label="Cheque Number"
                      placeholder="e.g. 102938"
                      requiredIndicator
                      value={chequeNumber}
                      onChange={(e) => setChequeNumber(e.target.value)}
                    />
                    <Input
                      label="Bank Name"
                      placeholder="e.g. State Bank of India"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                    />
                    <Input
                      label="Cheque Date"
                      type="date"
                      value={chequeDate}
                      onChange={(e) => setChequeDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {payMethod !== 'CHEQUE' && payMethod !== 'CASH' && (
                <Input
                  label="Transaction / UPI Reference Number"
                  placeholder="e.g. UPI/2026/09/99214"
                  value={transactionReference}
                  onChange={(e) => setTransactionReference(e.target.value)}
                />
              )}

              <Textarea
                label="Remarks / Receipt Notes"
                placeholder="e.g. Received full installment, receipt handed over..."
                rows={2}
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setPayModalOpen(false);
                    setSelectedFlatForPayment(null);
                    setIsPassesDropdownOpen(false);
                    setIsInterestDropdownOpen(false);
                  }}
                  disabled={isProcessingPayment}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isProcessingPayment}>
                  {(() => {
                    const norm = normalizeInterestStatus(interestStatus);
                    if (norm === 'HOUSE_CLOSED') return 'Save as House Closed';
                    if (norm === 'NOT_INTERESTED') return 'Save as Not Interested';
                    if (norm === 'SECOND_HOME' && Number(payAmount) === 0) return 'Save as Second Home';
                    return currentPaidFee > 0 ? 'Update Payment Amount' : 'Record Collection Payment';
                  })()}
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* 1b. Society Dynamic UPI QR Code Modal Popup */}
      {(() => {
        const normCurrent = normalizeInterestStatus(interestStatus);
        const isZeroReq = isZeroRequiredStatus(normCurrent);
        const defaultFee = Number(event?.default_collection_amount || 2500);
        const rawExpected = Number(customExpectedFee || selectedFlatForPayment?.amount || payingCollection?.expected_amount || defaultFee);
        const currentExpectedFee = isZeroReq ? 0 : (rawExpected > 0 ? rawExpected : defaultFee);
        const currentPaidFee = isZeroReq ? 0 : Number(selectedFlatForPayment?.amountPaid ?? payingCollection?.amount_paid ?? 0);
        const currentBalanceDue = isZeroReq ? 0 : Math.max(0, currentExpectedFee - currentPaidFee);
        const upiPayAmount = currentBalanceDue > 0 ? currentBalanceDue : (Number(payAmount) > 0 ? Number(payAmount) : currentExpectedFee);

        return (
          <DynamicUpiQrModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            amount={upiPayAmount}
            unitOrAdvertiserName={
              selectedFlatForPayment
                ? `Flat ${selectedFlatForPayment.displayFlatNumber || formatFlatDisplayNumber(selectedFlatForPayment.flatNumber, selectedFlatForPayment.blockPrefix || getBlockPrefix(currentTower, selectedTowerIndex))}`
                : payingCollection?.flat
                  ? `Flat ${formatFlatDisplayNumber(payingCollection.flat.flat_number, getBlockPrefix(payingCollection.flat.floor?.block))}`
                  : payingCollection?.bungalow
                    ? `Bungalow ${payingCollection.bungalow.bungalow_number}`
                    : 'Event Contribution'
            }
            categoryOrEventName={event?.name || 'Navratri Festival'}
            transactionNote={`${event?.name || 'Event'} Flat Payment`}
            eventId={event?.id || eventId}
            onDone={() => {
              if (currentExpectedFee > 0 && currentPaidFee < currentExpectedFee) {
                setPayAmount(String(currentExpectedFee));
              }
              setIsQrModalOpen(false);
            }}
          />
        );
      })()}

      {/* 2. Adjust Collection Amount Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title="Adjust Unit Collection Amount"
        description="Override expected contribution for this flat without altering event defaults."
      >
        <form onSubmit={handleUpdateAmount} className="space-y-3.5">
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Event Default Fee:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(adjustTarget?.default_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Currently Paid:</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(adjustTarget?.amount_paid)}</span>
            </div>
          </div>

          <Input
            label="Final Expected Fee (₹)"
            type="number"
            placeholder="e.g. 7000"
            requiredIndicator
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            helperText="Overrides the fee specifically for this unit. Remaining balance and payment status will adjust automatically."
          />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAdjustModalOpen(false)}
              disabled={isUpdatingAmount}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdatingAmount}>
              Save Adjusted Amount
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Payment History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Payment Ledger: ${historyTarget?.flat ? `Flat ${formatFlatDisplayNumber(historyTarget.flat.flat_number, getBlockPrefix(historyTarget.flat.floor?.block))}` : `Bungalow ${historyTarget?.bungalow?.bungalow_number}`}`}
        description="Complete chronological receipt audit trail for this residential unit."
      >
        <div className="space-y-3">
          {isLoadingHistory ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading payment receipts...</div>
          ) : paymentHistory.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No payment records found for this unit.</div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {paymentHistory.map((p) => (
                <div key={p.id} className="p-3 bg-white flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(p.amount)}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700">
                        {typeof p.payment_method === 'object' && p.payment_method
                          ? p.payment_method.code || p.payment_method.name
                          : String(p.payment_method || 'CASH')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Date: {formatDate(p.payment_date)}
                      {p.cheque_number && ` • Cheque #${p.cheque_number} (${p.bank_name || 'Bank'})`}
                      {p.transaction_reference && ` • Ref: ${p.transaction_reference}`}
                      {p.collector?.full_name && ` • Collected by: ${p.collector.full_name}`}
                    </p>
                    {p.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">"{p.notes}"</p>}

                    {p.proof_url && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => setEnlargedProofUrl(p.proof_url || null)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-[11px] font-bold transition-colors shadow-2xs"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                          View UPI Receipt Proof
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Recorded
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600">Total Paid:</span>
            <CurrencyDisplay
              amount={paymentHistory.reduce((sum, p) => sum + Number(p.amount || 0), 0)}
              className="text-base font-extrabold text-emerald-700"
            />
          </div>
        </div>
      </Modal>

      {/* 4. Bulk Mark as Paid Modal */}
      <Modal
        isOpen={bulkPayModalOpen}
        onClose={() => setBulkPayModalOpen(false)}
        title={`Bulk Mark as Paid (${selectedCollectionIds.length} Units)`}
        description="Record full balance clearance for all selected flats."
      >
        <form onSubmit={handleBulkPay} className="space-y-3.5">
          <p className="text-xs text-slate-600">
            This will record a full payment for each of the{' '}
            <strong>{selectedCollectionIds.length}</strong> selected flats matching their remaining balance.
          </p>

          <Select
            label="Payment Method"
            requiredIndicator
            value={bulkPayMethod}
            onChange={(e) => setBulkPayMethod(e.target.value as any)}
            error={availablePaymentMethods.length === 0 ? 'No active payment modes available' : undefined}
            disabled={availablePaymentMethods.length === 0}
          >
            {availablePaymentMethods.length > 0 ? (
              availablePaymentMethods.map((m) => (
                <option key={m.id} value={m.code}>
                  {m.name} ({m.code})
                </option>
              ))
            ) : (
              <option value="" disabled>
                No active payment modes configured
              </option>
            )}
          </Select>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkPayModalOpen(false)}
              disabled={isProcessingBulkPay}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isProcessingBulkPay}>
              Confirm Bulk Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* 5. Bulk Update Amount Modal */}
      <Modal
        isOpen={bulkAmountModalOpen}
        onClose={() => setBulkAmountModalOpen(false)}
        title={`Bulk Update Expected Fee (${selectedCollectionIds.length} Units)`}
        description="Set a uniform fee amount across all selected flats."
      >
        <form onSubmit={handleBulkUpdateAmount} className="space-y-3.5">
          <Input
            label="New Collection Amount (₹)"
            type="number"
            requiredIndicator
            value={bulkNewAmount}
            onChange={(e) => setBulkNewAmount(e.target.value)}
          />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkAmountModalOpen(false)}
              disabled={isProcessingBulkAmount}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isProcessingBulkAmount}>
              Apply New Fee
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Sync Society Units Confirmation */}
      <ConfirmDialog
        isOpen={generateConfirmOpen}
        onClose={() => setGenerateConfirmOpen(false)}
        onConfirm={handleGenerateCollections}
        title="Synchronize Society Units"
        message="This will check for any newly added flats or bungalows in this society and automatically generate missing collection records with the default event fee."
        confirmLabel="Sync Units Now"
        variant="primary"
        isLoading={isGenerating}
      />

      {/* 7. Enlarged Proof Image Modal */}
      {enlargedProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold">UPI Receipt / Payment Proof</span>
              </div>
              <button
                type="button"
                onClick={() => setEnlargedProofUrl(null)}
                className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={getFileUrl(enlargedProofUrl)}
                alt="Enlarged Payment Proof"
                className="max-h-[65vh] max-w-full rounded-lg object-contain shadow-lg"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Verified Payment Artifact</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEnlargedProofUrl(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
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

export default EventCollectionsPage;
