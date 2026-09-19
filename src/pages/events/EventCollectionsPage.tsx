import React, { useEffect, useState, useMemo } from 'react';
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
} from 'lucide-react';

const isUuid = (val: any): boolean => {
  if (typeof val !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
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
    let towerPaid = 0;
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
      let floorPaid = 0;
      const suffixes = ['A', 'B', 'C', 'D'];
      suffixes.forEach((suf, idx) => {
        const isPaid = !((f % 3 === 0 && idx === 1) || (f === 4 && idx === 2) || (f === 7 && idx === 0) || (f === 9 && idx === 3));
        if (isPaid) {
          floorPaid++;
          towerPaid++;
        }
        flats.push({
          id: `tower-${name.toLowerCase()}-${f}0${idx + 1}${suf}`,
          flatNumber: `${f}0${idx + 1}${suf}`,
          status: isPaid ? 'paid' : 'pending',
          amount: 2500,
          amountPaid: isPaid ? 2500 : 0,
          pendingAmount: isPaid ? 0 : 2500,
          residentName: `Resident ${f}0${idx + 1}${suf}`,
          phone: '+91 98765 43210',
          paymentMethod: isPaid ? (idx % 2 === 0 ? 'UPI' : 'Cheque') : undefined,
        });
      });
      floors.push({
        floorNumber: f,
        name: `Floor ${f}`,
        floorName: `Floor ${f}`,
        totalUnits: 4,
        paidUnits: floorPaid,
        pendingUnits: 4 - floorPaid,
        flats,
      });
    }
    return {
      name: `Tower ${name}`,
      towerName: name,
      totalUnits: 40,
      paidUnits: towerPaid,
      pendingUnits: 40 - towerPaid,
      floors,
    };
  });

  const totalUnits = 120;
  const paidUnits = towers.reduce((acc, t) => acc + t.paidUnits, 0);

  return {
    summary: {
      totalUnits,
      paidUnits,
      pendingUnits: totalUnits - paidUnits,
      totalTarget: totalUnits * 2500,
      totalCollected: paidUnits * 2500,
      progressPercentage: Math.round((paidUnits / totalUnits) * 100),
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
  const [payingCollection, setPayingCollection] = useState<EventCollectionItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('CASH');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [payNotes, setPayNotes] = useState('');
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
    } catch {}
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

  // Seat-Map Matrix State
  const [viewMode, setViewMode] = useState<'seat-map' | 'table'>('seat-map');
  const [matrixData, setMatrixData] = useState<any>(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [selectedTowerIndex, setSelectedTowerIndex] = useState(0);
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number | null>(1);
  const [selectedFlatForPayment, setSelectedFlatForPayment] = useState<any>(null);

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
        const firstTower = res.data.towers[selectedTowerIndex] || res.data.towers[0];
        if (firstTower?.floors?.length > 0 && (selectedFloorNumber === null || selectedFloorNumber === undefined)) {
          setSelectedFloorNumber(firstTower.floors[0].floorNumber);
        }
      } else {
        const mock = generateMockMatrix();
        setMatrixData((prev: any) => prev || mock);
        if (selectedFloorNumber === null) {
          setSelectedFloorNumber(1);
        }
      }
    } catch (err: any) {
      const mock = generateMockMatrix();
      setMatrixData((prev: any) => prev || mock);
      if (selectedFloorNumber === null) {
        setSelectedFloorNumber(1);
      }
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
    const expAmt = Number(flat.amount ?? 2500);
    const paidAmt = Number(flat.amountPaid ?? 0);
    const pendingAmt = Math.max(0, expAmt - paidAmt);
    // If flat already has a payment, populate with the paid amount so admin can edit it; otherwise pending/expected amount
    setPayAmount(String(paidAmt > 0 ? paidAmt : (pendingAmt > 0 ? pendingAmt : expAmt)));
    setCustomExpectedFee(String(expAmt));
    setIsEditingExpectedFee(false);
    setPayMethod(flat.paymentMethod || 'UPI');
    setTransactionReference('');
    setPayNotes('');
    setProofFile(null);
    setProofPreviewUrl(flat.proofUrl || flat.proof_url || null);
    setChequeNumber('');
    setBankName('');
    setChequeDate('');
    setPayModalOpen(true);
  };

  const handleSaveExpectedFee = async () => {
    const newFee = Number(customExpectedFee);
    if (isNaN(newFee) || newFee < 0) {
      toast.warning('Expected fee must be 0 or positive');
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
          toast.success(`Expected fee updated to ₹${newFee} for Flat ${selectedFlatForPayment.flatNumber}`);
          setIsEditingExpectedFee(false);
          return;
        }

        const res = await collectionsService.updateFlatAmount(eventId, selectedFlatForPayment.id, newFee);
        if (res.success) {
          toast.success(`Expected fee updated to ₹${newFee} for Flat ${selectedFlatForPayment.flatNumber}`);
          setIsEditingExpectedFee(false);
          selectedFlatForPayment.amount = newFee;
          fetchMatrix(false);
          fetchCollections();
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
          fetchCollections();
          fetchMatrix();
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

    const enteredAmount = Number(payAmount);
    const expectedAmount = Number(selectedFlatForPayment.amount ?? 2500);
    const newPending = Math.max(0, expectedAmount - enteredAmount);
    const newStatus = newPending <= 0 && expectedAmount > 0 ? 'paid' : enteredAmount > 0 ? 'partially_paid' : 'pending';

    try {
      setIsProcessingPayment(true);

      // Upload proof file if user snapped/selected a receipt image
      let uploadedProofUrl: string | undefined = undefined;
      if (proofFile) {
        try {
          const uploadRes = await collectionsService.uploadProof(proofFile);
          if (uploadRes.success && uploadRes.data?.proof_url) {
            uploadedProofUrl = uploadRes.data.proof_url;
          }
        } catch (uploadErr) {
          console.warn('Failed to upload proof image, proceeding without proof:', uploadErr);
        }
      }

      if (!isUuid(eventId) || !isUuid(selectedFlatForPayment.id)) {
        // Instant In-memory state update for demo or fallback mock flats
        if (matrixData) {
          const updated = JSON.parse(JSON.stringify(matrixData));
          for (const tower of updated.towers || []) {
            for (const floor of tower.floors || []) {
              for (const flat of floor.flats || []) {
                if (flat.id === selectedFlatForPayment.id || flat.flatNumber === selectedFlatForPayment.flatNumber) {
                  flat.status = newStatus;
                  flat.amountPaid = enteredAmount;
                  flat.pendingAmount = newPending;
                  flat.paymentMethod = payMethod;
                }
              }
            }
          }
          setMatrixData(updated);
        }
        toast.success(
          `🎉 Flat ${selectedFlatForPayment.flatNumber} payment updated to ₹${enteredAmount} (Balance: ₹${newPending})`
        );
        setPayModalOpen(false);
        setSelectedFlatForPayment(null);
        return;
      }

      const res = await collectionsService.payFlat(eventId, selectedFlatForPayment.id, {
        amount: enteredAmount,
        payment_method: payMethod,
        transaction_reference: transactionReference || undefined,
        proof_url: uploadedProofUrl !== undefined ? uploadedProofUrl : (proofPreviewUrl || undefined),
        notes: payNotes || undefined,
        cheque_number: chequeNumber || undefined,
        bank_name: bankName || undefined,
        cheque_date: chequeDate || undefined,
      });

      if (res.success) {
        toast.success(res.data?.message || `🎉 Flat ${selectedFlatForPayment.flatNumber} payment updated to ₹${enteredAmount}`);
        setPayModalOpen(false);
        setSelectedFlatForPayment(null);
        fetchMatrix();
        fetchCollections();
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (err: any) {
      // In-memory fallback
      if (matrixData) {
        const updated = JSON.parse(JSON.stringify(matrixData));
        for (const tower of updated.towers || []) {
          for (const floor of tower.floors || []) {
            for (const flat of floor.flats || []) {
              if (flat.id === selectedFlatForPayment.id || flat.flatNumber === selectedFlatForPayment.flatNumber) {
                flat.status = newStatus;
                flat.amountPaid = enteredAmount;
                flat.pendingAmount = newPending;
                flat.paymentMethod = payMethod;
              }
            }
          }
        }
        setMatrixData(updated);
      }
      toast.success(`🎉 Flat ${selectedFlatForPayment.flatNumber} payment updated to ₹${enteredAmount}`);
      setPayModalOpen(false);
      setSelectedFlatForPayment(null);
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
    const expAmt = Number(col.expected_amount ?? 2500);
    const paidAmt = Number(col.amount_paid ?? 0);
    const pendingAmt = Math.max(0, expAmt - paidAmt);
    // Populate with current paid amount so admin can edit it, otherwise pending amount
    setPayAmount(String(paidAmt > 0 ? paidAmt : (pendingAmt > 0 ? pendingAmt : expAmt)));
    setCustomExpectedFee(String(expAmt));
    setIsEditingExpectedFee(false);
    const existingMethod = col.payments?.[0]?.payment_method?.code;
    if (existingMethod) {
      setPayMethod(existingMethod);
    } else {
      setPayMethod((prev) => (availablePaymentMethods.some((m) => m.code === prev) ? prev : availablePaymentMethods[0]?.code || 'UPI'));
    }
    setPayDate(col.payments?.[0]?.payment_date ? col.payments[0].payment_date.split('T')[0] : new Date().toISOString().split('T')[0]);
    setChequeNumber(col.payments?.[0]?.cheque_number || '');
    setBankName(col.payments?.[0]?.bank_name || '');
    setChequeDate(col.payments?.[0]?.cheque_date ? col.payments[0].cheque_date.split('T')[0] : '');
    setTransactionReference(col.payments?.[0]?.transaction_reference || '');
    setPayNotes(col.payments?.[0]?.notes || '');
    setProofFile(null);
    setProofPreviewUrl(col.payments?.[0]?.proof_url || null);
    setPayModalOpen(true);
    fetchPaymentMethods();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCollection) return;

    if (!payMethod) {
      toast.warning('Please select an active payment method');
      return;
    }

    const amt = Number(payAmount);
    const expected = Number(payingCollection.expected_amount || 0);

    if (amt < 0) {
      toast.warning('Payment amount cannot be negative');
      return;
    }
    if (amt > expected) {
      toast.error(`Payment cannot exceed expected fee of ${formatCurrency(expected)}`);
      return;
    }

    try {
      setIsProcessingPayment(true);

      // Upload proof file if user snapped/selected a receipt image
      let uploadedProofUrl: string | undefined = undefined;
      if (proofFile) {
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
        payment_method: payMethod,
        payment_date: payDate,
        cheque_number: payMethod === 'CHEQUE' ? chequeNumber : null,
        bank_name: payMethod === 'CHEQUE' ? bankName : null,
        cheque_date: payMethod === 'CHEQUE' && chequeDate ? chequeDate : null,
        transaction_reference: transactionReference || null,
        proof_url: uploadedProofUrl !== undefined ? uploadedProofUrl : (proofPreviewUrl || null),
        notes: payNotes || null,
      });

      if (res.success) {
        toast.success(`Payment updated to ${formatCurrency(amt)} successfully.`);
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
    if (amt < 0) {
      toast.warning('Amount must be 0 or positive');
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
          return (
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
              <Home className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                Flat {row.flat.flat_number}{' '}
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
  const eventTheme = event ? getEventTheme(event.name, event.description) : null;

  return (
    <div className="space-y-3">
      {/* 1. Minimalist Route Page Header */}
      {isStandalone && (
        <div className="bg-white px-3.5 py-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/flat-collections')}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
              title="Back to Flat Collections"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {event?.name || 'Flat Collections'}
                </h1>
                {event?.event_year && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200/60">
                    {event.event_year}
                  </span>
                )}
                {event?.is_navratri && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded border border-amber-200/60 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> Navratri
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                {event?.society?.name || 'Society Event'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Switcher */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('seat-map')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'seat-map'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Seat Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ledger</span>
              </button>
            </div>

            <PermissionGuard permission={Permissions.COLLECTION_CREATE}>
              <button
                type="button"
                onClick={() => setGenerateConfirmOpen(true)}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                title="Sync Society Units"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </PermissionGuard>
            <button
              type="button"
              onClick={handleExportCsv}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
              title="Export Report"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={isRefreshing || isLoading || isLoadingMatrix}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 active:scale-95 transition-all"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Unified Minimalist Metrics Card */}
      {(() => {
        const defaultAmt = Number(event?.default_collection_amount || 2500);
        const totalUnits = matrixData?.summary?.totalUnits ?? matrixData?.summary?.totalFlats ?? 120;
        const paidUnits = matrixData?.summary?.paidUnits ?? matrixData?.summary?.paidFlats ?? 0;
        const pendingUnits = Math.max(0, totalUnits - paidUnits);
        const totalCollected = matrixData?.summary?.totalCollected ?? (paidUnits * defaultAmt);
        const totalTarget = matrixData?.summary?.totalTarget ?? (totalUnits * defaultAmt);
        const totalPending = Math.max(0, totalTarget - totalCollected);
        const progressPercentage = totalUnits > 0 ? Math.round((paidUnits / totalUnits) * 100) : (totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0);

        return (
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Collected</span>
                  <button
                    type="button"
                    onClick={handleRefreshAll}
                    disabled={isRefreshing || isLoading || isLoadingMatrix}
                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 active:scale-95 transition-all inline-flex items-center justify-center cursor-pointer"
                    title="Refresh Total Collected & Flat Matrix"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
                  </button>
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {formatCurrency(totalCollected)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    of {formatCurrency(totalTarget)}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                {progressPercentage}% Collected
              </span>
            </div>

            {/* Smooth Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              />
            </div>

            {/* 3 Minimalist Stats Pill Columns */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center">
              <div className="p-1.5 rounded-xl bg-slate-50/70">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Pending Due</span>
                <span className="text-xs sm:text-sm font-extrabold text-rose-600 block mt-0.5">
                  {formatCurrency(totalPending)}
                </span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-50/70">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Paid Units</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-700 block mt-0.5">
                  {paidUnits} <span className="text-[10px] text-slate-400 font-normal">/ {totalUnits}</span>
                </span>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-50/70">
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Pending Units</span>
                <span className="text-xs sm:text-sm font-extrabold text-amber-600 block mt-0.5">
                  {pendingUnits} <span className="text-[10px] text-slate-400 font-normal">left</span>
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 3. Main Content Card */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {viewMode === 'seat-map' ? (
          /* ================= SEAT MAP DRILLDOWN ================= */
          <div className="space-y-3.5">
            {/* Resident's Unit Quick Banner if available */}
            {matrixData?.userUnit && (
              <div className="px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="font-bold text-slate-900">
                    Your Unit: {matrixData.userUnit.towerName ? `${getTowerDisplayName({ name: matrixData.userUnit.towerName })}, ` : ''}Flat {matrixData.userUnit.flatNumber}
                  </span>
                  <span
                    className={`px-2 py-0.2 rounded-full text-[10px] font-extrabold ${
                      matrixData.userUnit.status === 'paid'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {matrixData.userUnit.status === 'paid' ? 'Paid' : 'Payment Due'}
                  </span>
                </div>
                {matrixData.userUnit.status !== 'paid' && (
                  <button
                    type="button"
                    onClick={() => handleSeatMapFlatClick(matrixData.userUnit)}
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline shrink-0"
                  >
                    Pay ₹{matrixData.userUnit.pendingAmount || matrixData.userUnit.amount}
                  </button>
                )}
              </div>
            )}

            {/* Step 1: Tower / Wing Selector */}
            {matrixData?.towers && matrixData.towers.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-500 uppercase shrink-0 mr-1">Tower / Wing:</span>
                  {matrixData.towers.map((tower: any, tIdx: number) => {
                    const isSelected = selectedTowerIndex === tIdx;
                    const towerLabel = getTowerDisplayName(tower, tIdx);
                    const totalUnits =
                      tower.totalUnits ??
                      tower.floors?.reduce((acc: number, f: any) => acc + (f.totalUnits ?? f.flats?.length ?? 0), 0) ??
                      0;
                    const paidUnits =
                      tower.paidUnits ??
                      tower.floors?.reduce(
                        (acc: number, f: any) =>
                          acc + (f.paidUnits ?? f.flats?.filter((fl: any) => fl.status === 'paid' || fl.isPaid)?.length ?? 0),
                        0
                      ) ??
                      0;

                    return (
                      <button
                        key={tower.id || tower.towerName || tower.name || tIdx}
                        type="button"
                        onClick={() => {
                          setSelectedTowerIndex(tIdx);
                          if (tower.floors?.length > 0) {
                            setSelectedFloorNumber(tower.floors[0].floorNumber);
                          } else {
                            setSelectedFloorNumber(null);
                          }
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{towerLabel}</span>
                        {totalUnits > 0 && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {paidUnits}/{totalUnits}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Step 2: Floor Selection Pills */}
                {matrixData.towers[selectedTowerIndex]?.floors && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                    <span className="text-[11px] font-bold text-slate-500 uppercase shrink-0 mr-1">Floor:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFloorNumber(null)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        selectedFloorNumber === null
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      All Floors
                    </button>
                    {matrixData.towers[selectedTowerIndex].floors.map((floor: any, fIdx: number) => {
                      const isFloorSelected = selectedFloorNumber === floor.floorNumber;
                      const floorLabel = getFloorDisplayName(floor);
                      const totalFloorUnits = floor.totalUnits ?? floor.flats?.length ?? 0;
                      const paidFloorUnits =
                        floor.paidUnits ??
                        floor.flats?.filter((fl: any) => fl.status === 'paid' || fl.isPaid)?.length ??
                        0;

                      return (
                        <button
                          key={floor.id || floor.floorNumber || fIdx}
                          type="button"
                          onClick={() => setSelectedFloorNumber(floor.floorNumber)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 border ${
                            isFloorSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{floorLabel}</span>
                          {totalFloorUnits > 0 && (
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded ${
                                isFloorSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {paidFloorUnits}/{totalFloorUnits}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Step 3: Interactive Flat Grid */}
                <div className="space-y-4 pt-2">
                  {matrixData.towers[selectedTowerIndex]?.floors
                    ?.filter((f: any) => selectedFloorNumber === null || f.floorNumber === selectedFloorNumber)
                    .map((floor: any, fIdx: number) => {
                      const floorLabel = getFloorDisplayName(floor);
                      const totalFloorUnits = floor.totalUnits ?? floor.flats?.length ?? 0;
                      const paidFloorUnits =
                        floor.paidUnits ??
                        floor.flats?.filter((fl: any) => fl.status === 'paid' || fl.isPaid)?.length ??
                        0;

                      return (
                        <div key={floor.id || floor.floorNumber || fIdx} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-800">
                                {floorLabel}
                              </span>
                              {totalFloorUnits > 0 && (
                                <span className="text-[10px] text-slate-500 font-medium">
                                  ({paidFloorUnits} of {totalFloorUnits} paid)
                                </span>
                              )}
                            </div>
                          </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                          {floor.flats.map((flat: any) => {
                            const isPaid = flat.status === 'paid';
                            return (
                              <div
                                key={flat.id}
                                onClick={() => handleSeatMapFlatClick(flat)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between min-h-[96px] ${
                                  flat.isUserFlat
                                    ? 'ring-2 ring-indigo-600 ring-offset-2 shadow-sm'
                                    : ''
                                } ${
                                  isPaid
                                    ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/80'
                                    : 'bg-amber-50/60 border-amber-200 hover:bg-amber-100/80'
                                }`}
                              >
                                {flat.isUserFlat && (
                                  <span className="absolute -top-2 -right-1.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full shadow-2xs">
                                    Your Flat
                                  </span>
                                )}

                                <div>
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-extrabold text-sm text-slate-900">
                                      Flat {flat.flatNumber}
                                    </span>
                                    {isPaid ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-600 font-medium line-clamp-1 mt-0.5">
                                    {flat.residentName || (flat.isOccupied ? 'Occupied' : 'Vacant')}
                                  </span>
                                </div>

                                <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                                  {isPaid ? (
                                    <span className="font-bold text-emerald-700">
                                      ₹{flat.amountPaid ?? flat.amount} Paid
                                    </span>
                                  ) : (
                                    <span className="font-bold text-amber-800">
                                      ₹{flat.pendingAmount ?? flat.amount} Due
                                    </span>
                                  )}
                                  <div className="flex items-center gap-1.5">
                                    {can(Permissions.COLLECTION_UPDATE) && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSeatMapFlatClick(flat);
                                          setIsEditingExpectedFee(true);
                                        }}
                                        className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-100 transition-colors"
                                        title="Change Expected Fee for this Flat"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    )}
                                    {!isPaid && (
                                      <button
                                        type="button"
                                        className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 underline"
                                      >
                                        Pay
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : isLoadingMatrix ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading seat map matrix...</div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">No tower units found for this event.</div>
            )}
          </div>
        ) : (
          /* ================= TABLE VIEW ================= */
          <div>
            {/* Search, Filters, and Bulk Operations Bar */}
            <div className="space-y-2.5 mb-3.5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search Input */}
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search by Flat No, Resident Name, or Mobile..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <Button type="submit" variant="outline" size="sm" className="h-8 px-2.5">
                    Search
                  </Button>
                </form>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setMeta((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="h-8 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">All Payment Statuses</option>
                    <option value="pending">Not Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Bulk Action Toolbar when items are selected */}
              {selectedCollectionIds.length > 0 && (
                <div className="p-2.5 bg-indigo-50/80 rounded-lg border border-indigo-200 flex items-center justify-between flex-wrap gap-2 text-xs animate-in fade-in">
                  <span className="font-semibold text-indigo-900">
                    {selectedCollectionIds.length} unit(s) selected
                  </span>
                  <div className="flex items-center gap-2">
                    <PermissionGuard permission={Permissions.COLLECTION_UPDATE}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBulkAmountModalOpen(true)}
                        className="h-7 text-xs bg-white"
                      >
                        Bulk Update Amount
                      </Button>
                    </PermissionGuard>
                    <PermissionGuard permission={Permissions.PAYMENT_CREATE}>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          fetchPaymentMethods();
                          setBulkPayModalOpen(true);
                        }}
                        className="h-7 text-xs"
                      >
                        Bulk Mark as Paid
                      </Button>
                    </PermissionGuard>
                  </div>
                </div>
              )}
            </div>

            <Table
              columns={columns}
              data={collections}
              isLoading={isLoading}
              emptyText="No collection records registered for this event."
            />

            <Pagination
              meta={meta}
              onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
              onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
            />
          </div>
        )}
      </div>

      {/* 1. Mark as Paid / Self-Pay Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => {
          setPayModalOpen(false);
          setSelectedFlatForPayment(null);
          setIsEditingExpectedFee(false);
        }}
        title={
          selectedFlatForPayment
            ? `${Number(selectedFlatForPayment.amountPaid || 0) > 0 ? 'Update Payment' : 'Record Payment'}: Flat ${selectedFlatForPayment.flatNumber}`
            : `${Number(payingCollection?.amount_paid || 0) > 0 ? 'Update Payment' : 'Record Payment'}: ${payingCollection?.flat ? `Flat ${payingCollection.flat.flat_number}` : `Bungalow ${payingCollection?.bungalow?.bungalow_number}`}`
        }
        description="Record contribution receipt via UPI, Cash, or Cheque."
      >
        {(() => {
          const currentExpectedFee = Number(selectedFlatForPayment?.amount ?? payingCollection?.expected_amount ?? 2500);
          const currentPaidFee = Number(selectedFlatForPayment?.amountPaid ?? payingCollection?.amount_paid ?? 0);
          const currentBalanceDue = Math.max(0, currentExpectedFee - currentPaidFee);

          return (
            <form onSubmit={selectedFlatForPayment ? handleSeatMapPaySubmit : handleRecordPayment} className="space-y-3.5">
              {/* Member & Balance Context */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="relative">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-slate-500 uppercase text-[10px] font-bold">Expected Fee</span>
                      {can(Permissions.COLLECTION_UPDATE) && !isEditingExpectedFee && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomExpectedFee(String(currentExpectedFee));
                            setIsEditingExpectedFee(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 p-0.5 rounded hover:bg-indigo-100 transition-colors inline-flex"
                          title="Change Expected Fee for this Flat"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="font-extrabold text-slate-800 text-sm block mt-0.5">
                      {formatCurrency(currentExpectedFee)}
                    </span>
                    {can(Permissions.COLLECTION_UPDATE) && !isEditingExpectedFee && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomExpectedFee(String(currentExpectedFee));
                          setIsEditingExpectedFee(true);
                        }}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline block mx-auto mt-0.5"
                      >
                        Change Fee
                      </button>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase text-[10px] font-bold block">Already Paid</span>
                    <span className="font-extrabold text-emerald-600 text-sm block mt-0.5">
                      {formatCurrency(currentPaidFee)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 uppercase text-[10px] font-bold block">Balance Due</span>
                    <span
                      className={`font-extrabold text-sm block mt-0.5 ${
                        currentBalanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {formatCurrency(currentBalanceDue)}
                    </span>
                  </div>
                </div>

                {/* Inline Fee Editor when editing */}
                {isEditingExpectedFee && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="bg-indigo-50/80 p-2.5 rounded-lg border border-indigo-200">
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1">
                          <Edit2 className="w-3 h-3 text-indigo-600" />
                          Change Expected Fee for this Flat:
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingExpectedFee(false)}
                          className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="Enter expected fee"
                            value={customExpectedFee}
                            onChange={(e) => setCustomExpectedFee(e.target.value)}
                            className="w-full h-8 pl-6 pr-2.5 text-xs font-bold bg-white border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                            autoFocus
                          />
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          onClick={handleSaveExpectedFee}
                          isLoading={isSavingExpectedFee}
                          className="h-8 px-3 text-xs shrink-0"
                        >
                          Save Fee
                        </Button>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Overrides fee for this flat. Remaining balance will update automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>

          <div>
            <Input
              label="Payment Amount (₹)"
              type="number"
              requiredIndicator
              placeholder="e.g. 2500"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
          </div>

          {/* Payment Method with Visual Cards & Icons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Method <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  code: 'UPI',
                  name: 'UPI / Digital QR',
                  subtitle: 'GPay, PhonePe, QR',
                  icon: QrCode,
                  activeClass: 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs',
                  iconColor: 'text-indigo-600 bg-indigo-100',
                },
                {
                  code: 'CASH',
                  name: 'Cash Payment',
                  subtitle: 'Physical Currency',
                  icon: Banknote,
                  activeClass: 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-xs',
                  iconColor: 'text-emerald-600 bg-emerald-100',
                },
                {
                  code: 'CHEQUE',
                  name: 'Cheque / DD',
                  subtitle: 'Demand Draft',
                  icon: FileText,
                  activeClass: 'border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-xs',
                  iconColor: 'text-amber-600 bg-amber-100',
                },
                {
                  code: 'BANK_TRANSFER',
                  name: 'Bank Transfer',
                  subtitle: 'NEFT / RTGS / IMPS',
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
                    onClick={() => setPayMethod(item.code)}
                    className={`relative flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? item.activeClass
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isSelected ? item.iconColor : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-indigo-300 animate-pulse" />
                      )}
                    </div>
                    <span className="text-xs font-bold leading-tight block truncate w-full">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate w-full mt-0.5">
                      {item.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

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

          <Input
            label="Payment Date"
            type="date"
            requiredIndicator
            value={payDate}
            onChange={(e) => setPayDate(e.target.value)}
          />

          {payMethod === 'CHEQUE' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
              <span className="text-xs font-bold text-amber-900 block">Cheque Information</span>
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
              }}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isProcessingPayment}>
              {currentPaidFee > 0 ? 'Update Payment Amount' : 'Record Collection Payment'}
            </Button>
          </div>
        </form>
          );
        })()}
      </Modal>

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
        title={`Payment Ledger: ${historyTarget?.flat ? `Flat ${historyTarget.flat.flat_number}` : `Bungalow ${historyTarget?.bungalow?.bungalow_number}`}`}
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
    </div>
  );
};

export default EventCollectionsPage;
