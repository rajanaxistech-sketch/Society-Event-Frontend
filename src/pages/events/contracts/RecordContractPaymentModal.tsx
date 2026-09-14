import React, { useState, useEffect } from 'react';
import { ContractItemModel, PaymentMethodItem } from '../../../types';
import { contractsService } from '../../../api/contractsService';
import { paymentMethodsService } from '../../../api/paymentMethodsService';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../utils/formatters';
import { extractErrorMessage } from '../../../utils/errorExtractor';
import { CreditCard, CheckCircle2, Building2 } from 'lucide-react';

interface RecordContractPaymentModalProps {
  contract: ContractItemModel;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedContract: ContractItemModel) => void;
}

export const RecordContractPaymentModal: React.FC<RecordContractPaymentModalProps> = ({
  contract,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const toast = useToast();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [amount, setAmount] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [chequeNumber, setChequeNumber] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [chequeDate, setChequeDate] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Default amount to remaining balance if > 0
      setAmount(contract.remaining_balance > 0 ? String(contract.remaining_balance) : '');
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setReferenceNumber('');
      setChequeNumber('');
      setBankName('');
      setChequeDate('');
      setRemarks('');

      // Fetch payment methods
      paymentMethodsService
        .getAll({ is_active: true })
        .then((res) => {
          if (res.success && res.data) {
            const list = Array.isArray(res.data) ? res.data : (res.data as any).data || [];
            setPaymentMethods(list);
            if (list.length > 0 && !list.find((m: any) => m.name.toUpperCase() === paymentMethod)) {
              setPaymentMethod(list[0].name);
            }
          }
        })
        .catch(() => {
          // Fallback methods
        });
    }
  }, [isOpen, contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      toast.error('Please enter a valid payment amount greater than 0');
      return;
    }

    if (contract.remaining_balance <= 0) {
      toast.error('This contract has already been fully paid');
      return;
    }

    if (payAmount > contract.remaining_balance) {
      toast.error(`Payment amount (${formatCurrency(payAmount)}) cannot exceed outstanding balance (${formatCurrency(contract.remaining_balance)})`);
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await contractsService.recordPayment(contract.id, {
        amount: payAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
        cheque_number: chequeNumber || undefined,
        bank_name: bankName || undefined,
        cheque_date: chequeDate || undefined,
        remarks: remarks || undefined,
      });

      if (res.success && res.data) {
        toast.success(`Payment of ${formatCurrency(payAmount)} recorded successfully!`);
        onSuccess(res.data.contract);
        onClose();
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to record payment'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCheque =
    paymentMethod.toLowerCase().includes('cheque') || paymentMethod.toLowerCase().includes('check');

  const payAmountNum = Number(amount) || 0;
  const newBalance = Math.max(0, contract.remaining_balance - payAmountNum);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Vendor Payment"
      description={`Contract: ${contract.contract_number} • ${contract.title}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Balance Overview Widget */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <span className="text-slate-500 block">Total Contract</span>
            <span className="font-bold text-slate-800 text-sm">{formatCurrency(contract.total_amount)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Already Paid</span>
            <span className="font-bold text-emerald-600 text-sm">{formatCurrency(contract.total_paid)}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Outstanding</span>
            <span className="font-bold text-amber-600 text-sm">{formatCurrency(contract.remaining_balance)}</span>
          </div>
        </div>

        {contract.remaining_balance <= 0 && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>This contract is fully paid. No further payments are due.</span>
          </div>
        )}

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Payment Amount (₹)"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
          <Input
            label="Payment Date"
            type="date"
            required
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
          />
        </div>

        {/* Payment Method */}
        <div>
          <Select
            label="Payment Method"
            required
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={
              paymentMethods.length > 0
                ? paymentMethods.map((m) => ({
                    value: m.name,
                    label: m.name.replace(/_/g, ' '),
                  }))
                : [
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT / RTGS' },
                    { value: 'CHEQUE', label: 'Cheque' },
                    { value: 'UPI', label: 'UPI / QR Code' },
                    { value: 'CASH', label: 'Cash' },
                    { value: 'CREDIT_CARD', label: 'Credit Card' },
                  ]
            }
          />
        </div>

        {/* Reference / Transaction Number */}
        <Input
          label="Transaction / Reference ID"
          placeholder="e.g. UTR / Transaction reference number"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
        />

        {/* Conditional Cheque Fields */}
        {isCheque && (
          <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Cheque Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Cheque Number"
                placeholder="6-digit cheque number"
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
              />
              <Input
                label="Bank Name"
                placeholder="e.g. HDFC Bank"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Cheque Date"
                  type="date"
                  value={chequeDate}
                  onChange={(e) => setChequeDate(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Remarks / Notes */}
        <Textarea
          label="Payment Remarks"
          placeholder="e.g. Advance payment / Milestone 1 payment"
          rows={2}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        {/* Live Calculation Footer */}
        {payAmountNum > 0 && (
          <div className="flex items-center justify-between text-xs px-3 py-2 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
            <span>Projected Remaining Due:</span>
            <span className="font-bold">{formatCurrency(newBalance)}</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<CreditCard className="w-4 h-4" />}
          >
            Record Payment ({formatCurrency(payAmountNum)})
          </Button>
        </div>
      </form>
    </Modal>
  );
};
