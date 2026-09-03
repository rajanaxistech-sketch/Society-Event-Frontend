import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collectionsService } from '../../api/collectionsService';
import { eventsService } from '../../api/eventsService';
import { EventCollectionItem, EventItem, PaginationMeta } from '../../types';
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
import { Eye, Plus, RefreshCw, Home, Building2 } from 'lucide-react';

export const CollectionListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [collections, setCollections] = useState<EventCollectionItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    eventsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setEvents(res.data);
    });
  }, []);

  const fetchCollections = async () => {
    try {
      setIsLoading(true);
      const res = await collectionsService.getAll({
        page: meta.page,
        limit: meta.limit,
        eventId: eventFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setCollections(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch collections'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [meta.page, meta.limit, eventFilter, statusFilter, sortBy, sortOrder]);

  const columns: Column<EventCollectionItem>[] = [
    {
      key: 'unit',
      header: 'Residential Unit',
      render: (row) => {
        if (row.flat) {
          return (
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Home className="w-3.5 h-3.5 text-indigo-600" />
              <span>Flat {row.flat.flat_number} ({row.flat.floor?.block?.name || 'Block'})</span>
            </div>
          );
        }
        if (row.bungalow) {
          return (
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Bungalow {row.bungalow.bungalow_number}</span>
            </div>
          );
        }
        return <span className="text-slate-400">—</span>;
      },
    },
    {
      key: 'event',
      header: 'Event',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-800 block">
          {row.event?.name || 'Event Obligation'}
        </span>
      ),
    },
    {
      key: 'expected_amount',
      header: 'Expected (₹)',
      align: 'right',
      render: (row) => (
        <CurrencyDisplay amount={row.expected_amount} className="font-bold text-slate-900" />
      ),
    },
    {
      key: 'amount_paid',
      header: 'Paid (₹)',
      align: 'right',
      render: (row) => <CurrencyDisplay amount={row.amount_paid} trend="positive" />,
    },
    {
      key: 'pending_amount',
      header: 'Pending (₹)',
      align: 'right',
      render: (row) => <CurrencyDisplay amount={row.pending_amount} trend={Number(row.pending_amount) > 0 ? 'negative' : 'neutral'} />,
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
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/collections/${encodeId(row.id)}`)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <PermissionGuard permission={Permissions.PAYMENT_CREATE}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/payments/record?collectionId=${encodeId(row.id)}`)}
            >
              Pay
            </Button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Collections Master</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-event collection obligations, recovery tracking, and outstanding balances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCollections}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs"
            >
              <option value="">All Events</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="partially_paid">Partially Paid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        }
      />

      {/* Table */}
      <Table
        columns={columns}
        data={collections}
        isLoading={isLoading}
        emptyText="No collection obligations found matching the filter criteria."
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
        onRowClick={(row) => navigate(`/collections/${encodeId(row.id)}`)}
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

export default CollectionListPage;
