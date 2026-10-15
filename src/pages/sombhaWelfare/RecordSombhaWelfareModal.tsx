import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import { SombhaWelfareItem, CreateSombhaWelfareInput } from '../../types';
import { sombhaWelfareService } from '../../api/sombhaWelfareService';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { QrCode, Banknote, CreditCard, Building2, User, Home, IndianRupee } from 'lucide-react';
import clsx from 'clsx';

interface RecordSombhaWelfareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: SombhaWelfareItem | null;
  societyId?: string;
  eventId?: string;
}

const PAYMENT_MODES = [
  {
    value: 'CASH',
    name: 'Cash',
    subtitle: 'Physical',
    icon: Banknote,
    activeClass: 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-2xs',
    iconColor: 'text-emerald-600 bg-emerald-100',
  },
  {
    value: 'UPI',
    name: 'UPI / QR',
    subtitle: 'GPay, QR',
    icon: QrCode,
    activeClass: 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-2 ring-indigo-500/20 shadow-2xs',
    iconColor: 'text-indigo-600 bg-indigo-100',
  },
  {
    value: 'CHEQUE',
    name: 'Cheque',
    subtitle: 'DD / Chq',
    icon: CreditCard,
    activeClass: 'border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-2xs',
    iconColor: 'text-amber-600 bg-amber-100',
  },
  {
    value: 'BANK_TRANSFER',
    name: 'Transfer',
    subtitle: 'NEFT/IMPS',
    icon: Building2,
    activeClass: 'border-sky-600 bg-sky-50/90 text-sky-950 ring-2 ring-sky-500/20 shadow-2xs',
    iconColor: 'text-sky-600 bg-sky-100',
  },
];

export const RecordSombhaWelfareModal: React.FC<RecordSombhaWelfareModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  societyId,
  eventId,
}) => {
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    personName: '',
    flatNumber: '',
    block: '',
    amount: '',
    modeOfPayment: 'CASH',
    remarks: '',
    collectorName: '',
    transactionReference: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        personName: initialData.personName || initialData.person_name || '',
        flatNumber: initialData.flatNumber || initialData.flat_number || '',
        block: initialData.block || '',
        amount: String(initialData.amount || ''),
        modeOfPayment: (initialData.modeOfPayment || initialData.mode_of_payment || 'CASH').toUpperCase(),
        remarks: initialData.remarks || '',
        collectorName: initialData.collectorName || initialData.collector_name || '',
        transactionReference: initialData.transactionReference || initialData.transaction_reference || '',
      });
    } else {
      setFormData({
        personName: '',
        flatNumber: '',
        block: '',
        amount: '',
        modeOfPayment: 'CASH',
        remarks: '',
        collectorName: '',
        transactionReference: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.personName.trim()) {
      newErrors.personName = 'Person name is required';
    }
    if (!formData.flatNumber.trim()) {
      newErrors.flatNumber = 'Flat number is required';
    }
    const amtNum = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amtNum) || amtNum <= 0) {
      newErrors.amount = 'Valid amount greater than ₹0 is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const payload: CreateSombhaWelfareInput = {
        societyId: societyId || undefined,
        eventId: eventId || undefined,
        personName: formData.personName.trim(),
        flatNumber: formData.flatNumber.trim(),
        block: formData.block.trim() || undefined,
        amount: parseFloat(formData.amount),
        modeOfPayment: formData.modeOfPayment,
        remarks: formData.remarks.trim() || undefined,
        collectorName: formData.collectorName.trim() || undefined,
        transactionReference: formData.transactionReference.trim() || undefined,
      };

      if (initialData?.id) {
        await sombhaWelfareService.update(initialData.id, payload);
        toast.success('Contribution updated successfully');
      } else {
        await sombhaWelfareService.create(payload);
        toast.success('Contribution recorded successfully');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save contribution'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Sombha Welfare Contribution' : 'Record Sombha Welfare Contribution'}
      description="Record welfare fund collection for society support staff"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Person Name */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Name of the Person <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. Rajesh Sharma"
              value={formData.personName}
              onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
              className={clsx(
                'w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-all',
                errors.personName
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
              )}
            />
          </div>
          {errors.personName && (
            <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.personName}</p>
          )}
        </div>

        {/* Flat No and Block */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-8">
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Flat No <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Home className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. 1001 or E-1001"
                value={formData.flatNumber}
                onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
                className={clsx(
                  'w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-white focus:outline-hidden focus:ring-2 transition-all',
                  errors.flatNumber
                    ? 'border-rose-300 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
                )}
              />
            </div>
            {errors.flatNumber && (
              <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.flatNumber}</p>
            )}
          </div>

          <div className="col-span-4">
            <label className="text-xs font-bold text-slate-800 block mb-1">
              Wing / Block
            </label>
            <input
              type="text"
              placeholder="e.g. E"
              value={formData.block}
              onChange={(e) => setFormData({ ...formData, block: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden uppercase transition-all"
            />
          </div>
        </div>

        {/* Amount Paid */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Amount Paid (₹) <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              step="any"
              min="1"
              placeholder="e.g. 2500"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={clsx(
                'w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-white font-mono font-bold focus:outline-hidden focus:ring-2 transition-all',
                errors.amount
                  ? 'border-rose-300 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-indigo-400 focus:ring-indigo-100'
              )}
            />
          </div>
          {errors.amount && (
            <p className="text-[11px] text-rose-500 mt-1 font-medium">{errors.amount}</p>
          )}
        </div>

        {/* Mode of Payment (Visual 4-box selector) */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1.5">
            Mode of Payment <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {PAYMENT_MODES.map((item) => {
              const isSelected = formData.modeOfPayment === item.value;
              const Icon = item.icon;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, modeOfPayment: item.value })}
                  className={clsx(
                    'relative flex flex-col items-start p-2 rounded-xl border text-left transition-all cursor-pointer',
                    isSelected
                      ? item.activeClass
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <div
                      className={clsx(
                        'w-6 h-6 rounded-lg flex items-center justify-center',
                        isSelected ? item.iconColor : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 ring-2 ring-emerald-300 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold leading-tight block truncate w-full">
                    {item.name}
                  </span>
                  <span className="text-[9.5px] text-slate-500 block truncate w-full mt-0.5">
                    {item.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reference if UPI / Cheque */}
        {(formData.modeOfPayment === 'UPI' || formData.modeOfPayment === 'CHEQUE' || formData.modeOfPayment === 'BANK_TRANSFER') && (
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1">
              {formData.modeOfPayment === 'CHEQUE' ? 'Cheque No. / Bank' : 'Transaction Reference / UTR'}
            </label>
            <input
              type="text"
              placeholder={formData.modeOfPayment === 'CHEQUE' ? 'e.g. CHQ-984321 / HDFC' : 'e.g. UPI-Ref-492049102'}
              value={formData.transactionReference}
              onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all"
            />
          </div>
        )}

        {/* Collector Name */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Collected / Recorded By (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Krunal / Pareshbhai"
            value={formData.collectorName}
            onChange={(e) => setFormData({ ...formData, collectorName: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden transition-all"
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="text-xs font-bold text-slate-800 block mb-1">
            Remarks / Notes
          </label>
          <textarea
            rows={2}
            placeholder="Add any notes or context..."
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:outline-hidden resize-none transition-all"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-semibold"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
          >
            {initialData ? 'Update Contribution' : 'Save Contribution'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
