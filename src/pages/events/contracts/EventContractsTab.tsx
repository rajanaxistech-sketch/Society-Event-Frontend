import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ContractItemModel,
  ContractDashboardStats,
  EventDayItem,
  VendorItem,
  EventServiceGroupItem,
} from '../../../types';
import { contractsService } from '../../../api/contractsService';
import { vendorsService } from '../../../api/vendorsService';
import { serviceGroupsService } from '../../../api/serviceGroupsService';
import { useToast } from '../../../hooks/useToast';
import { usePermission } from '../../../hooks/usePermission';
import { Permissions } from '../../../constants/permissions';
import Card from '../../../components/ui/Card';
import Table, { Column } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import StatusBadge from '../../../components/common/StatusBadge';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { extractErrorMessage } from '../../../utils/errorExtractor';

import { ContractFormModal } from './ContractFormModal';
import { ContractDetailsModal } from './ContractDetailsModal';
import { RecordContractPaymentModal } from './RecordContractPaymentModal';
import { PrintableWorkOrder } from './PrintableWorkOrder';

import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  History,
  FileText,
  Printer,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  Search,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface EventContractsTabProps {
  eventId: string;
  eventDays?: EventDayItem[];
  eventStartDate?: string;
  eventEndDate?: string;
  isMultiDay?: boolean;
}

