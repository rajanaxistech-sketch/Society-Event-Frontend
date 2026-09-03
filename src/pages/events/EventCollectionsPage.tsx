import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collectionsService } from '../../api/collectionsService';
import { flatsService } from '../../api/flatsService';
import { bungalowsService } from '../../api/bungalowsService';
import { EventCollectionItem, FlatItem, BungalowItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import StatusBadge from '../../components/common/StatusBadge';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { Plus, Edit2, Wallet, Home, Building2, RefreshCw } from 'lucide-react';

interface EventCollectionsPageProps {
  eventId?: string;
}

export const EventCollectionsPage: React.FC<EventCollectionsPageProps> = ({ eventId: propEventId }) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = propEventId || routeEventId;
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [collections, setCollections] = useState<EventCollectionItem[]>([]);
  const [flats, setFlats] = useState<FlatItem[]>([]);
  const [bungalows, setBungalows] = useState<BungalowItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [unitType, setUnitType] = useState<'flat' | 'bungalow'>('flat');
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [selectedBungalowId, setSelectedBungalowId] = useState('');
  const [defaultAmount, setDefaultAmount] = useState('3000');
  const [customAmount, setCustomAmount] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit Amount Modal
  const [editTarget, setEditTarget] = useState<EventCollectionItem | null>(null);
  const [editCustomAmount, setEditCustomAmount] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    flatsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setFlats(res.data);
    });
    bungalowsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setBungalows(res.data);
    });
  }, []);

  const fetchCollections = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const res = await collectionsService.listByEvent(eventId, {
        page: meta.page,
        limit: meta.limit,
        status: statusFilter || undefined,
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
  }, [eventId, meta.page, meta.limit, statusFilter]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    if (unitType === 'flat' && !selectedFlatId) {
      toast.warning('Please select a flat');
      return;
    }
    if (unitType === 'bungalow' && !selectedBungalowId) {
      toast.warning('Please select a bungalow');
      return;
    }

    try {
      setIsCreating(true);
      const res = await collectionsService.create({
        event_id: eventId,
        flat_id: unitType === 'flat' ? selectedFlatId : null,
        bungalow_id: unitType === 'bungalow' ? selectedBungalowId : null,
        default_amount: Number(defaultAmount) || 3000,
        custom_amount: customAmount ? Number(customAmount) : null,
      });

      if (res.success) {
        toast.success('Collection obligation created successfully.');
        setCreateModalOpen(false);
        setSelectedFlatId('');
        setSelectedBungalowId('');
        setCustomAmount('');
        fetchCollections();
      } else {
        toast.error(res.message || 'Failed to create collection');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create collection obligation'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;

    try {
      setIsUpdating(true);
      const res = await collectionsService.update(editTarget.id, {
        custom_amount: editCustomAmount ? Number(editCustomAmount) : null,
      });

      if (res.success) {
        toast.success('Collection amount updated.');
        setEditTarget(null);
        fetchCollections();
      } else {
        toast.error(res.message || 'Failed to update collection');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update collection'));
    } finally {
      setIsUpdating(false);
    }
  };

  const columns: Column<EventCollectionItem>[] = [
    {
      key: 'unit',
      header: 'Residential Unit',
      render: (row) => {
        if (row.flat) {
          return (
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Home className="w-3.5 h-3.5 text-indigo-600" />
              <span>Flat {row.flat.flat_number} ({row.flat.floor?.block?.name || 'Block'})</span>
            </div>
          );
        }
        if (row.bungalow) {
          return (
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span>Bungalow {row.bungalow.bungalow_number}</span>
            </div>
          );
        }
        return <span className="text-slate-400">—</span>;
      },
    },
    {
      key: 'owner',
      header: 'Primary Resident',
      render: (row) => {
        const owner =
          row.flat?.persons?.find((p) => p.is_primary_owner) ||
          row.flat?.persons?.[0] ||
          row.bungalow?.persons?.find((p) => p.is_primary_owner) ||
          row.bungalow?.persons?.[0];
        return <span className="text-xs text-slate-700">{owner?.full_name || '—'}</span>;
      },
    },
    {
      key: 'expected_amount',
      header: 'Expected Amount',
      align: 'right',
      render: (row) => (
        <div>
          <CurrencyDisplay amount={row.expected_amount} className="font-bold text-slate-900" />
          {row.custom_amount && (
            <span className="text-[10px] text-amber-600 block">Custom Override</span>
          )}
        </div>
      ),
    },
    {
      key: 'amount_paid',
      header: 'Paid Amount',
      align: 'right',
      render: (row) => <CurrencyDisplay amount={row.amount_paid} trend="positive" />,
    },
    {
      key: 'pending_amount',
      header: 'Pending',
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
      key: 'last_payment_date',
      header: 'Last Payment',
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.last_payment_date)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard permission={Permissions.COLLECTION_UPDATE}>
            <button
              type="button"
              onClick={() => {
                setEditTarget(row);
                setEditCustomAmount(row.custom_amount ? String(row.custom_amount) : '');
              }}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Adjust Amount"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.PAYMENT_CREATE}>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/payments/record?collectionId=${row.id}`)}
            >
              Record Payment
            </Button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card
        title="Event Collections Directory"
        subtitle="Individual unit collection obligations and payment tracking."
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCollections}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <PermissionGuard permission={Permissions.COLLECTION_CREATE}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Obligation
              </Button>
            </PermissionGuard>
          </div>
        }
      >
        <FilterBar
          filters={
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
          }
        />

        <Table
          columns={columns}
          data={collections}
          isLoading={isLoading}
          emptyText="No collection obligations registered for this event."
        />

        <Pagination
          meta={meta}
          onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
        />
      </Card>

      {/* Create Obligation Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create Collection Obligation"
        description="Assign a fee contribution obligation to a residential unit."
      >
        <form onSubmit={handleCreateCollection} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">Unit Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUnitType('flat')}
                className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 ${
                  unitType === 'flat' ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-200'
                }`}
              >
                <Home className="w-4 h-4" /> Apartment Flat
              </button>
              <button
                type="button"
                onClick={() => setUnitType('bungalow')}
                className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 ${
                  unitType === 'bungalow' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-200'
                }`}
              >
                <Building2 className="w-4 h-4" /> Bungalow / Villa
              </button>
            </div>
          </div>

          {unitType === 'flat' ? (
            <Select
              label="Select Flat"
              requiredIndicator
              value={selectedFlatId}
              onChange={(e) => setSelectedFlatId(e.target.value)}
              placeholder="-- Select Flat --"
            >
              {flats.map((f) => (
                <option key={f.id} value={f.id}>
                  Flat {f.flat_number} ({f.floor?.block?.name || 'Block'})
                </option>
              ))}
            </Select>
          ) : (
            <Select
              label="Select Bungalow"
              requiredIndicator
              value={selectedBungalowId}
              onChange={(e) => setSelectedBungalowId(e.target.value)}
              placeholder="-- Select Bungalow --"
            >
              {bungalows.map((b) => (
                <option key={b.id} value={b.id}>
                  Bungalow {b.bungalow_number}
                </option>
              ))}
            </Select>
          )}

          <Input
            label="Default Amount (₹)"
            type="number"
            value={defaultAmount}
            onChange={(e) => setDefaultAmount(e.target.value)}
            requiredIndicator
          />

          <Input
            label="Custom Override Amount (₹) (Optional)"
            type="number"
            placeholder="Leave blank to use default amount"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            helperText="If provided, overrides the base expected fee for this specific unit"
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreating}>
              Create Obligation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Amount Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Adjust Collection Amount"
        description="Update the custom expected amount for this unit."
      >
        <form onSubmit={handleUpdateCollection} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Base Default Amount:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(editTarget?.default_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Currently Paid:</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(editTarget?.amount_paid)}</span>
            </div>
          </div>

          <Input
            label="Custom Amount Override (₹)"
            type="number"
            placeholder="e.g. 5000 (leave empty to reset to default)"
            value={editCustomAmount}
            onChange={(e) => setEditCustomAmount(e.target.value)}
          />

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditTarget(null)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUpdating}>
              Update Amount
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventCollectionsPage;
