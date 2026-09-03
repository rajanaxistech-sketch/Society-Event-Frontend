import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collectionsService } from '../../api/collectionsService';
import { paymentsService } from '../../api/paymentsService';
import { EventCollectionItem, PaymentItem } from '../../types';
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
import {
  ArrowLeft,
  Wallet,
  Plus,
  Home,
  Building2,
  Calendar,
  CreditCard,
  Eye,
} from 'lucide-react';

export const CollectionDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [collection, setCollection] = useState<EventCollectionItem | null>(null);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [colRes, payRes] = await Promise.all([
        collectionsService.getById(id),
        paymentsService.getAll({ collectionId: id, limit: 50 }).catch(() => ({ success: true, data: [] })),
      ]);

      if (colRes.success && colRes.data) {
        setCollection(colRes.data);
      } else {
        setError(colRes.message || 'Collection obligation not found');
      }

      if (payRes.data) setPayments(payRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load collection details');
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
        <Spinner size="lg" label="Loading collection obligation..." />
      </div>
    );
  }

  if (error || !collection) {
    return <ErrorState message={error || 'Collection obligation not found'} onRetry={fetchData} />;
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
      header: 'Payment Mode',
      render: (row) => <span className="text-xs font-semibold text-slate-700">{row.payment_method?.name || 'Cash'}</span>,
    },
    {
      key: 'payment_date',
      header: 'Payment Date',
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
          onClick={() => navigate(`/payments/${row.id}`)}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="View Payment Receipt"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.COLLECTIONS)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Collections
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Collection Obligation
              </h1>
              <StatusBadge status={collection.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created on {formatDate(collection.created_at)}
            </p>
          </div>
        </div>

        <PermissionGuard permission={Permissions.PAYMENT_CREATE}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/payments/record?collectionId=${collection.id}`)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Payment Installment
          </Button>
        </PermissionGuard>
      </div>

      {/* Financial Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Expected Fee
          </span>
          <CurrencyDisplay
            amount={collection.expected_amount}
            className="text-2xl font-bold text-slate-900 mt-1 block"
          />
          {collection.custom_amount && (
            <span className="text-[11px] text-amber-600 block mt-0.5">
              Base: {formatDate(collection.default_amount as any)} (Custom Override Applied)
            </span>
          )}
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Paid
          </span>
          <CurrencyDisplay
            amount={collection.amount_paid}
            className="text-2xl font-bold text-emerald-600 mt-1 block"
          />
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Remaining Balance
          </span>
          <CurrencyDisplay
            amount={collection.pending_amount}
            className={`text-2xl font-bold mt-1 block ${
              Number(collection.pending_amount) > 0 ? 'text-rose-600' : 'text-slate-400'
            }`}
          />
        </div>
      </div>

      {/* Unit & Event Context Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Residential Property Unit">
          {collection.flat ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Unit Type:</span>
                <span className="font-semibold text-slate-900">Apartment Flat</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Flat Number:</span>
                <span className="font-semibold text-slate-900">Flat {collection.flat.flat_number}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Block & Floor:</span>
                <span className="font-semibold text-slate-900">
                  {collection.flat.floor?.block?.name || 'Block'} &bull; Floor {collection.flat.floor?.floor_number ?? '—'}
                </span>
              </div>
            </div>
          ) : collection.bungalow ? (
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Unit Type:</span>
                <span className="font-semibold text-slate-900">Bungalow / Villa</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Bungalow Number:</span>
                <span className="font-semibold text-slate-900">Bungalow {collection.bungalow.bungalow_number}</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No unit linked.</p>
          )}
        </Card>

        <Card title="Associated Event">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Event Name:</span>
              <span className="font-semibold text-slate-900">{collection.event?.name || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Event Date:</span>
              <span className="font-semibold text-slate-900">{formatDate(collection.event?.start_date)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Event Status:</span>
              <StatusBadge status={collection.event?.status || 'draft'} size="sm" />
            </div>
          </div>
        </Card>
      </div>

      {/* Payment History Table */}
      <Card
        title="Payment Installments & Transactions"
        subtitle="Receipts recorded against this collection obligation."
      >
        <Table
          columns={paymentColumns}
          data={payments}
          emptyText="No payments recorded for this collection obligation yet."
          onRowClick={(row) => navigate(`/payments/${row.id}`)}
        />
      </Card>
    </div>
  );
};

export default CollectionDetailsPage;