export const EventContractsTab: React.FC<EventContractsTabProps> = ({
  eventId,
  eventDays = [],
  eventStartDate,
  eventEndDate,
  isMultiDay = false,
}) => {
  const toast = useToast();
  const { can } = usePermission();

  // Primary Data
  const [contracts, setContracts] = useState<ContractItemModel[]>([]);
  const [dashboardStats, setDashboardStats] = useState<ContractDashboardStats | null>(null);
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [serviceGroups, setServiceGroups] = useState<EventServiceGroupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [serviceGroupFilter, setServiceGroupFilter] = useState('all');

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractItemModel | null>(null);

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsInitialTab, setDetailsInitialTab] = useState<string>('overview');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [contractForPayment, setContractForPayment] = useState<ContractItemModel | null>(null);

  const [printContract, setPrintContract] = useState<ContractItemModel | null>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; contract: ContractItemModel | null }>({
    isOpen: false,
    contract: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all data
  const fetchData = useCallback(async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const [contractsRes, dashRes, vendorsRes, groupsRes] = await Promise.all([
        contractsService.list({ event_id: eventId, limit: 100 }),
        contractsService.getEventDashboard(eventId).catch(() => null),
        vendorsService.getAll({ limit: 100 }).catch(() => null),
        serviceGroupsService.getAll({ limit: 100 }).catch(() => null),
      ]);

      if (contractsRes.success && contractsRes.data) {
        const list = Array.isArray(contractsRes.data)
          ? contractsRes.data
          : (contractsRes.data as any).data || [];
        setContracts(list);
      }

      if (dashRes && dashRes.success && dashRes.data) {
        setDashboardStats(dashRes.data);
      }

      if (vendorsRes && vendorsRes.success && vendorsRes.data) {
        const vList = Array.isArray(vendorsRes.data)
          ? vendorsRes.data
          : (vendorsRes.data as any).data || [];
        setVendors(vList);
      }

      if (groupsRes && groupsRes.success && groupsRes.data) {
        const gList = Array.isArray(groupsRes.data)
          ? groupsRes.data
          : (groupsRes.data as any).data || [];
        setServiceGroups(gList);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load event contracts'));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Delete Contract
  const handleDelete = async () => {
    if (!deleteConfirm.contract) return;
    try {
      setIsDeleting(true);
      const res = await contractsService.delete(deleteConfirm.contract.id);
      if (res.success) {
        toast.success(`Contract ${deleteConfirm.contract.contract_number} deleted successfully`);
        setDeleteConfirm({ isOpen: false, contract: null });
        fetchData();
      } else {
        toast.error(res.message || 'Failed to delete contract');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete contract'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (paymentStatusFilter !== 'all' && c.payment_status !== paymentStatusFilter) return false;
      if (vendorFilter !== 'all' && c.vendor_id !== vendorFilter) return false;
      if (serviceGroupFilter !== 'all' && c.service_group_id !== serviceGroupFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesNumber = c.contract_number?.toLowerCase().includes(q);
        const matchesVendor = c.vendor?.vendor_name.toLowerCase().includes(q);
        if (!matchesTitle && !matchesNumber && !matchesVendor) return false;
      }

      return true;
    });
  }, [contracts, statusFilter, paymentStatusFilter, vendorFilter, serviceGroupFilter, searchQuery]);

  // Local metric fallbacks if dashboard response is pending
  const metrics = useMemo(() => {
    if (dashboardStats) {
      return dashboardStats;
    }
    const totalVal = contracts.reduce((sum, c) => sum + (Number(c.total_amount) || 0), 0);
    const paidVal = contracts.reduce((sum, c) => sum + (Number(c.total_paid) || 0), 0);
    const outVal = contracts.reduce((sum, c) => sum + (Number(c.remaining_balance) || 0), 0);
    const activeC = contracts.filter((c) => ['active', 'approved'].includes(c.status)).length;
    return {
      totalContracts: contracts.length,
      activeContracts: activeC,
      totalContractedValue: totalVal,
      totalPaidAmount: paidVal,
      totalOutstandingBalance: outVal,
      byVendor: [],
      byServiceGroup: [],
    };
  }, [dashboardStats, contracts]);

  const columns: Column<ContractItemModel>[] = [
    {
      key: 'title',
      header: 'Contract & Work Order',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
              {row.contract_number}
            </span>
            {row.is_multi_day && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Multi-Day
              </span>
            )}
          </div>
          <p className="font-semibold text-slate-900 text-xs mt-0.5">{row.title}</p>
          <p className="text-[11px] text-slate-500">
            {formatDate(row.start_date)} - {formatDate(row.end_date)}
          </p>
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor / Service',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-slate-900">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{row.vendor?.vendor_name || 'N/A'}</span>
          </div>
          {row.service_group && (
            <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded block w-fit">
              {row.service_group.name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'total_amount',
      header: 'Total Value',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-bold text-slate-900">{formatCurrency(row.total_amount)}</span>
          {Number(row.advance_amount) > 0 && (
            <p className="text-[10px] text-slate-500">Adv: {formatCurrency(row.advance_amount)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'paid_balance',
      header: 'Paid & Balance',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <span className="font-semibold text-emerald-600 block">{formatCurrency(row.total_paid)}</span>
          <span
            className={`text-[11px] font-bold ${
              Number(row.remaining_balance) > 0 ? 'text-amber-700' : 'text-slate-400'
            }`}
          >
            Due: {formatCurrency(row.remaining_balance)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} size="sm" />
          <div>
            <StatusBadge status={row.payment_status} size="sm" />
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          {/* View Details */}
          <Button
            size="sm"
            variant="ghost"
            className="p-1.5 text-indigo-600 hover:bg-indigo-50"
            title="View Details, Scope, Documents & Ledger"
            onClick={() => {
              setSelectedContractId(row.id);
              setDetailsInitialTab('overview');
              setDetailsModalOpen(true);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {/* Payment History */}
          <Button
            size="sm"
            variant="ghost"
            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
            title="Payment History & Ledger"
            onClick={() => {
              setSelectedContractId(row.id);
              setDetailsInitialTab('payments');
              setDetailsModalOpen(true);
            }}
          >
            <History className="w-4 h-4" />
          </Button>

          {/* Record Payment */}
          {['approved', 'active', 'completed'].includes(row.status) && (
            <Button
              size="sm"
              variant="ghost"
              className="p-1.5 text-emerald-600 hover:bg-emerald-50"
              title="Record Payment"
              onClick={() => {
                setContractForPayment(row);
                setPaymentModalOpen(true);
              }}
            >
              <CreditCard className="w-4 h-4" />
            </Button>
          )}

          {/* Printable Work Order */}
          <Button
            size="sm"
            variant="ghost"
            className="p-1.5 text-slate-600 hover:bg-slate-100"
            title="Official Work Order / Print"
            onClick={() => setPrintContract(row)}
          >
            <Printer className="w-4 h-4" />
          </Button>

          {/* Edit */}
          {['draft', 'pending_approval'].includes(row.status) && (
            <Button
              size="sm"
              variant="ghost"
              className="p-1.5 text-slate-600 hover:bg-slate-100"
              title="Edit Contract"
              onClick={() => {
                setEditingContract(row);
                setFormModalOpen(true);
              }}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}

          {/* Delete */}
          {['draft', 'cancelled'].includes(row.status) && (
            <Button
              size="sm"
              variant="ghost"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
              title="Delete Contract"
              onClick={() => setDeleteConfirm({ isOpen: true, contract: row })}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Contract Value</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-2">
            {formatCurrency(metrics.totalContractedValue)}
          </p>
          <span className="text-[11px] text-slate-400">{metrics.totalContracts} Total Contracts</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Total Paid</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-700 mt-2">
            {formatCurrency(metrics.totalPaidAmount)}
          </p>
          <span className="text-[11px] text-slate-400">Disbursed to date</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Outstanding Liability</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-amber-700 mt-2">
            {formatCurrency(metrics.totalOutstandingBalance)}
          </p>
          <span className="text-[11px] text-slate-400">Payable balance</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Execution</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-2">{metrics.activeContracts}</p>
          <span className="text-[11px] text-slate-400">Approved / Active</span>
        </div>
      </div>

      {/* Main Card with Filters & Table */}
      <Card>
        <div className="space-y-4">
          {/* Card Header & Primary Action */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Vendor Contracts & Work Orders</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage commercial agreements, itemized deliverables, multi-day schedules, and payment disbursements
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              >
                Refresh
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingContract(null);
                  setFormModalOpen(true);
                }}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Contract
              </Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
            <div className="md:col-span-2">
              <Input
                placeholder="Search by contract #, title, or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Lifecycle Statuses' },
                { value: 'draft', label: 'Draft' },
                { value: 'pending_approval', label: 'Pending Approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'active', label: 'Active' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />

            <Select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Payment Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'partial', label: 'Partially Paid' },
                { value: 'paid', label: 'Paid in Full' },
                { value: 'overdue', label: 'Overdue' },
              ]}
            />

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

          {/* Contracts Table */}
          <Table
            columns={columns}
            data={filteredContracts}
            isLoading={isLoading}
            emptyText="No contracts found matching the selected filters. Click 'Create Contract' to add an agreement."
          />
        </div>
      </Card>

      {/* Contract Form Modal (Create / Edit) */}
      {formModalOpen && (
        <ContractFormModal
          eventId={eventId}
          contract={editingContract}
          isOpen={formModalOpen}
          onClose={() => {
            setFormModalOpen(false);
            setEditingContract(null);
          }}
          onSuccess={() => {
            fetchData();
          }}
          eventDays={eventDays}
          defaultStartDate={eventStartDate}
          defaultEndDate={eventEndDate}
          isMultiDayEvent={isMultiDay}
        />
      )}

      {/* Contract Details & Management Drawer / Modal */}
      {detailsModalOpen && selectedContractId && (
        <ContractDetailsModal
          contractId={selectedContractId}
          isOpen={detailsModalOpen}
          initialTab={detailsInitialTab}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedContractId(null);
          }}
          onEdit={(c) => {
            setEditingContract(c);
            setFormModalOpen(true);
          }}
          onContractUpdated={() => {
            fetchData();
          }}
          eventDays={eventDays}
        />
      )}

      {/* Direct Record Payment Modal */}
      {paymentModalOpen && contractForPayment && (
        <RecordContractPaymentModal
          contract={contractForPayment}
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setContractForPayment(null);
          }}
          onSuccess={() => {
            fetchData();
          }}
        />
      )}

      {/* Printable Official Work Order */}
      {printContract && (
        <PrintableWorkOrder contract={printContract} onClose={() => setPrintContract(null)} />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, contract: null })}
        onConfirm={handleDelete}
        title="Delete Contract"
        message={
          <span>
            Are you sure you want to delete contract <strong>{deleteConfirm.contract?.contract_number}</strong> (
            {deleteConfirm.contract?.title})? This action cannot be undone.
          </span>
        }
        confirmLabel="Delete Contract"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventContractsTab;
