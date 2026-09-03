import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bungalowsService } from '../../api/bungalowsService';
import { BungalowItem, PersonItem, EventCollectionItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Tabs, { TabItem } from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Table, { Column } from '../../components/ui/Table';
import StatusBadge from '../../components/common/StatusBadge';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  ArrowLeft,
  Building2,
  Users,
  Wallet,
  Crown,
  Edit2,
  Plus,
} from 'lucide-react';

export const BungalowDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [bungalow, setBungalow] = useState<BungalowItem | null>(null);
  const [residents, setResidents] = useState<PersonItem[]>([]);
  const [collections, setCollections] = useState<EventCollectionItem[]>([]);
  const [activeTab, setActiveTab] = useState('info');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set Primary Owner Modal
  const [primaryOwnerTarget, setPrimaryOwnerTarget] = useState<PersonItem | null>(null);
  const [isSettingOwner, setIsSettingOwner] = useState(false);

  const fetchBungalowDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [bungRes, resRes, colRes] = await Promise.all([
        bungalowsService.getById(id),
        bungalowsService.getResidents(id).catch(() => ({ success: true, data: [] })),
        bungalowsService.getCollections(id).catch(() => ({ success: true, data: [] })),
      ]);

      if (bungRes.success && bungRes.data) {
        setBungalow(bungRes.data);
      } else {
        setError(bungRes.message || 'Bungalow details could not be retrieved');
      }

      if (resRes.data) setResidents(resRes.data);
      if (colRes.data) setCollections(colRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch bungalow details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBungalowDetails();
  }, [id]);

  const handleSetPrimaryOwner = async () => {
    if (!id || !primaryOwnerTarget) return;
    try {
      setIsSettingOwner(true);
      const res = await bungalowsService.setPrimaryOwner(id, primaryOwnerTarget.id);
      if (res.success) {
        toast.success(`Primary owner assigned to "${primaryOwnerTarget.full_name}".`);
        setPrimaryOwnerTarget(null);
        fetchBungalowDetails();
      } else {
        toast.error(res.message || 'Failed to assign primary owner');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to assign primary owner'));
    } finally {
      setIsSettingOwner(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading bungalow records..." />
      </div>
    );
  }

  if (error || !bungalow) {
    return <ErrorState message={error || 'Bungalow record not found'} onRetry={fetchBungalowDetails} />;
  }

  const tabs: TabItem[] = [
    { id: 'info', label: 'Bungalow Overview', icon: <Building2 className="w-4 h-4" /> },
    { id: 'residents', label: 'Residents', icon: <Users className="w-4 h-4" />, count: residents.length },
    { id: 'collections', label: 'Collections', icon: <Wallet className="w-4 h-4" />, count: collections.length },
  ];

  const residentColumns: Column<PersonItem>[] = [
    {
      key: 'full_name',
      header: 'Resident Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{row.full_name}</span>
          {row.is_primary_owner && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              <Crown className="w-3 h-3 text-amber-600" /> Primary Owner
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact Info',
      render: (row) => (
        <div className="text-xs">
          <span className="text-slate-800 block">{row.phone || 'No phone'}</span>
          <span className="text-slate-400">{row.email || ''}</span>
        </div>
      ),
    },
    {
      key: 'relationship_to_owner',
      header: 'Relation to Owner',
      render: (row) => (
        <span className="text-xs text-slate-600">{row.relationship_to_owner || 'Self / Owner'}</span>
      ),
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
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard permission={Permissions.BUNGALOW_PRIMARY_OWNER_ASSIGN}>
            {!row.is_primary_owner && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPrimaryOwnerTarget(row)}
                leftIcon={<Crown className="w-3.5 h-3.5 text-amber-500" />}
              >
                Set Primary Owner
              </Button>
            )}
          </PermissionGuard>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/residents/${row.id}`)}
          >
            Profile
          </Button>
        </div>
      ),
    },
  ];

  const collectionColumns: Column<EventCollectionItem>[] = [
    {
      key: 'event',
      header: 'Event Name',
      render: (row) => (
        <span className="font-semibold text-slate-900 block">{row.event?.name || 'Event Obligation'}</span>
      ),
    },
    {
      key: 'expected_amount',
      header: 'Expected',
      align: 'right',
      render: (row) => <CurrencyDisplay amount={row.expected_amount} />,
    },
    {
      key: 'amount_paid',
      header: 'Paid',
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
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.BUNGALOWS)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Bungalows
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Bungalow / Villa {bungalow.bungalow_number}
              </h1>
              <StatusBadge status={bungalow.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {bungalow.society?.name || 'Society'} &bull; Type: {bungalow.bungalow_type || 'Independent Villa'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGuard permission={Permissions.BUNGALOW_UPDATE}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/bungalows/${id}/edit`)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Bungalow
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab 1: Info Overview */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Unit Information">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Bungalow Number:</span>
                <span className="font-semibold text-slate-900">{bungalow.bungalow_number}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Society:</span>
                <span className="font-semibold text-slate-900">{bungalow.society?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Bungalow Type:</span>
                <span className="font-semibold text-slate-900">{bungalow.bungalow_type || 'Villa'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Registered On:</span>
                <span className="font-semibold text-slate-900">{formatDate(bungalow.created_at)}</span>
              </div>
            </div>
          </Card>

          <Card title="Occupancy & Ownership Summary">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total Residents</span>
                  <span className="text-2xl font-bold text-slate-900">{residents.length}</span>
                </div>
                <Users className="w-8 h-8 text-teal-600 opacity-70" />
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-xs text-amber-800 font-bold uppercase tracking-wider block mb-1">
                  Primary Owner
                </span>
                {residents.find((r) => r.is_primary_owner) ? (
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-slate-900">
                      {residents.find((r) => r.is_primary_owner)?.full_name}
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-amber-700">
                    No primary owner assigned. Select a resident from the Residents tab to designate.
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Residents */}
      {activeTab === 'residents' && (
        <Card
          title="Occupant Residents"
          subtitle="All persons registered as living in or owning this bungalow."
          headerAction={
            <PermissionGuard permission={Permissions.PERSON_CREATE}>
              <Button
                size="sm"
                variant="primary"
                onClick={() => navigate(AppRoutes.RESIDENT_CREATE)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Resident
              </Button>
            </PermissionGuard>
          }
        >
          <Table
            columns={residentColumns}
            data={residents}
            emptyText="No residents registered for this bungalow yet."
          />
        </Card>
      )}

      {/* Tab 3: Collections */}
      {activeTab === 'collections' && (
        <Card
          title="Collection Obligations"
          subtitle="Historical and pending event collection records for this bungalow."
        >
          <Table
            columns={collectionColumns}
            data={collections}
            emptyText="No event collection obligations assigned to this bungalow."
          />
        </Card>
      )}

      {/* Set Primary Owner Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!primaryOwnerTarget}
        onClose={() => setPrimaryOwnerTarget(null)}
        onConfirm={handleSetPrimaryOwner}
        title="Assign Primary Owner"
        message={
          <span>
            Are you sure you want to designate <strong>{primaryOwnerTarget?.full_name}</strong> as the primary owner of <strong>Bungalow {bungalow.bungalow_number}</strong>?
          </span>
        }
        confirmLabel="Assign Primary Owner"
        variant="primary"
        isLoading={isSettingOwner}
      />
    </div>
  );
};

export default BungalowDetailsPage;
