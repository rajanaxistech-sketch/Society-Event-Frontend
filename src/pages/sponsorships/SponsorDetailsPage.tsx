import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sponsorshipsService } from '../../api/sponsorshipsService';
import { paymentsService } from '../../api/paymentsService';
import { SponsorItem, PaymentItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table, { Column } from '../../components/ui/Table';
import StatusBadge from '../../components/common/StatusBadge';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import {
  ArrowLeft,
  Users,
  Plus,
  Calendar,
  Building2,
  Mail,
  Phone,
  Eye,
  CreditCard,
} from 'lucide-react';

export const SponsorDetailsPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [sponsor, setSponsor] = useState<SponsorItem | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [spRes, payRes] = await Promise.all([
        sponsorshipsService.getById(id),
        paymentsService.getAll({ sponsorId: id, limit: 50 }).catch(() => ({ success: true, data: [] })),
      ]);

      if (spRes.success && spRes.data) {
        setSponsor(spRes.data);
      } else {
        setError(spRes.message || 'Sponsor record not found');
      }

      if (payRes.data) setPayments(payRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sponsor profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading sponsor profile..." />
      </div>
    );
  }

  if (error || !sponsor) {
    return <ErrorState message={error || 'Sponsor record not found'} onRetry={fetchData} />;
  }

  const paymentColumns: Column<PaymentItem>[] = [
    {
      key: 'receipt_number',
      header: 'Receipt #',
      render: (row) => (
        <span className="font-bold text-slate-900 block hover:text-indigo-600 transition-colors">
          {row.receipt_number}
        </span>
      ),
    },
    {
      key: 'amount_paid',
      header: 'Amount Paid',
      align: 'right',
      render: (row) => <CurrencyDisplay amount={row.amount_paid} className="font-bold text-slate-900" />,
    },
    {
      key: 'payment_method',
      header: 'Mode',
      render: (row) => <span className="text-xs font-semibold text-slate-700">{row.payment_method?.name || 'Cash'}</span>,
    },
    {
      key: 'payment_date',
      header: 'Date',
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.payment_date)}</span>,
    },
    {
      key: 'payment_status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.payment_status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/payments/${encodeId(row.id)}`)}
          className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          title="View Payment Receipt"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/events/${encodeId(sponsor.event_id)}`)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {sponsor.company_name}
              </h1>
              <StatusBadge status={sponsor.payment_status} size="sm" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tier: <span className="font-semibold text-indigo-600">{sponsor.sponsorship_type || 'General Sponsor'}</span> &bull; {sponsor.event?.name}
            </p>
          </div>
        </div>

        <PermissionGuard permission={Permissions.PAYMENT_CREATE}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/payments/record?sponsorId=${encodeId(sponsor.id)}`)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Record Sponsor Payment
          </Button>
        </PermissionGuard>
      </div>

      {/* Financial Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Committed Sponsorship Funding
          </span>
          <CurrencyDisplay
            amount={sponsor.sponsorship_amount}
            className="text-xl font-bold text-slate-900 mt-0.5 block"
          />
        </div>

        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pledge Date
          </span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block">
            {formatDate(sponsor.sponsorship_date)}
          </span>
        </div>
      </div>

      {/* Sponsor Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <Card title="Primary Contact Details">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Contact Person:</span>
              <span className="font-semibold text-slate-900">{sponsor.contact_person || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Phone Number:</span>
              <span className="font-semibold text-slate-900">{sponsor.contact_number || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Email Address:</span>
              <span className="font-semibold text-slate-900">{sponsor.email || '—'}</span>
            </div>
          </div>
        </Card>

        <Card title="Event Association & Notes">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Event:</span>
              <span className="font-semibold text-slate-900">{sponsor.event?.name}</span>
            </div>
            {sponsor.notes && (
              <div className="pt-1.5">
                <span className="text-slate-500 block mb-1 text-[11px]">Deliverables / Notes:</span>
                <p className="text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                  {sponsor.notes}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Payment Receipts History */}
      <Card
        title="Recorded Sponsor Payments"
        subtitle="Receipts credited towards this sponsor pledge."
      >
        <Table
          columns={paymentColumns}
          data={payments}
          emptyText="No payments recorded for this sponsor yet."
          onRowClick={(row) => navigate(`/payments/${encodeId(row.id)}`)}
        />
      </Card>
    </div>
  );
};

export default SponsorDetailsPage;
