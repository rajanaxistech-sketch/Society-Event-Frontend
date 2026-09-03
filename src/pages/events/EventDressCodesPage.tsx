import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { dressCodesService } from '../../api/dressCodesService';
import { DressCodeItem, PaginationMeta } from '../../types';
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
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { decodeId } from '../../utils/idObfuscator';
import { Plus, Edit2, Trash2, Shirt, RefreshCw } from 'lucide-react';

interface EventDressCodesPageProps {
  eventId?: string;
}

export const EventDressCodesPage: React.FC<EventDressCodesPageProps> = ({ eventId: propEventId }) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = decodeId(propEventId || routeEventId);
  const toast = useToast();
  const { can } = usePermission();

  const [dressCodes, setDressCodes] = useState<DressCodeItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DressCodeItem | null>(null);
  const [category, setCategory] = useState('Traditional / Ethnic');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [status, setStatus] = useState('active');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<DressCodeItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDressCodes = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const res = await dressCodesService.listByEvent(eventId, {
        page: meta.page,
        limit: meta.limit,
      });

      if (res.success && res.data) {
        setDressCodes(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch dress codes'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDressCodes();
  }, [eventId, meta.page, meta.limit]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setCategory('Traditional / Ethnic');
    setDescription('');
    setInstructions('');
    setStatus('active');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: DressCodeItem) => {
    setEditingItem(item);
    setCategory(item.category);
    setDescription(item.description);
    setInstructions(item.instructions || '');
    setStatus(item.status);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category.trim() || !description.trim() || !eventId) {
      toast.warning('Please enter category and description');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        category,
        description,
        instructions: instructions || null,
        status,
      };

      let res;
      if (editingItem) {
        res = await dressCodesService.update(editingItem.id, payload);
      } else {
        res = await dressCodesService.createForEvent(eventId, payload);
      }

      if (res.success) {
        toast.success(editingItem ? 'Dress code updated.' : 'Dress code added.');
        setModalOpen(false);
        fetchDressCodes();
      } else {
        toast.error(res.message || 'Failed to save dress code');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save dress code'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await dressCodesService.delete(deleteTarget.id);
      if (res.success) {
        toast.success('Dress code deleted.');
        setDeleteTarget(null);
        fetchDressCodes();
      } else {
        toast.error(res.message || 'Failed to delete dress code');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete dress code'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<DressCodeItem>[] = [
    {
      key: 'category',
      header: 'Category / Group',
      render: (row) => <span className="font-bold text-slate-900">{row.category}</span>,
    },
    {
      key: 'description',
      header: 'Attire Description',
      render: (row) => <span className="text-slate-800 text-xs">{row.description}</span>,
    },
    {
      key: 'instructions',
      header: 'Special Instructions',
      render: (row) => <span className="text-slate-500 text-xs truncate max-w-xs block">{row.instructions || '—'}</span>,
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
          <PermissionGuard permission={Permissions.DRESS_CODE_MANAGE}>
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Dress Code"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Dress Code"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        title="Event Dress Codes"
        subtitle="Theme colors, traditional dress categories, and attire guidance for residents."
        headerAction={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDressCodes}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <PermissionGuard permission={Permissions.DRESS_CODE_MANAGE}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateModal}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Dress Code
              </Button>
            </PermissionGuard>
          </div>
        }
      >
        <Table
          columns={columns}
          data={dressCodes}
          isLoading={isLoading}
          emptyText="No dress code specifications configured for this event."
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
        title={editingItem ? 'Edit Dress Code' : 'Add Dress Code Specification'}
        description="Provide theme category, dress description, and guidance."
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Category / Attendee Group"
            placeholder="e.g. Men, Women, Children, Grandparents, Theme Colors"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            requiredIndicator
          />

          <Input
            label="Dress Description"
            placeholder="e.g. Kurta Pajama / Sherwani in Royal Blue or Gold"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            requiredIndicator
          />

          <Textarea
            label="Special Instructions (Optional)"
            placeholder="e.g. Traditional accessories encouraged, matching dupattas..."
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            requiredIndicator
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>

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
              {editingItem ? 'Save Changes' : 'Add Dress Code'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Dress Code"
        message={
          <span>
            Are you sure you want to delete the dress code for <strong>{deleteTarget?.category}</strong>?
          </span>
        }
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventDressCodesPage;
