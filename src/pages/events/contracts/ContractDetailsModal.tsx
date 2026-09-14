import React, { useState, useEffect } from 'react';
import {
  ContractItemModel,
  ContractLineItem,
  ContractItemSchedule,
  ContractDocumentItem,
  ContractPaymentItem,
  EventDayItem,
} from '../../../types';
import { contractsService } from '../../../api/contractsService';
import Modal from '../../../components/ui/Modal';
import Tabs, { TabItem } from '../../../components/ui/Tabs';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import StatusBadge from '../../../components/common/StatusBadge';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import PermissionGuard from '../../../components/common/PermissionGuard';
import { useToast } from '../../../hooks/useToast';
import { usePermission } from '../../../hooks/usePermission';
import { Permissions } from '../../../constants/permissions';
import { formatDate, formatCurrency } from '../../../utils/formatters';
import { extractErrorMessage } from '../../../utils/errorExtractor';
import { PrintableWorkOrder } from './PrintableWorkOrder';
import { RecordContractPaymentModal } from './RecordContractPaymentModal';
import {
  Building2,
  Phone,
  Mail,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  CreditCard,
  Printer,
  Upload,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Download,
  Plus,
  Edit2,
  CheckSquare,
  Square,
  File,
} from 'lucide-react';

interface ContractDetailsModalProps {
  contractId: string;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (contract: ContractItemModel) => void;
  onContractUpdated?: (contract: ContractItemModel) => void;
  eventDays?: EventDayItem[];
}

