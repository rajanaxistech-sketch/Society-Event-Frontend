import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentsService } from '../../api/paymentsService';
import { paymentMethodsService } from '../../api/paymentMethodsService';
import { PaymentItem, PaymentMethodItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import Button from '../../components/ui/Button';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId } from '../../utils/idObfuscator';
import { Plus, Eye, RefreshCw, CreditCard, Sliders } from 'lucide-react';

export const PaymentListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [sortBy, setSortBy] = useState('payment_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    paymentMethodsService.getAll().then((res) => {
      if (res.success && res.data) setPaymentMethods(res.data);
    });
  }, []);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const res = await paymentsService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        status: statusFilter || undefined,
        methodId: methodFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setPayments(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch payment records'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [meta.page, meta.limit, statusFilter, methodFilter, sortBy, sortOrder]);

  const columns: Column<PaymentItem>[] = [
    {
      key: 'receipt_number',
      header: 'Receipt #',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 block hover:text-indigo-600 transition-colors">
            {row.receipt_number}
          </span>
          <span className="text-[11px] text-slate-400">Txn: {row.transaction_reference || 'N/A'}</span>
        </div>
      ),
    },
    {
      key: 'payer',
      header: 'Payer / Source',
      render: (row) => {
        if (row.event_collection?.flat) {
          return (
            <span className="text-xs font-semibold text-slate-900">
              Flat {row.event_collection.flat.flat_number}
            </span>
          );
        }
        if (row.event_collection?.bungalow) {
          return (
            <span className="text-xs font-semibold text-slate-900">
              Bungalow {row.event_collection.bungalow.bungalow_number}
            </span>
          );
        }
        if (row.sponsor) {
          return (
            <span className="text-xs font-semibold text-indigo-600">
              Sponsor: {row.sponsor.company_name}
            </span>
          );
        }
        return <span className="text-xs text-slate-500">—</span>;
      },
    },
    {
      key: 'amount_paid',
      header: 'Amount Paid (₹)',
      align: 'right',
      sortable: true,
      render: (row) => <CurrencyDisplay amount={row.amount_paid} className="font-bold text-slate-900" />,
    },
    {
      key: 'payment_method',
      header: 'Mode',
      render: (row) => (
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {row.payment_method?.name || 'Cash'}
        </span>
      ),
    },
    {
      key: 'payment_date',
      header: 'Date',
      sortable: true,
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
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/payments/${encodeId(row.id)}`)}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Receipt"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Payments Ledger</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Audit trail of resident collection contributions and sponsor funds.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <PermissionGuard permission={Permissions.PAYMENT_METHOD_READ}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(AppRoutes.PAYMENT_METHODS)}
              leftIcon={<Sliders className="w-3.5 h-3.5" />}
            >
              Payment Modes
            </Button>
          </PermissionGuard>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchPayments}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <PermissionGuard permission={Permissions.PAYMENT_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.PAYMENT_RECORD)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Record Payment
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          if (!val) {
            setMeta((prev) => ({ ...prev, page: 1 }));
            setTimeout(fetchPayments, 50);
          }
        }}
        searchPlaceholder="Search receipt number or reference..."
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-8 sm:h-9 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Payment Modes</option>
              {paymentMethods.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="h-8 sm:h-9 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending Clearing</option>
              <option value="failed">Failed / Bounced</option>
              <option value="reversed">Reversed</option>
            </select>
          </div>
        }
      />

      {/* Table */}
      <Table
        columns={columns}
        data={payments}
        isLoading={isLoading}
        emptyText="No payments recorded in the ledger."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(field) => {
          if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(field);
            setSortOrder('asc');
          }
        }}
        onRowClick={(row) => navigate(`/payments/${encodeId(row.id)}`)}
      />

      {/* Pagination */}
      <Pagination
        meta={meta}
        onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
      />
    </div>
  );
};

export default PaymentListPage;
