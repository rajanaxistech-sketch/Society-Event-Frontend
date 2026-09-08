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
} from 'lucide-react';

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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodItem[]>([]);

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

  // Load only active payment methods for the collection modal
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

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

  useEffect(() => {
    fetchCollections();
  }, [eventId, meta.page, meta.limit, statusFilter]);

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
    setPayingCollection(col);
    setPayAmount(String(col.pending_amount || ''));
    setPayMethod((prev) => (availablePaymentMethods.some((m) => m.code === prev) ? prev : availablePaymentMethods[0]?.code || ''));
    setPayDate(new Date().toISOString().split('T')[0]);
    setChequeNumber('');
    setBankName('');
    setChequeDate('');
    setTransactionReference('');
    setPayNotes('');
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
    const pending = Number(payingCollection.pending_amount || 0);

    if (amt <= 0) {
      toast.warning('Payment amount must be greater than 0');
      return;
    }
    if (amt > pending) {
      toast.error(`Payment cannot exceed remaining balance of ${formatCurrency(pending)}`);
      return;
    }

    try {
      setIsProcessingPayment(true);
      const res = await collectionsService.recordPayment(payingCollection.id, {
        amount: amt,
        payment_method: payMethod,
        payment_date: payDate,
        cheque_number: payMethod === 'CHEQUE' ? chequeNumber : null,
        bank_name: payMethod === 'CHEQUE' ? bankName : null,
        cheque_date: payMethod === 'CHEQUE' && chequeDate ? chequeDate : null,
        transaction_reference: transactionReference || null,
        notes: payNotes || null,
      });

      if (res.success) {
        toast.success(`Payment of ${formatCurrency(amt)} recorded successfully.`);
        setPayModalOpen(false);
        fetchCollections();
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

  return (
    <div className="space-y-3.5">
      {/* KPI Summary Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Flats</span>
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 block">
            {dashboardMetrics.totalFlats}
          </span>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Expected Collection</span>
          <CurrencyDisplay
            amount={dashboardMetrics.totalExpected}
            className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1 block"
          />
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Collected</span>
          <CurrencyDisplay
            amount={dashboardMetrics.totalCollected}
            trend="positive"
            className="text-lg sm:text-xl font-extrabold mt-1 block"
          />
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Pending</span>
          <CurrencyDisplay
            amount={dashboardMetrics.totalPending}
            trend={dashboardMetrics.totalPending > 0 ? 'negative' : 'neutral'}
            className="text-lg sm:text-xl font-extrabold mt-1 block"
          />
        </div>

        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Paid Flats</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-extrabold text-emerald-700">{dashboardMetrics.paidCount}</span>
            <span className="text-[10px] text-emerald-600">units</span>
          </div>
        </div>

        <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Pending / Not Paid</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-lg sm:text-xl font-extrabold text-rose-700">
              {dashboardMetrics.notPaidCount + dashboardMetrics.partialCount}
            </span>
            <span className="text-[10px] text-rose-600">({dashboardMetrics.partialCount} partial)</span>
          </div>
        </div>
      </div>

      {/* Main Collections Table Card */}
      <Card
        title="Event Collection Management"
        subtitle="Year-wise contribution obligations, member payment tracking, and ledger records."
        headerAction={
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Export Report
            </Button>
            <PermissionGuard permission={Permissions.COLLECTION_CREATE}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGenerateConfirmOpen(true)}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Sync Society Units
              </Button>
            </PermissionGuard>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCollections}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        }
      >
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
      </Card>

      {/* 1. Mark as Paid Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Record Payment: ${payingCollection?.flat ? `Flat ${payingCollection.flat.flat_number}` : `Bungalow ${payingCollection?.bungalow?.bungalow_number}`}`}
        description="Record contribution receipt via Cash or Cheque."
      >
        <form onSubmit={handleRecordPayment} className="space-y-3.5">
          {/* Member & Balance Context */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Expected Fee</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {formatCurrency(payingCollection?.expected_amount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Already Paid</span>
              <span className="font-extrabold text-emerald-600 text-sm">
                {formatCurrency(payingCollection?.amount_paid)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Balance Due</span>
              <span className="font-extrabold text-rose-600 text-sm">
                {formatCurrency(payingCollection?.pending_amount)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Payment Amount (₹)"
              type="number"
              requiredIndicator
              placeholder={`Max ${payingCollection?.pending_amount}`}
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />

            <Select
              label="Payment Method"
              requiredIndicator
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as any)}
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
          </div>

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
              onClick={() => setPayModalOpen(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isProcessingPayment}>
              Record Collection Payment
            </Button>
          </div>
        </form>
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
                  <div>
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
    </div>
  );
};

export default EventCollectionsPage;
