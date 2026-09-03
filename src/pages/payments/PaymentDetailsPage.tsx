import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { paymentsService } from '../../api/paymentsService';
import { PaymentItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import StatusBadge from '../../components/common/StatusBadge';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  ArrowLeft,
  Receipt,
  RotateCcw,
  Printer,
  CheckCircle2,
  AlertOctagon,
  Home,
  Building2,
  Users,
} from 'lucide-react';

export const PaymentDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [payment, setPayment] = useState<PaymentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reverse Modal State
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [reversalReason, setReversalReason] = useState('');
  const [isReversing, setIsReversing] = useState(false);

  const fetchPayment = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await paymentsService.getById(id);
      if (res.success && res.data) {
        setPayment(res.data);
      } else {
        setError(res.message || 'Payment receipt not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load payment receipt');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const handleReversePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !reversalReason.trim()) {
      toast.warning('Please specify a reason for payment reversal');
      return;
    }

    try {
      setIsReversing(true);
      const res = await paymentsService.reverse(id, reversalReason.trim());
      if (res.success && res.data) {
        toast.success('Payment successfully reversed.');
        setPayment(res.data);
        setReverseModalOpen(false);
      } else {
        toast.error(res.message || 'Failed to reverse payment');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to reverse payment'));
    } finally {
      setIsReversing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading payment receipt..." />
      </div>
    );
  }

  if (error || !payment) {
    return <ErrorState message={error || 'Payment not found'} onRetry={fetchPayment} />;
  }

  const isReversed = payment.payment_status === 'reversed';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.PAYMENTS)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Payments
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Receipt #{payment.receipt_number}
              </h1>
              <StatusBadge status={payment.payment_status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Paid on {formatDate(payment.payment_date)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Receipt
          </Button>

          {!isReversed && (
            <PermissionGuard permission={Permissions.PAYMENT_REVERSE}>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setReverseModalOpen(true)}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Reverse Payment
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Reversal Warning if applicable */}
      {isReversed && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-900 uppercase">Payment Reversed</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              Reason: {payment.reversal_reason || 'Administrative correction'}
            </p>
          </div>
        </div>
      )}

      {/* Receipt Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-indigo-600" />
            <span>Official Transaction Receipt</span>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Amount Paid Banner */}
          <div className="p-5 bg-gradient-to-r from-indigo-50 to-slate-50 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Amount Paid
              </span>
              <CurrencyDisplay
                amount={payment.amount_paid}
                className="text-3xl font-extrabold text-indigo-950 mt-1 block"
              />
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400 block">Payment Mode</span>
              <span className="font-bold text-slate-800 text-sm">{payment.payment_method?.name || 'Cash'}</span>
            </div>
          </div>

          {/* Transaction & Allocation Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Receipt Number:</span>
                <span className="font-semibold text-slate-900">{payment.receipt_number}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Transaction Ref:</span>
                <span className="font-semibold text-slate-900">{payment.transaction_reference || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payment Date:</span>
                <span className="font-semibold text-slate-900">{formatDate(payment.payment_date)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Payer Type:</span>
                <span className="font-semibold text-slate-900">
                  {payment.sponsor ? 'Corporate Sponsor' : 'Society Resident Unit'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Allocated To:</span>
                <span className="font-semibold text-slate-900">
                  {payment.sponsor
                    ? payment.sponsor.company_name
                    : payment.event_collection?.flat
                    ? `Flat ${payment.event_collection.flat.flat_number}`
                    : payment.event_collection?.bungalow
                    ? `Bungalow ${payment.event_collection.bungalow.bungalow_number}`
                    : 'Event Collection'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Recorded By:</span>
                <span className="font-semibold text-slate-900">
                  {payment.recorded_by_user?.full_name || 'System'}
                </span>
              </div>
            </div>
          </div>

          {/* Cheque Specific Details */}
          {payment.cheque_number && (
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Cheque Instrument Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-xs">
                <div>
                  <span className="text-slate-400 block">Cheque Number</span>
                  <span className="font-semibold text-slate-900">{payment.cheque_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Bank Name</span>
                  <span className="font-semibold text-slate-900">{payment.bank_name || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cheque Date</span>
                  <span className="font-semibold text-slate-900">{formatDate(payment.cheque_date)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Clearing Status</span>
                  <span className="font-semibold text-slate-900 capitalize">{payment.clearing_status || 'Pending'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {payment.notes && (
            <div className="pt-4 border-t border-slate-100 text-xs">
              <span className="text-slate-400 block mb-1">Receipt Notes:</span>
              <p className="text-slate-700 italic bg-slate-50 p-3 rounded-lg border border-slate-100">
                "{payment.notes}"
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Reversal Reason Modal */}
      <Modal
        isOpen={reverseModalOpen}
        onClose={() => setReverseModalOpen(false)}
        title="Reverse Payment Receipt"
        description="Reversing this transaction will restore the pending balance on the associated collection or sponsor."
      >
        <form onSubmit={handleReversePayment} className="space-y-4">
          <Textarea
            label="Mandatory Reason for Reversal"
            placeholder="e.g. Cheque dishonored / bounced, duplicate entry, resident requested refund..."
            rows={3}
            value={reversalReason}
            onChange={(e) => setReversalReason(e.target.value)}
            requiredIndicator
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReverseModalOpen(false)}
              disabled={isReversing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={isReversing}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Confirm Reversal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentDetailsPage;