export const ContractDetailsModal: React.FC<ContractDetailsModalProps> = ({
  contractId,
  isOpen,
  onClose,
  onEdit,
  onContractUpdated,
  eventDays = [],
}) => {
  const toast = useToast();
  const { can } = usePermission();

  const [contract, setContract] = useState<ContractItemModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Sub-modals
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Status Action Confirm Dialogs
  const [actionConfirm, setActionConfirm] = useState<{
    type: 'submit' | 'approve' | 'activate' | 'complete' | 'cancel' | 'delete';
    isOpen: boolean;
    reason?: string;
  }>({
    type: 'submit',
    isOpen: false,
  });
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [approvalComments, setApprovalComments] = useState('');

  // Document Upload State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('signed_contract');
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentNotes, setDocumentNotes] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Fetch Contract Data
  const fetchContract = async () => {
    if (!contractId) return;
    try {
      setIsLoading(true);
      const res = await contractsService.getById(contractId);
      if (res.success && res.data) {
        setContract(res.data);
      } else {
        toast.error(res.message || 'Failed to load contract details');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load contract details'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && contractId) {
      fetchContract();
    }
  }, [isOpen, contractId]);

  // Handle Lifecycle Transitions
  const handleLifecycleAction = async () => {
    if (!contract) return;
    try {
      setIsProcessingAction(true);
      let res;
      switch (actionConfirm.type) {
        case 'submit':
          res = await contractsService.submitForApproval(contract.id);
          break;
        case 'approve':
          res = await contractsService.approve(contract.id, approvalComments || undefined);
          break;
        case 'activate':
          res = await contractsService.activate(contract.id);
          break;
        case 'complete':
          res = await contractsService.complete(contract.id);
          break;
        case 'cancel':
          if (!cancelReason.trim()) {
            toast.error('Please specify a cancellation reason');
            return;
          }
          res = await contractsService.cancel(contract.id, cancelReason);
          break;
        case 'delete':
          res = await contractsService.delete(contract.id);
          if (res.success) {
            toast.success('Contract deleted successfully');
            setActionConfirm({ ...actionConfirm, isOpen: false });
            onClose();
            return;
          }
          break;
      }

      if (res && res.success && res.data) {
        toast.success(`Contract status updated successfully!`);
        setContract(res.data as ContractItemModel);
        if (onContractUpdated) onContractUpdated(res.data as ContractItemModel);
        setActionConfirm({ ...actionConfirm, isOpen: false });
      } else if (res && !res.success) {
        toast.error(res.message || 'Failed to update contract status');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to process contract action'));
    } finally {
      setIsProcessingAction(false);
    }
  };

  // Toggle Schedule Completion
  const handleToggleSchedule = async (itemId: string, scheduleId: string, currentStatus: boolean) => {
    if (!contract) return;
    try {
      const res = await contractsService.toggleScheduleCompletion(contract.id, itemId, scheduleId, !currentStatus);
      if (res.success) {
        toast.success(`Schedule item marked as ${!currentStatus ? 'Completed' : 'Pending'}`);
        fetchContract();
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to toggle schedule item'));
    }
  };

  // Upload Document
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setIsUploadingDoc(true);
      const formData = new FormData();
      formData.append('document', uploadFile);
      formData.append('document_type', documentType);
      formData.append('title', documentTitle || uploadFile.name);
      if (documentNotes) formData.append('notes', documentNotes);

      const res = await contractsService.uploadDocument(contract.id, formData);
      if (res.success) {
        toast.success('Document uploaded successfully!');
        setUploadFile(null);
        setDocumentTitle('');
        setDocumentNotes('');
        fetchContract();
      } else {
        toast.error(res.message || 'Failed to upload document');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to upload document'));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId: string) => {
    if (!contract) return;
    try {
      const res = await contractsService.deleteDocument(contract.id, docId);
      if (res.success) {
        toast.success('Document deleted');
        fetchContract();
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete document'));
    }
  };

  if (!isOpen) return null;

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Commercials & Overview', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'items', label: 'Deliverables & Items', icon: <Layers className="w-4 h-4" />, count: contract?.items?.length },
    { id: 'schedules', label: 'Execution Schedules', icon: <Calendar className="w-4 h-4" /> },
    { id: 'documents', label: 'Documents & Files', icon: <FileText className="w-4 h-4" />, count: contract?.documents?.length },
    { id: 'payments', label: 'Payment Ledger', icon: <CreditCard className="w-4 h-4" />, count: contract?.payments?.length },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        contract ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-sm">
              {contract.contract_number}
            </span>
            <span className="text-slate-900 font-bold">{contract.title}</span>
          </div>
        ) : (
          'Contract Details'
        )
      }
      description={contract?.vendor ? `Vendor: ${contract.vendor.vendor_name}` : undefined}
      size="xl"
    >
      {isLoading || !contract ? (
        <div className="py-16 text-center text-slate-500">Loading contract information...</div>
      ) : (
        <div className="space-y-4">
          {/* Header Action & Status Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={contract.status} />
              <StatusBadge status={contract.payment_status} />
              {contract.is_multi_day && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                  Multi-Day Contract
                </span>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Lifecycle Actions */}
              {contract.status === 'draft' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-indigo-700 hover:bg-indigo-50"
                  onClick={() => setActionConfirm({ type: 'submit', isOpen: true })}
                >
                  Submit for Approval
                </Button>
              )}

              {contract.status === 'pending_approval' && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setActionConfirm({ type: 'approve', isOpen: true })}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Approve Contract
                </Button>
              )}

              {contract.status === 'approved' && (
                <Button
                  size="sm"
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => setActionConfirm({ type: 'activate', isOpen: true })}
                >
                  Activate Contract
                </Button>
              )}

              {contract.status === 'active' && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-700 hover:bg-emerald-50 border-emerald-300"
                    onClick={() => setPaymentModalOpen(true)}
                    leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                  >
                    Record Payment
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => setActionConfirm({ type: 'complete', isOpen: true })}
                  >
                    Mark Completed
                  </Button>
                </>
              )}

              {['draft', 'pending_approval', 'approved', 'active'].includes(contract.status) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => setActionConfirm({ type: 'cancel', isOpen: true })}
                >
                  Cancel
                </Button>
              )}

              {/* Print Work Order */}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPrintModalOpen(true)}
                leftIcon={<Printer className="w-3.5 h-3.5" />}
              >
                Work Order
              </Button>

              {/* Edit */}
              {['draft', 'pending_approval'].includes(contract.status) && onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onEdit(contract);
                  }}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

          {/* Tab 1: Overview & Commercials */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Commercial Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <span className="text-[11px] text-slate-500 font-medium block">Total Contract Value</span>
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    {formatCurrency(contract.total_amount)}
                  </span>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3">
                  <span className="text-[11px] text-emerald-700 font-medium block">Total Amount Paid</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-700">
                    {formatCurrency(contract.total_paid)}
                  </span>
                </div>
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3">
                  <span className="text-[11px] text-amber-700 font-medium block">Remaining Due</span>
                  <span className="text-base sm:text-lg font-bold text-amber-700">
                    {formatCurrency(contract.remaining_balance)}
                  </span>
                </div>
                <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-3">
                  <span className="text-[11px] text-indigo-700 font-medium block">Agreed Advance</span>
                  <span className="text-base sm:text-lg font-bold text-indigo-700">
                    {formatCurrency(contract.advance_amount)}
                  </span>
                </div>
              </div>

              {/* Vendor & Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Vendor Information Card */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm">Vendor & Contractor Details</span>
                  </div>
                  <p className="font-semibold text-slate-800 text-sm">{contract.vendor?.vendor_name || 'N/A'}</p>
                  {contract.vendor?.mobile_no && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{contract.vendor.mobile_no}</span>
                    </div>
                  )}
                  {contract.vendor?.email && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{contract.vendor.email}</span>
                    </div>
                  )}
                  {contract.vendor?.address && <p className="text-slate-500">{contract.vendor.address}</p>}
                </div>

                {/* Scope & Schedule Info Card */}
                <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900 text-sm">Execution Period & Group</span>
                  </div>
                  <div className="space-y-1 text-slate-700">
                    <p>
                      <strong>Dates:</strong> {formatDate(contract.start_date)} to {formatDate(contract.end_date)}
                    </p>
                    {(contract.start_time || contract.end_time) && (
                      <p>
                        <strong>Timings:</strong> {contract.start_time || '--'} to {contract.end_time || '--'}
                      </p>
                    )}
                    {contract.service_group && (
                      <p>
                        <strong>Service Group:</strong> {contract.service_group.name}
                      </p>
                    )}
                    {contract.expense_category && (
                      <p>
                        <strong>Expense Category:</strong> {contract.expense_category.name}
                      </p>
                    )}
                    <p>
                      <strong>Contract Type:</strong> {contract.contract_type?.replace(/_/g, ' ').toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Commercial Breakdown Table */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
                  Commercials Breakdown
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Subtotal (Items):</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(contract.sub_total_amount)}</span>
                    </div>
                    {Number(contract.discount_amount) > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount:</span>
                        <span className="font-semibold">- {formatCurrency(contract.discount_amount)}</span>
                      </div>
                    )}
                    {contract.tax_applicable && (
                      <div className="flex justify-between">
                        <span>Tax ({contract.tax_percentage || 0}%):</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(contract.tax_amount)}</span>
                      </div>
                    )}
                    <div className="pt-1.5 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                      <span>Total Contract Value:</span>
                      <span className="text-indigo-700">{formatCurrency(contract.total_amount)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-slate-600 border-t sm:border-t-0 sm:border-l sm:pl-4 border-slate-200">
                    <div className="flex justify-between">
                      <span>Total Paid to Date:</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(contract.total_paid)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Remaining Balance:</span>
                      <span className={Number(contract.remaining_balance) > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                        {formatCurrency(contract.remaining_balance)}
                      </span>
                    </div>
                    {contract.payment_terms && (
                      <div className="pt-1 text-[11px] text-slate-500">
                        <strong>Terms:</strong> {contract.payment_terms}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Deliverables & Items */}
          {activeTab === 'items' && (
            <div className="space-y-3">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">Service Group / Category</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {contract.items && contract.items.length > 0 ? (
                      contract.items.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <p className="font-semibold text-slate-900">{item.item_name}</p>
                            {item.description && <p className="text-[11px] text-slate-500">{item.description}</p>}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {item.service_group?.name || '--'}
                            {item.expense_category && (
                              <span className="text-[10px] text-slate-400 block">{item.expense_category.name}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-center text-slate-500">{item.unit || 'Nos'}</td>
                          <td className="py-2.5 px-3 text-right">{formatCurrency(item.unit_price ?? item.unit_rate ?? 0)}</td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                            {formatCurrency(item.total_amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          No itemized breakdown recorded for this contract.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Execution Schedules */}
          {activeTab === 'schedules' && (
            <div className="space-y-4">
              {contract.items && contract.items.some((i) => i.schedules && i.schedules.length > 0) ? (
                contract.items.map(
                  (item) =>
                    item.schedules &&
                    item.schedules.length > 0 && (
                      <div key={item.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">
                            Deliverable: {item.item_name} ({item.quantity} {item.unit})
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {item.schedules.filter((s) => s.is_completed).length} of {item.schedules.length} Completed
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {item.schedules.map((sch) => (
                            <div
                              key={sch.id}
                              onClick={() => {
                                if (item.id && sch.id) {
                                  handleToggleSchedule(item.id, sch.id, Boolean(sch.is_completed));
                                }
                              }}
                              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                sch.is_completed
                                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                                  : 'bg-white border-slate-200 hover:border-indigo-300 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-xs">
                                  {sch.event_day?.display_name ||
                                    (sch.event_day?.day_number ? `Day ${sch.event_day.day_number}` : 'Scheduled Slot')}
                                </span>
                                {sch.is_completed ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </div>
                              <p className="text-xs mt-1">
                                Qty: <strong>{sch.quantity ?? sch.quantity_for_day ?? 1}</strong> {item.unit}
                              </p>
                              {(sch.start_time || sch.end_time) && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Time: {sch.start_time || '--'} - {sch.end_time || '--'}
                                </p>
                              )}
                              {sch.special_instructions && (
                                <p className="text-[11px] text-slate-600 mt-1 italic">&ldquo;{sch.special_instructions}&rdquo;</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                )
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  No multi-day execution schedules defined for this contract.
                </div>
              )}
            </div>
          )}



          {/* Tab 5: Documents & Attachments */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Document Upload Form */}
              <form onSubmit={handleUploadDocument} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                  Upload Contract Document / Attachment
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Document Title"
                    placeholder="e.g. Signed Work Order / GST Invoice"
                    value={documentTitle}
                    onChange={(e) => setDocumentTitle(e.target.value)}
                  />
                  <Select
                    label="Document Type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    options={[
                      { value: 'signed_contract', label: 'Signed Contract / Agreement' },
                      { value: 'work_order', label: 'Work Order' },
                      { value: 'invoice', label: 'Vendor Tax Invoice' },
                      { value: 'quotation', label: 'Quotation / Estimate' },
                      { value: 'id_proof', label: 'Identity / Govt Proof' },
                      { value: 'other', label: 'Other Attachment' },
                    ]}
                  />
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (PDF, Img, Doc)</label>
                    <input
                      type="file"
                      required
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    isLoading={isUploadingDoc}
                    leftIcon={<Upload className="w-3.5 h-3.5" />}
                  >
                    Upload Document
                  </Button>
                </div>
              </form>

              {/* Documents List */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                      <th className="py-2.5 px-3">Document Title</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">File Size</th>
                      <th className="py-2.5 px-3">Uploaded Date</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {contract.documents && contract.documents.length > 0 ? (
                      contract.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <File className="w-4 h-4 text-indigo-500" />
                              <span className="font-semibold text-slate-900">{doc.title}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {doc.document_type.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-500">
                            {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '--'}
                          </td>
                          <td className="py-2 px-3 text-slate-500">{formatDate(doc.created_at)}</td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 text-indigo-600 hover:text-indigo-800"
                                title="Download / View"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDeleteDocument(doc.id)}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No documents attached to this contract yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 6: Payment Ledger */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Contract Payment Ledger</h4>
                  <p className="text-[11px] text-slate-500">
                    Paid: {formatCurrency(contract.total_paid)} / {formatCurrency(contract.total_amount)}
                  </p>
                </div>
                {['approved', 'active', 'completed'].includes(contract.status) && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setPaymentModalOpen(true)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Record Payment
                  </Button>
                )}
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Reference / Cheque</th>
                      <th className="py-2.5 px-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {contract.payments && contract.payments.length > 0 ? (
                      contract.payments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-medium text-slate-800">{formatDate(pay.payment_date)}</td>
                          <td className="py-2.5 px-3 font-bold text-emerald-600">{formatCurrency(pay.amount)}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-700">{pay.payment_method}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {pay.reference_number || (pay.cheque_number ? `Chq: ${pay.cheque_number}` : '--')}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{pay.remarks || '--'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No payments recorded against this contract yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Printable Work Order View Modal */}
      {printModalOpen && contract && (
        <PrintableWorkOrder contract={contract} onClose={() => setPrintModalOpen(false)} />
      )}

      {/* Record Payment Modal */}
      {paymentModalOpen && contract && (
        <RecordContractPaymentModal
          contract={contract}
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSuccess={(updated) => {
            setContract(updated);
            if (onContractUpdated) onContractUpdated(updated);
          }}
        />
      )}

      {/* Status Action Confirmation Dialog */}
      <ConfirmDialog
        isOpen={actionConfirm.isOpen}
        onClose={() => setActionConfirm({ ...actionConfirm, isOpen: false })}
        onConfirm={handleLifecycleAction}
        title={
          actionConfirm.type === 'submit'
            ? 'Submit Contract for Approval'
            : actionConfirm.type === 'approve'
            ? 'Approve Contract'
            : actionConfirm.type === 'activate'
            ? 'Activate Contract'
            : actionConfirm.type === 'complete'
            ? 'Complete Contract'
            : actionConfirm.type === 'cancel'
            ? 'Cancel Contract'
            : 'Delete Contract'
        }
        message={
          <div className="space-y-3 text-xs">
            <p>
              Are you sure you want to <strong>{actionConfirm.type}</strong> this contract (
              {contract?.contract_number})?
            </p>
            {actionConfirm.type === 'approve' && (
              <Input
                label="Approval Comments (Optional)"
                placeholder="e.g. Verified deliverables and commercials approved by committee"
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
              />
            )}
            {actionConfirm.type === 'cancel' && (
              <Input
                label="Cancellation Reason (Required)"
                placeholder="e.g. Vendor unavailable on specified dates"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            )}
          </div>
        }
        confirmLabel={
          actionConfirm.type === 'delete' || actionConfirm.type === 'cancel'
            ? 'Confirm Action'
            : 'Proceed'
        }
        variant={actionConfirm.type === 'delete' || actionConfirm.type === 'cancel' ? 'danger' : 'primary'}
        isLoading={isProcessingAction}
      />
    </Modal>
  );
};
