import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ContractItemModel,
  ContractDashboardStats,
  SocietyItem,
  EventItem,
  VendorItem,
  PaginationMeta,
} from '../../types';
import { contractsService } from '../../api/contractsService';
import { societiesService } from '../../api/societiesService';
import { eventsService } from '../../api/eventsService';
import { vendorsService } from '../../api/vendorsService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { decodeId } from '../../utils/idObfuscator';

import { ContractFormModal } from '../events/contracts/ContractFormModal';
import { ContractDetailsModal } from '../events/contracts/ContractDetailsModal';
import { RecordContractPaymentModal } from '../events/contracts/RecordContractPaymentModal';
import { PrintableWorkOrder } from '../events/contracts/PrintableWorkOrder';

import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileText,
  Printer,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Store,
  X,
} from 'lucide-react';

export const ContractsListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { selectedSocietyId } = useAuth();
  const { can, isSuperAdmin } = usePermission();

  const urlParams = new URLSearchParams(location.search);
  const initialSocietyId = decodeId(urlParams.get('societyId') || '') || selectedSocietyId || '';
  const initialEventId = decodeId(urlParams.get('eventId') || '') || '';

  // Data States
  const [contracts, setContracts] = useState<ContractItemModel[]>([]);
  const [dashboardStats, setDashboardStats] = useState<ContractDashboardStats | null>(null);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [societyFilter, setSocietyFilter] = useState(initialSocietyId);
  const [eventFilter, setEventFilter] = useState(initialEventId);
  const [vendorFilter, setVendorFilter] = useState('all');
  const [lifecycleFilter, setLifecycleFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractItemModel | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [contractForPayment, setContractForPayment] = useState<ContractItemModel | null>(null);
  const [printContract, setPrintContract] = useState<ContractItemModel | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; contract: ContractItemModel | null }>({
    isOpen: false,
    contract: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync society context selector if user changes it in header
  useEffect(() => {
    if (selectedSocietyId && !isSuperAdmin) {
      setSocietyFilter(selectedSocietyId);
    }
  }, [selectedSocietyId, isSuperAdmin]);

  // Load Societies and Vendors master
  useEffect(() => {
    Promise.all([
      societiesService.getAll({ limit: 100 }),
      vendorsService.getAll({ limit: 100 }),
    ])
      .then(([socRes, venRes]) => {
        if (socRes.success && socRes.data) setSocieties(socRes.data);
        if (venRes.success && venRes.data) {
          const vList = Array.isArray(venRes.data) ? venRes.data : (venRes.data as any).data || [];
          setVendors(vList);
        }
      })
      .catch(() => {});
  }, []);

  // Load Events when societyFilter changes (Cascading Dropdown)
  useEffect(() => {
    if (societyFilter) {
      setIsLoadingEvents(true);
      eventsService
        .getAll({ societyId: societyFilter, limit: 100 })
        .then((res) => {
          if (res.success && res.data) {
            setEvents(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingEvents(false));
    } else {
      // If all societies selected, fetch all active events
      setIsLoadingEvents(true);
      eventsService
        .getAll({ limit: 100 })
        .then((res) => {
          if (res.success && res.data) {
            setEvents(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingEvents(false));
    }
  }, [societyFilter]);

  // Fetch Contracts and Dashboard Statistics
  const fetchContracts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params: any = {
        page: meta.page,
        limit: meta.limit,
        search: searchQuery || undefined,
        society_id: societyFilter || undefined,
        event_id: eventFilter || undefined,
        vendor_id: vendorFilter !== 'all' ? vendorFilter : undefined,
        status: lifecycleFilter !== 'all' ? lifecycleFilter : undefined,
        payment_status: paymentStatusFilter !== 'all' ? paymentStatusFilter : undefined,
        sortBy,
        sortOrder,
      };

      const [contractsRes, dashRes] = await Promise.all([
        contractsService.list(params),
        contractsService.getDashboard({
          society_id: societyFilter || undefined,
          event_id: eventFilter || undefined,
        }).catch(() => null),
      ]);

      if (contractsRes.success && contractsRes.data) {
        setContracts(contractsRes.data);
        if (contractsRes.meta) setMeta(contractsRes.meta);
      } else {
        setError(contractsRes.message || 'Failed to load contracts');
      }

      if (dashRes && dashRes.success && dashRes.data) {
        setDashboardStats(dashRes.data);
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to fetch contracts');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [
    meta.page,
    meta.limit,
    searchQuery,
    societyFilter,
    eventFilter,
    vendorFilter,
    lifecycleFilter,
    paymentStatusFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Handle Contract Deletion
  const handleDeleteContract = async () => {
    if (!deleteConfirm.contract) return;
    try {
      setIsDeleting(true);
      const res = await contractsService.delete(deleteConfirm.contract.id);
      if (res.success) {
        toast.success(`Contract ${deleteConfirm.contract.contract_number} deleted successfully`);
        setDeleteConfirm({ isOpen: false, contract: null });
        fetchContracts();
      } else {
        toast.error(res.message || 'Failed to delete contract');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete contract'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSocietyFilter(isSuperAdmin ? '' : selectedSocietyId || '');
    setEventFilter('');
    setVendorFilter('all');
    setLifecycleFilter('all');
    setPaymentStatusFilter('all');
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  // Table Columns
  const columns: Column<ContractItemModel>[] = [
    {
      key: 'contract_number',
      header: 'Contract / Work Order',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50/80 border border-indigo-200/60 px-1.5 py-0.5 rounded">
              {row.contract_number}
            </span>
            {row.is_multi_day && (
              <span className="text-[9px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60 px-1.5 py-0.5 rounded">
                Multi-Day
              </span>
            )}
            {row.contract_type && (
              <span className="text-[9px] text-slate-500 capitalize bg-slate-100 px-1.5 py-0.5 rounded">
                {row.contract_type.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          <div
            className="font-semibold text-xs text-slate-900 line-clamp-1 hover:text-indigo-600 transition-colors cursor-pointer"
            onClick={() => {
              setSelectedContractId(row.id);
              setDetailsModalOpen(true);
            }}
          >
            {row.title}
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
            <span>{formatDate(row.start_date)} — {formatDate(row.end_date)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'society',
      header: 'Society',
      render: (row) => {
        const socName = row.society?.name || row.event?.society?.name || 'Society';
        const socCode = row.society?.code;
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800">
              <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
              <span className="line-clamp-1">{socName}</span>
            </div>
            {socCode && (
              <span className="text-[10px] text-slate-400 font-mono block">
                Code: {socCode}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'event',
      header: 'Event',
      render: (row) => {
        const evName = row.event?.name || 'Assigned Event';
        const evDate = row.event?.start_date ? formatDate(row.event.start_date) : '';
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Calendar className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="line-clamp-1">{evName}</span>
            </div>
            {evDate && (
              <span className="text-[10px] text-slate-400 block">
                {evDate}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'vendor',
      header: 'Vendor / Service',
      render: (row) => {
        const vName = row.vendor?.vendor_name || row.vendor?.short_name || 'Vendor';
        const vPhone = row.vendor?.mobile_no;
        const categoryName = row.expense_category?.name || row.service_group?.name;
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
              <Store className="w-3 h-3 text-teal-600 shrink-0" />
              <span className="line-clamp-1">{vName}</span>
            </div>
            {categoryName ? (
              <span className="inline-block text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                {categoryName}
              </span>
            ) : vPhone ? (
              <span className="text-[10px] text-slate-400 block">{vPhone}</span>
            ) : null}
          </div>
        );
      },
    },
    {
      key: 'total_amount',
      header: 'Contract Value',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="font-bold text-xs text-slate-900">
            {formatCurrency(row.total_amount)}
          </div>
          {Number(row.advance_amount) > 0 && (
            <div className="text-[10px] text-slate-400">
              Adv: {formatCurrency(row.advance_amount)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'payments',
      header: 'Paid / Balance',
      render: (row) => {
        const paid = Number(row.total_paid || 0);
        const rem = Number(row.remaining_balance || 0);
        return (
          <div className="space-y-0.5">
            <div className="text-xs font-semibold text-emerald-600">
              {formatCurrency(paid)}
            </div>
            <div className={`text-[10px] font-medium ${rem > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
              Due: {formatCurrency(rem)}
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={row.status} size="sm" />
          <span
            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize ${
              row.payment_status === 'fully_paid'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                : row.payment_status === 'partially_paid'
                ? 'bg-amber-50 text-amber-700 border border-amber-200/70'
                : row.payment_status === 'overpaid'
                ? 'bg-purple-50 text-purple-700 border border-purple-200/70'
                : 'bg-slate-100 text-slate-600 border border-slate-200/70'
            }`}
          >
            {row.payment_status?.replace(/_/g, ' ') || 'Unpaid'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="View Details"
            onClick={() => {
              setSelectedContractId(row.id);
              setDetailsModalOpen(true);
            }}
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Print Official Work Order"
            onClick={() => setPrintContract(row)}
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {can(Permissions.PAYMENT_CREATE) && (
            <button
              type="button"
              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Record Payment"
              onClick={() => {
                setContractForPayment(row);
                setPaymentModalOpen(true);
              }}
            >
              <CreditCard className="w-3.5 h-3.5" />
            </button>
          )}

          {can(Permissions.CONTRACT_UPDATE) && (
            <button
              type="button"
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit Contract"
              onClick={() => {
                setEditingContract(row);
                setFormModalOpen(true);
              }}
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}

          {can(Permissions.CONTRACT_DELETE) && (
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Contract"
              onClick={() => setDeleteConfirm({ isOpen: true, contract: row })}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Contracts</h1>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Commercials & Work Orders
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Vendor agreements, commercial terms, deliverables, and payment disbursements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchContracts}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>

          {can(Permissions.CONTRACT_CREATE) && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => {
                setEditingContract(null);
                setFormModalOpen(true);
              }}
            >
              Create Contract
            </Button>
          )}
        </div>
      </div>

      {/* KPI Metrics Dashboard - Minimalist & Compact Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Value */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Value</span>
            <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1 tracking-tight">
            {formatCurrency(dashboardStats?.totalContractedValue || 0)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {dashboardStats?.totalContracts || meta.total || 0} Total Contracts
          </p>
        </div>

        {/* Total Paid */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Total Paid</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1 tracking-tight">
            {formatCurrency(dashboardStats?.totalPaidAmount || 0)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Disbursed to date</p>
        </div>

        {/* Outstanding Liability */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Outstanding</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-amber-600 mt-1 tracking-tight">
            {formatCurrency(dashboardStats?.totalOutstandingBalance || 0)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Payable balance</p>
        </div>

        {/* Active Execution */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Active Execution</span>
            <div className="w-6 h-6 rounded-md bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-purple-700 mt-1 tracking-tight">
            {dashboardStats?.activeContracts || 0}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Approved / Active status</p>
        </div>
      </div>

      {/* Filter and Search Bar - Streamlined & Compact */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {/* Search */}
          <div className="lg:col-span-2">
            <Input
              placeholder="Search contract #, title, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
            />
          </div>

          {/* Society Filter */}
          <div>
            <Select
              value={societyFilter}
              onChange={(e) => {
                setSocietyFilter(e.target.value);
                setEventFilter('');
              }}
              options={[
                { value: '', label: 'All Societies' },
                ...societies.map((s) => ({
                  value: s.id,
                  label: s.name,
                })),
              ]}
            />
          </div>

          {/* Event Filter (Cascading) */}
          <div>
            <Select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              options={[
                {
                  value: '',
                  label: isLoadingEvents
                    ? 'Loading events...'
                    : societyFilter
                    ? 'All Society Events'
                    : 'All Events',
                },
                ...events.map((ev) => ({
                  value: ev.id,
                  label: ev.name,
                })),
              ]}
            />
          </div>

          {/* Vendor Filter */}
          <div>
            <Select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Vendors' },
                ...vendors.map((v) => ({
                  value: v.id,
                  label: v.vendor_name || v.vendorName || 'Vendor',
                })),
              ]}
            />
          </div>

          {/* Lifecycle Status Filter */}
          <div>
            <Select
              value={lifecycleFilter}
              onChange={(e) => setLifecycleFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'pending_approval', label: 'Pending Approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
          </div>
        </div>

        {/* Active Filter Indicators / Quick Reset */}
        {(searchQuery || societyFilter || eventFilter || vendorFilter !== 'all' || lifecycleFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 text-[11px]">Filtered view active</span>
            <button
              onClick={handleResetFilters}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 px-2 py-0.5 hover:bg-indigo-50 rounded transition-colors"
            >
              <X className="w-3 h-3" />
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Contracts Table Listing */}
      <div>
        {isLoading ? (
          <div className="py-12 bg-white rounded-xl border border-slate-200 flex justify-center items-center">
            <Spinner size="md" label="Loading contracts..." />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchContracts} />
        ) : contracts.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200">
            <EmptyState
              icon={<FileText className="w-5 h-5" />}
              title="No Contracts Found"
              description={
                searchQuery || societyFilter || eventFilter || vendorFilter !== 'all' || lifecycleFilter !== 'all'
                  ? 'No vendor contracts match the current search/filters criteria.'
                  : 'No vendor agreements or work orders have been drafted yet.'
              }
              action={
                can(Permissions.CONTRACT_CREATE) ? (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setEditingContract(null);
                      setFormModalOpen(true);
                    }}
                  >
                    Create First Contract
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            <Table
              data={contracts}
              columns={columns}
              className="divide-y divide-slate-200"
            />

            {/* Pagination Controls */}
            {meta.totalPages > 1 && (
              <div className="p-3 border border-slate-200 rounded-xl bg-white">
                <Pagination
                  meta={meta}
                  onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create / Edit Contract Modal */}
      {formModalOpen && (
        <ContractFormModal
          isOpen={formModalOpen}
          onClose={() => setFormModalOpen(false)}
          contract={editingContract}
          societyId={societyFilter || undefined}
          eventId={eventFilter || undefined}
          onSuccess={() => {
            fetchContracts();
          }}
        />
      )}

      {/* Contract Details View Modal */}
      {detailsModalOpen && selectedContractId && (
        <ContractDetailsModal
          contractId={selectedContractId}
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedContractId(null);
          }}
          onEdit={(c) => {
            setDetailsModalOpen(false);
            setEditingContract(c);
            setFormModalOpen(true);
          }}
          onContractUpdated={() => {
            fetchContracts();
          }}
        />
      )}

      {/* Record Payment Modal */}
      {paymentModalOpen && contractForPayment && (
        <RecordContractPaymentModal
          contract={contractForPayment}
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setContractForPayment(null);
          }}
          onSuccess={() => {
            fetchContracts();
          }}
        />
      )}

      {/* Printable Work Order Modal */}
      {printContract && (
        <PrintableWorkOrder
          contract={printContract}
          onClose={() => setPrintContract(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, contract: null })}
        onConfirm={handleDeleteContract}
        title="Delete Contract & Work Order"
        message={`Are you sure you want to permanently delete contract "${deleteConfirm.contract?.contract_number} — ${deleteConfirm.contract?.title}"? All associated line items, schedules, documents, and payments will be removed.`}
        confirmLabel="Delete Contract"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ContractsListPage;
