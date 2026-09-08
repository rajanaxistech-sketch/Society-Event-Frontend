import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { paymentsService } from '../../api/paymentsService';
import { paymentMethodsService } from '../../api/paymentMethodsService';
import { collectionsService } from '../../api/collectionsService';
import { sponsorshipsService } from '../../api/sponsorshipsService';
import { PaymentMethodItem, EventCollectionItem, SponsorItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import { ArrowLeft, Save, CreditCard, Wallet, Home, Building2, Users } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';

const recordPaymentSchema = z.object({
  payment_target_type: z.enum(['collection', 'sponsor']),
  event_collection_id: z.string().optional(),
  sponsor_id: z.string().optional(),
  amount_paid: z.coerce.number().positive('Amount must be greater than 0'),
  payment_method_id: z.string().min(1, 'Please select a payment method'),
  payment_date: z.string().min(1, 'Payment date is required'),
  transaction_reference: z.string().optional(),
  cheque_number: z.string().optional(),
  bank_name: z.string().optional(),
  cheque_date: z.string().optional(),
  clearing_status: z.enum(['pending', 'cleared', 'bounced']).optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.payment_target_type === 'collection') {
    return !!data.event_collection_id && data.event_collection_id.trim().length > 0;
  } else {
    return !!data.sponsor_id && data.sponsor_id.trim().length > 0;
  }
}, {
  message: 'Please select a collection obligation or sponsor to credit',
  path: ['payment_target_type'],
});

type RecordPaymentFormData = z.infer<typeof recordPaymentSchema>;

