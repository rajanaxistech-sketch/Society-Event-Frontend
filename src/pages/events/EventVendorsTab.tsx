import React, { useEffect, useState, useMemo } from 'react';
import { eventVendorsService } from '../../api/eventVendorsService';
import { paymentMethodsService } from '../../api/paymentMethodsService';
import { EventContractItem, VendorPaymentItem, PaymentMethodItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
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
import {
  Plus,
  Edit2,
  Trash2,
  Building2,
  Phone,
  Mail,
  CreditCard,
  History,
  Receipt,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wallet,
} from 'lucide-react';

interface EventVendorsTabProps {
  eventId: string;
}

const DEFAULT_CONTRACT_TYPES = [
  'Snacks / Catering Contract',
  'Mandap / Decoration Contract',
  'Temple / Mataji Setup Contract',
  'DJ & Sound System',
  'Main Stage & Structure',
  'Lighting & Electrical',
  'Anchor / Host',
  'Live Artist / Singer',
  'Food & Beverage',
  'Security Agency Contract',
  'Generator & Power Supply',
  'Photography & Video Coverage',
  'Sanitation & Housekeeping',
  'Other Event-related Contract',
];

export const EventVendorsTab: React.FC<EventVendorsTabProps> = ({ eventId }) => {
  const toast = useToast();
  const { can } = usePermission();

  const [contracts, setContracts] = useState<EventContractItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit Contract Modal
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<EventContractItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Contract form fields
  const [contractType, setContractType] = useState(DEFAULT_CONTRACT_TYPES[0]);
  const [customType, setCustomType] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [advancePayment, setAdvancePayment] = useState('0');
  const [notes, setNotes] = useState('');

  // Record Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedContractForPay, setSelectedContractForPay] = useState<EventContractItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [chequeNumber, setChequeNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<PaymentMethodItem[]>([]);

  // Payment History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedContractForHistory, setSelectedContractForHistory] = useState<EventContractItem | null>(null);
  const [historyPayments, setHistoryPayments] = useState<VendorPaymentItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Delete modal
  const [contractToDelete, setContractToDelete] = useState<EventContractItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const res = await eventVendorsService.listByEvent(eventId, { limit: 100 });
      if (res.success && res.data) {
        setContracts(res.data);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load vendor contracts'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchContracts();
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
          setPaymentMethod((prev) => (activeOnly.some((m) => m.code === prev) ? prev : activeOnly[0].code));
        } else {
          setPaymentMethod('');
        }
      }
    } catch {}
  };

  // Load only active payment methods
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Financial summary metrics
  const summary = useMemo(() => {
    let totalValue = 0;
    let totalPaid = 0;
    let totalPending = 0;

    contracts.forEach((c) => {
      totalValue += Number(c.contract_amount || 0);
      totalPaid += Number(c.total_paid || 0);
      totalPending += Number(c.remaining_balance || 0);
    });

    return {
      count: contracts.length,
      totalValue,
      totalPaid,
      totalPending,
    };
  }, [contracts]);

  const openCreateModal = () => {
    setEditingContract(null);
    setContractType(DEFAULT_CONTRACT_TYPES[0]);
    setCustomType('');
    setVendorName('');
    setContactPerson('');
    setMobileNumber('');
    setEmail('');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setContractAmount('');
    setAdvancePayment('0');
    setNotes('');
    setContractModalOpen(true);
  };

  const openEditModal = (c: EventContractItem) => {
    setEditingContract(c);
    if (DEFAULT_CONTRACT_TYPES.includes(c.contract_type)) {
      setContractType(c.contract_type);
      setCustomType('');
    } else {
      setContractType('Other Event-related Contract');
      setCustomType(c.contract_type);
    }
    setVendorName(c.vendor_name);
    setContactPerson(c.contact_person || '');
    setMobileNumber(c.mobile_number || '');
    setEmail(c.email || '');
    setDescription(c.description || '');
    setStartDate(c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '');
    setEndDate(c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : '');
    setContractAmount(String(c.contract_amount || ''));
    setAdvancePayment(String(c.advance_payment || 0));
    setNotes(c.notes || '');
    setContractModalOpen(true);
  };

  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) {
      toast.warning('Please enter the vendor/agency name');
      return;
    }
    if (!contractAmount || Number(contractAmount) < 0) {
      toast.warning('Please enter a valid contract amount');
      return;
    }

    const resolvedType = contractType === 'Other Event-related Contract' && customType.trim() ? customType.trim() : contractType;

    try {
      setIsSaving(true);
      const payload = {
        event_id: eventId,
        contract_type: resolvedType,
        vendor_name: vendorName.trim(),
        contact_person: contactPerson || null,
        mobile_number: mobileNumber || null,
        email: email || null,
        description: description || null,
        start_date: startDate || null,
        end_date: endDate || null,
        contract_amount: Number(contractAmount),
        advance_payment: Number(advancePayment) || 0,
        notes: notes || null,
      };

      if (editingContract) {
        const res = await eventVendorsService.update(editingContract.id, payload);
        if (res.success) {
          toast.success(`Contract for "${vendorName}" updated.`);
          setContractModalOpen(false);
          fetchContracts();
        } else {
          toast.error(res.message || 'Failed to update contract');
        }
      } else {
        const res = await eventVendorsService.create(payload);
        if (res.success) {
          toast.success(`Vendor contract "${vendorName}" created.`);
          setContractModalOpen(false);
          fetchContracts();
        } else {
          toast.error(res.message || 'Failed to create contract');
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save vendor contract'));
    } finally {
      setIsSaving(false);
    }
  };

  const openPaymentModal = (contract: EventContractItem) => {
    setSelectedContractForPay(contract);
    setPaymentAmount(String(contract.remaining_balance || ''));
    setPaymentMethod((prev) => (availablePaymentMethods.some((m) => m.code === prev) ? prev : availablePaymentMethods[0]?.code || ''));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setChequeNumber('');
    setBankName('');
    setChequeDate('');
    setReferenceNumber('');
    setRemarks('');
    setPaymentModalOpen(true);
    fetchPaymentMethods();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractForPay) return;

    if (!paymentMethod) {
      toast.warning('Please select an active payment method');
      return;
    }

    const amt = Number(paymentAmount);
    const balance = Number(selectedContractForPay.remaining_balance || 0);

    if (amt <= 0) {
      toast.warning('Payment amount must be greater than 0');
      return;
    }
    if (amt > balance) {
      toast.error(`Payment amount cannot exceed remaining balance of ${formatCurrency(balance)}`);
      return;
    }

    try {
      setIsRecordingPayment(true);
      const res = await eventVendorsService.recordPayment(selectedContractForPay.id, {
        amount: amt,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        cheque_number: paymentMethod === 'CHEQUE' ? chequeNumber : null,
        bank_name: paymentMethod === 'CHEQUE' ? bankName : null,
        cheque_date: paymentMethod === 'CHEQUE' && chequeDate ? chequeDate : null,
        reference_number: referenceNumber || null,
        remarks: remarks || null,
      });

      if (res.success) {
        toast.success(`Payment of ${formatCurrency(amt)} recorded for ${selectedContractForPay.vendor_name}.`);
        setPaymentModalOpen(false);
        fetchContracts();
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to record vendor payment'));
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const openHistoryModal = async (contract: EventContractItem) => {
    setSelectedContractForHistory(contract);
    setHistoryModalOpen(true);
    try {
      setIsLoadingHistory(true);
      const res = await eventVendorsService.getPaymentHistory(contract.id);
      if (res.success && res.data) {
        setHistoryPayments(res.data);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load payment history'));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!contractToDelete) return;
    try {
      setIsDeleting(true);
      const res = await eventVendorsService.delete(contractToDelete.id);
      if (res.success) {
        toast.success(`Contract for "${contractToDelete.vendor_name}" deleted.`);
        setContractToDelete(null);
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

  const columns: Column<EventContractItem>[] = [
    {
      key: 'vendor',
      header: 'Vendor & Service Type',
      render: (row) => (
        <div>
          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>{row.vendor_name}</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-700 block mt-0.5">{row.contract_type}</span>
          {row.contact_person && (
            <span className="text-[10px] text-slate-400 block mt-0.5">Contact: {row.contact_person}</span>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (row) => (
        <div className="text-[11px] space-y-0.5">
          {row.mobile_number && (
            <div className="flex items-center gap-1 text-slate-700">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{row.mobile_number}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center gap-1 text-slate-500">
              <Mail className="w-3 h-3 text-slate-400" />
              <span>{row.email}</span>
            </div>
          )}
          {!row.mobile_number && !row.email && <span className="text-slate-400">—</span>}
        </div>
      ),
    },
    {
      key: 'contract_amount',
      header: 'Contract Amount',
      align: 'right',
      render: (row) => (
        <CurrencyDisplay amount={row.contract_amount} className="font-bold text-slate-900" />
      ),
    },
    {
      key: 'total_paid',
      header: 'Total Paid',
      align: 'right',
      render: (row) => <CurrencyDisplay amount={row.total_paid} trend="positive" />,
    },
    {
      key: 'remaining_balance',
      header: 'Balance Remaining',
      align: 'right',
      render: (row) => (
        <CurrencyDisplay
          amount={row.remaining_balance}
          trend={Number(row.remaining_balance) > 0 ? 'negative' : 'neutral'}
          className="font-extrabold"
        />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
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
          <PermissionGuard permission={Permissions.PAYMENT_CREATE}>
            {Number(row.remaining_balance) > 0 ? (
              <Button
                size="sm"
                variant="primary"
                onClick={() => openPaymentModal(row)}
                className="text-[11px] h-7 px-2"
              >
                Pay
              </Button>
            ) : (
              <span className="text-[11px] text-emerald-600 font-bold px-2 py-0.5 bg-emerald-50 rounded">
                Settled
              </span>
            )}
          </PermissionGuard>
          <PermissionGuard permission={Permissions.EVENT_UPDATE}>
            <button
              type="button"
              onClick={() => openEditModal(row)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit Contract"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setContractToDelete(row)}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Delete Contract"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Contracts</span>
            <Building2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900">{summary.count}</span>
            <span className="text-[10px] text-slate-400 ml-2">Vendors / Contractors</span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Contract Value</span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1">
            <CurrencyDisplay amount={summary.totalValue} className="text-lg sm:text-xl font-extrabold text-slate-900" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1">
            <CurrencyDisplay amount={summary.totalPaid} trend="positive" className="text-lg sm:text-xl font-extrabold" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Balance</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1">
            <CurrencyDisplay
              amount={summary.totalPending}
              trend={summary.totalPending > 0 ? 'negative' : 'neutral'}
              className="text-lg sm:text-xl font-extrabold"
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card
        title="Vendors, Agencies & Contractor Directory"
        subtitle="Manage event service contracts, advance disbursements, installment payments, and outstanding balances."
        headerAction={
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchContracts}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <PermissionGuard permission={Permissions.EVENT_UPDATE}>
              <Button
                variant="primary"
                size="sm"
                onClick={openCreateModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                + Add Vendor / Contract
              </Button>
            </PermissionGuard>
          </div>
        }
      >
        <Table
          columns={columns}
          data={contracts}
          isLoading={isLoading}
          emptyText="No vendor contracts registered for this event."
        />
      </Card>

      {/* Add / Edit Contract Modal */}
      <Modal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        title={editingContract ? `Edit Contract: ${editingContract.vendor_name}` : 'Create Vendor / Contractor Record'}
        description="Establish formal contract terms, scope, payment milestones, and agreed fees."
      >
        <form onSubmit={handleSaveContract} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Contract / Service Type"
              requiredIndicator
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
            >
              {DEFAULT_CONTRACT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>

            {contractType === 'Other Event-related Contract' ? (
              <Input
                label="Custom Contract Type Name"
                placeholder="e.g. Drone Light Show Agency"
                requiredIndicator
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
              />
            ) : (
              <Input
                label="Vendor / Agency Name"
                placeholder="e.g. Om Sound & Event Management"
                requiredIndicator
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            )}
          </div>

          {contractType === 'Other Event-related Contract' && (
            <Input
              label="Vendor / Agency Name"
              placeholder="e.g. Om Sound & Event Management"
              requiredIndicator
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Contact Person"
              placeholder="e.g. Rajeshbhai Patel"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
            <Input
              label="Mobile Number"
              placeholder="e.g. 9876543210"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="vendor@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Total Contract Amount (₹)"
              type="number"
              placeholder="e.g. 100000"
              requiredIndicator
              value={contractAmount}
              onChange={(e) => setContractAmount(e.target.value)}
            />
            {!editingContract && (
              <Input
                label="Initial Advance Payment (₹)"
                type="number"
                placeholder="e.g. 30000 (optional)"
                value={advancePayment}
                onChange={(e) => setAdvancePayment(e.target.value)}
                helperText="Advance payment entry will be created automatically"
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contract Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Contract End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <Textarea
            label="Service Scope / Description"
            placeholder="Equipment provided, setup timelines, staffing count..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Textarea
            label="Internal Notes / Payment Terms"
            placeholder="50% before event, 50% post wrap-up..."
            rows={1}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setContractModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingContract ? 'Update Contract' : 'Create Contract'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Vendor Payment Modal */}
      <Modal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title={`Record Payment: ${selectedContractForPay?.vendor_name}`}
        description={`Record cash, cheque, or bank payment against ${selectedContractForPay?.contract_type}.`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-3.5">
          {/* Balance Context */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Contract Total</span>
              <span className="font-extrabold text-slate-800 text-sm">
                {formatCurrency(selectedContractForPay?.contract_amount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Total Paid</span>
              <span className="font-extrabold text-emerald-600 text-sm">
                {formatCurrency(selectedContractForPay?.total_paid)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 uppercase text-[10px] font-bold block">Remaining Balance</span>
              <span className="font-extrabold text-rose-600 text-sm">
                {formatCurrency(selectedContractForPay?.remaining_balance)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Payment Amount (₹)"
              type="number"
              requiredIndicator
              placeholder={`Max ${selectedContractForPay?.remaining_balance}`}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
            />

            <Select
              label="Payment Method"
              requiredIndicator
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
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
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />

          {paymentMethod === 'CHEQUE' && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-3">
              <span className="text-xs font-bold text-amber-900 block">Cheque Details</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Input
                  label="Cheque Number"
                  placeholder="e.g. 123456"
                  requiredIndicator
                  value={chequeNumber}
                  onChange={(e) => setChequeNumber(e.target.value)}
                />
                <Input
                  label="Bank Name"
                  placeholder="e.g. HDFC Bank"
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

          {paymentMethod !== 'CHEQUE' && paymentMethod !== 'CASH' && (
            <Input
              label="Transaction / UPI Reference Number"
              placeholder="e.g. UPI/2026/09/88219"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          )}

          <Textarea
            label="Payment Remarks / Notes"
            placeholder="e.g. Milestone 2 settlement, advance deduction..."
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
              disabled={isRecordingPayment}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isRecordingPayment}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Payment Ledger: ${selectedContractForHistory?.vendor_name}`}
        description={`Audit record of all disbursements made toward ${selectedContractForHistory?.contract_type}.`}
      >
        <div className="space-y-3">
          {isLoadingHistory ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading payment ledger...</div>
          ) : historyPayments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No payment records found for this vendor.</div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {historyPayments.map((p, idx) => (
                <div key={p.id} className="p-3 bg-white flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(p.amount)}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px] text-slate-700">
                        {p.payment_method}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Date: {formatDate(p.payment_date)}
                      {p.cheque_number && ` • Cheque #${p.cheque_number} (${p.bank_name || 'Bank'})`}
                      {p.reference_number && ` • Ref: ${p.reference_number}`}
                    </p>
                    {p.remarks && <p className="text-[10px] text-slate-400 italic mt-0.5">"{p.remarks}"</p>}
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
            <span className="font-semibold text-slate-600">Total Disbursed:</span>
            <CurrencyDisplay
              amount={historyPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)}
              className="text-base font-extrabold text-emerald-700"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!contractToDelete}
        onClose={() => setContractToDelete(null)}
        onConfirm={handleDeleteContract}
        title="Delete Vendor Contract"
        message={
          <span>
            Are you sure you want to delete the contract for <strong>{contractToDelete?.vendor_name}</strong>?
          </span>
        }
        confirmLabel="Delete Contract"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventVendorsTab;
