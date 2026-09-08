import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { activitiesService } from '../../api/activitiesService';
import { EventActivityItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Select from '../../components/ui/Select';
import StatusBadge from '../../components/common/StatusBadge';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { decodeId } from '../../utils/idObfuscator';
import { Plus, Edit2, Trash2, Sparkles, RefreshCw } from 'lucide-react';

interface EventActivitiesPageProps {
  eventId?: string;
}

export const EventActivitiesPage: React.FC<EventActivitiesPageProps> = ({ eventId: propEventId }) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = decodeId(propEventId || routeEventId);
  const toast = useToast();
  const { can } = usePermission();

  const [activities, setActivities] = useState<EventActivityItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventActivityItem | null>(null);
  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');
  const [activityDatetime, setActivityDatetime] = useState('');
  const [vendorPerformer, setVendorPerformer] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState('planned');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<EventActivityItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchActivities = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const res = await activitiesService.listByEvent(eventId, {
        page: meta.page,
        limit: meta.limit,
      });

      if (res.success && res.data) {
        setActivities(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch activities'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [eventId, meta.page, meta.limit]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setActivityName('');
    setDescription('');
    setActivityDatetime('');
    setVendorPerformer('');
    setCost('');
    setStatus('planned');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: EventActivityItem) => {
    setEditingItem(item);
    setActivityName(item.activity_name);
    setDescription(item.description || '');
    setActivityDatetime(item.activity_datetime ? item.activity_datetime.split('T')[0] : '');
    setVendorPerformer(item.vendor_performer || '');
    setCost(item.cost ? String(item.cost) : '');
    setStatus(item.status);
    setNotes(item.notes || '');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityName.trim() || !eventId) {
      toast.warning('Please enter activity name');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        activity_name: activityName,
        description: description || null,
        activity_datetime: activityDatetime || null,
        vendor_performer: vendorPerformer || null,
        cost: cost ? Number(cost) : null,
        status,
        notes: notes || null,
      };

      let res;
      if (editingItem) {
        res = await activitiesService.update(editingItem.id, payload);
      } else {
        res = await activitiesService.createForEvent(eventId, payload);
      }

      if (res.success) {
        toast.success(editingItem ? 'Activity updated.' : 'Activity added.');
        setModalOpen(false);
        fetchActivities();
      } else {
        toast.error(res.message || 'Failed to save activity');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save activity'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await activitiesService.delete(deleteTarget.id);
      if (res.success) {
        toast.success('Activity deleted.');
        setDeleteTarget(null);
        fetchActivities();
      } else {
        toast.error(res.message || 'Failed to delete activity');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete activity'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<EventActivityItem>[] = [
    {
      key: 'activity_name',
      header: 'Activity / Performance',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.activity_name}</span>
          <span className="text-xs text-slate-400">{row.description || '—'}</span>
        </div>
      ),
    },
    {
      key: 'vendor_performer',
      header: 'Performer / Artist / Vendor',
      render: (row) => <span className="text-xs font-medium text-slate-800">{row.vendor_performer || 'Resident Participation'}</span>,
    },
    {
      key: 'cost',
      header: 'Artist / Equipment Cost',
      align: 'right',
      render: (row) => <CurrencyDisplay amount={row.cost} />,
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard permission={Permissions.ACTIVITY_MANAGE}>
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Activity"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Activity"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      <Card
        title="Event Activities & Live Performances"
        subtitle="Band performances, dhol tasha troupes, stage games, and resident cultural programs."
        headerAction={
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchActivities}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <PermissionGuard permission={Permissions.ACTIVITY_MANAGE}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Activity
              </Button>
            </PermissionGuard>
          </div>
        }
      >
        <Table
          columns={columns}
          data={activities}
          isLoading={isLoading}
          emptyText="No activities or performances scheduled for this event."
        />

        <Pagination
          meta={meta}
          onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Event Activity' : 'Add Event Activity / Performance'}
        description="Configure performer details, schedule, and cost estimates."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Activity / Performance Name"
            placeholder="e.g. Dhol Tasha Troupe, Live Fusion Band, Dance Competition"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            requiredIndicator
          />

          <Textarea
            label="Description & Schedule Details"
            placeholder="Performance timing, stage requirements, duration..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Performer / Artist / Vendor Name"
              placeholder="e.g. DJ Harsh, Nashik Dhol Pathak"
              value={vendorPerformer}
              onChange={(e) => setVendorPerformer(e.target.value)}
            />

            <Input
              label="Budget / Cost (₹)"
              type="number"
              placeholder="e.g. 25000"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Activity Date"
              type="date"
              value={activityDatetime}
              onChange={(e) => setActivityDatetime(e.target.value)}
            />

            <Select
              label="Booking Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              requiredIndicator
            >
              <option value="planned">Planned</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingItem ? 'Save Changes' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Activity"
        message={
          <span>
            Are you sure you want to delete <strong>{deleteTarget?.activity_name}</strong>?
          </span>
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventActivitiesPage;