export const RecordPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const urlCollectionId = decodeId(searchParams.get('collectionId') || '');
  const urlSponsorId = decodeId(searchParams.get('sponsorId') || '');

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [collections, setCollections] = useState<EventCollectionItem[]>([]);
  const [sponsors, setSponsors] = useState<SponsorItem[]>([]);
  const [targetType, setTargetType] = useState<'collection' | 'sponsor'>(
    urlSponsorId ? 'sponsor' : 'collection'
  );
  const [selectedMethodCode, setSelectedMethodCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    paymentMethodsService.getAll().then((res) => {
      if (res.success && res.data) {
        setPaymentMethods(res.data);
        if (res.data[0]) {
          setSelectedMethodCode(res.data[0].code);
        }
      }
    });

    collectionsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setCollections(res.data);
    });

    sponsorshipsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setSponsors(res.data);
    });
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecordPaymentFormData>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      payment_target_type: urlSponsorId ? 'sponsor' : 'collection',
      event_collection_id: urlCollectionId || '',
      sponsor_id: urlSponsorId || '',
      amount_paid: 0,
      payment_method_id: '',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_reference: '',
      cheque_number: '',
      bank_name: '',
      cheque_date: '',
      clearing_status: 'cleared',
      notes: '',
    },
  });

  const selectedCollectionId = watch('event_collection_id');
  const selectedSponsorId = watch('sponsor_id');

  const activeCollection = collections.find((c) => c.id === selectedCollectionId);
  const activeSponsor = sponsors.find((s) => s.id === selectedSponsorId);

  const onSubmit = async (data: RecordPaymentFormData) => {
    try {
      setIsSubmitting(true);

      const payload = {
        event_collection_id: targetType === 'collection' ? data.event_collection_id : null,
        sponsor_id: targetType === 'sponsor' ? data.sponsor_id : null,
        amount_paid: data.amount_paid,
        payment_method_id: data.payment_method_id,
        payment_date: data.payment_date,
        transaction_reference: data.transaction_reference || null,
        cheque_number: data.cheque_number || null,
        bank_name: data.bank_name || null,
        cheque_date: data.cheque_date || null,
        clearing_status: data.cheque_number ? data.clearing_status || 'pending' : null,
        notes: data.notes || null,
      };

      const res = await paymentsService.create(payload);
      if (res.success && res.data) {
        toast.success(`Payment recorded. Receipt #${res.data.receipt_number}`);
        navigate(`/payments/${encodeId(res.data.id)}`);
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to record payment transaction'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.PAYMENTS)}
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Record Payment</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Issue an official transaction receipt for resident contribution or sponsor funds.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card
          title={
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Payment Allocation & Transaction Details</span>
            </div>
          }
        >
          <div className="space-y-3.5">
            {/* Target Type Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Allocate Payment To <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setTargetType('collection');
                    setValue('payment_target_type', 'collection');
                    setValue('sponsor_id', '');
                  }}
                  className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all text-left ${
                    targetType === 'collection'
                      ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Home className={`w-4 h-4 ${targetType === 'collection' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Flat / Unit Obligation</span>
                    <span className="text-[10px] text-slate-500">Resident event contribution</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetType('sponsor');
                    setValue('payment_target_type', 'sponsor');
                    setValue('event_collection_id', '');
                  }}
                  className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all text-left ${
                    targetType === 'sponsor'
                      ? 'border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Users className={`w-4 h-4 ${targetType === 'sponsor' ? 'text-teal-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-xs text-slate-900 block">Corporate / Patron Sponsor</span>
                    <span className="text-[10px] text-slate-500">Sponsorship pledge installment</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Target Item Dropdown */}
            {targetType === 'collection' ? (
              <Select
                label="Select Collection Obligation"
                requiredIndicator
                placeholder="-- Select Unit Collection --"
                error={errors.event_collection_id?.message}
                {...register('event_collection_id')}
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.flat
                      ? `Flat ${c.flat.flat_number} (${c.flat.floor?.block?.name || 'Block'})`
                      : c.bungalow
                      ? `Bungalow ${c.bungalow.bungalow_number}`
                      : 'Unit'}{' '}
                    &bull; {c.event?.name} (Pending: ₹{c.pending_amount})
                  </option>
                ))}
              </Select>
            ) : (
              <Select
                label="Select Sponsor"
                requiredIndicator
                placeholder="-- Select Sponsor --"
                error={errors.sponsor_id?.message}
                {...register('sponsor_id')}
              >
                {sponsors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.company_name} ({s.event?.name}) &bull; Committed: ₹{s.sponsorship_amount}
                  </option>
                ))}
              </Select>
            )}

            {/* Financial Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Amount Paid (₹)"
                type="number"
                placeholder="e.g. 3000"
                requiredIndicator
                error={errors.amount_paid?.message}
                {...register('amount_paid')}
              />

              <Input
                label="Payment Date"
                type="date"
                requiredIndicator
                error={errors.payment_date?.message}
                {...register('payment_date')}
              />
            </div>

            {/* Payment Method */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Payment Method"
                requiredIndicator
                error={errors.payment_method_id?.message}
                placeholder="-- Select Mode --"
                {...register('payment_method_id', {
                  onChange: (e) => {
                    const found = paymentMethods.find((m) => m.id === e.target.value);
                    if (found) setSelectedMethodCode(found.code);
                  },
                })}
              >
                {paymentMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </Select>

              <Input
                label="Transaction / UPI Reference #"
                placeholder="e.g. UPI-98765432, TXN-0012"
                error={errors.transaction_reference?.message}
                {...register('transaction_reference')}
              />
            </div>

            {/* Conditional Cheque Fields */}
            {(selectedMethodCode === 'CHEQUE' || selectedMethodCode === 'CHQ') && (
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-4">
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Cheque Instrument Specifics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Cheque Number"
                    placeholder="e.g. 000452"
                    requiredIndicator
                    error={errors.cheque_number?.message}
                    {...register('cheque_number')}
                  />
                  <Input
                    label="Bank Name & Branch"
                    placeholder="e.g. HDFC Bank, Andheri East"
                    error={errors.bank_name?.message}
                    {...register('bank_name')}
                  />
                  <Input
                    label="Cheque Date"
                    type="date"
                    error={errors.cheque_date?.message}
                    {...register('cheque_date')}
                  />
                  <Select
                    label="Initial Clearing Status"
                    error={errors.clearing_status?.message}
                    {...register('clearing_status')}
                  >
                    <option value="pending">Pending Clearing</option>
                    <option value="cleared">Cleared</option>
                    <option value="bounced">Bounced / Rejected</option>
                  </Select>
                </div>
              </div>
            )}

            <Textarea
              label="Transaction Notes / Remarks"
              placeholder="e.g. Received via GPay, confirmed by treasurer..."
              rows={2}
              error={errors.notes?.message}
              {...register('notes')}
            />

            {/* Form Actions */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(AppRoutes.PAYMENTS)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Record Payment
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default RecordPaymentPage;
