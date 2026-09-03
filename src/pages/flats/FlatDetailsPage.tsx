import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { flatsService } from '../../api/flatsService';
import { FlatItem, PersonItem, EventCollectionItem } from '../../types';
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
  Home,
  Users,
  Wallet,
  Crown,
  Edit2,
  Plus,
  Building,
  UserCheck,
} from 'lucide-react';

export const FlatDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [flat, setFlat] = useState<FlatItem | null>(null);
  const [residents, setResidents] = useState<PersonItem[]>([]);
  const [collections, setCollections] = useState<EventCollectionItem[]>([]);
  const [activeTab, setActiveTab] = useState('info');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set Primary Owner Modal
  const [primaryOwnerTarget, setPrimaryOwnerTarget] = useState<PersonItem | null>(null);
  const [isSettingOwner, setIsSettingOwner] = useState(false);

  const fetchFlatDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [flatRes, resRes, colRes] = await Promise.all([
        flatsService.getById(id),
        flatsService.getResidents(id).catch(() => ({ success: true, data: [] })),
        flatsService.getCollections(id).catch(() => ({ success: true, data: [] })),
      ]);

      if (flatRes.success && flatRes.data) {
        setFlat(flatRes.data);
      } else {
        setError(flatRes.message || 'Flat details could not be retrieved');
      }

      if (resRes.data) setResidents(resRes.data);
      if (colRes.data) setCollections(colRes.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch flat details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlatDetails();
  }, [id]);

  const handleSetPrimaryOwner = async () => {
    if (!id || !primaryOwnerTarget) return;
    try {
      setIsSettingOwner(true);
      const res = await flatsService.setPrimaryOwner(id, primaryOwnerTarget.id);
      if (res.success) {
        toast.success(`Primary owner updated to "${primaryOwnerTarget.full_name}".`);
        setPrimaryOwnerTarget(null);
        fetchFlatDetails();
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
        <Spinner size="lg" label="Loading flat records..." />
      </div>
    );
  }

  if (error || !flat) {
    return <ErrorState message={error || 'Flat record not found'} onRetry={fetchFlatDetails} />;
  }

  const tabs: TabItem[] = [
    { id: 'info', label: 'Flat Overview', icon: <Home className="w-4 h-4" /> },
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
          <PermissionGuard permission={Permissions.PRIMARY_OWNER_ASSIGN}>
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
            onClick={() => navigate(AppRoutes.FLATS)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Flats
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Flat {flat.flat_number}
              </h1>
              <StatusBadge status={flat.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {flat.floor?.block?.name || 'Block'} &bull; Floor {flat.floor?.floor_number ?? '—'} &bull; Configuration: {flat.flat_type || 'Standard'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PermissionGuard permission={Permissions.FLAT_UPDATE}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/flats/${id}/edit`)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Flat
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
                <span className="text-slate-500">Flat Number:</span>
                <span className="font-semibold text-slate-900">{flat.flat_number}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Floor Level:</span>
                <span className="font-semibold text-slate-900">
                  Floor {flat.floor?.floor_number} {flat.floor?.name ? `(${flat.floor.name})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Block / Tower:</span>
                <span className="font-semibold text-slate-900">{flat.floor?.block?.name || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Flat Type:</span>
                <span className="font-semibold text-slate-900">{flat.flat_type || 'Standard'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Registered On:</span>
                <span className="font-semibold text-slate-900">{formatDate(flat.created_at)}</span>
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
                <Users className="w-8 h-8 text-indigo-600 opacity-70" />
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
          subtitle="All persons registered as living in or owning this unit."
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
            emptyText="No residents registered for this flat yet."
          />
        </Card>
      )}

      {/* Tab 3: Collections */}
      {activeTab === 'collections' && (
        <Card
          title="Collection Obligations"
          subtitle="Historical and pending event collection records for this flat."
        >
          <Table
            columns={collectionColumns}
            data={collections}
            emptyText="No event collection obligations assigned to this flat."
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
            Are you sure you want to designate <strong>{primaryOwnerTarget?.full_name}</strong> as the primary owner of <strong>Flat {flat.flat_number}</strong>? Any previously designated owner will be superseded.
          </span>
        }
        confirmLabel="Assign Primary Owner"
        variant="primary"
        isLoading={isSettingOwner}
      />
    </div>
  );
};

export default FlatDetailsPage;
