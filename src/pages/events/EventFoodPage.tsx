import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { foodService } from '../../api/foodService';
import { FoodItemEntity, PaginationMeta } from '../../types';
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
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { decodeId } from '../../utils/idObfuscator';
import { Plus, Edit2, Trash2, Utensils, RefreshCw } from 'lucide-react';

interface EventFoodPageProps {
  eventId?: string;
}

export const EventFoodPage: React.FC<EventFoodPageProps> = ({ eventId: propEventId }) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = decodeId(propEventId || routeEventId);
  const toast = useToast();
  const { can } = usePermission();

  const [foodItems, setFoodItems] = useState<FoodItemEntity[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItemEntity | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [quantityUnit, setQuantityUnit] = useState('kg');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<FoodItemEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchFoodItems = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const res = await foodService.listByEvent(eventId, {
        page: meta.page,
        limit: meta.limit,
      });

      if (res.success && res.data) {
        setFoodItems(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch food items'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, [eventId, meta.page, meta.limit]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setQuantity('');
    setQuantityUnit('kg');
    setEstimatedCost('');
    setVendorName('');
    setAvailabilityStatus('available');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: FoodItemEntity) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setQuantity(item.quantity ? String(item.quantity) : '');
    setQuantityUnit(item.quantity_unit || 'kg');
    setEstimatedCost(item.estimated_cost ? String(item.estimated_cost) : '');
    setVendorName(item.vendor_name || '');
    setAvailabilityStatus(item.availability_status || 'available');
    setNotes(item.notes || '');
    setModalOpen(true);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventId) {
      toast.warning('Please enter food item name');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name,
        description: description || null,
        quantity: quantity ? Number(quantity) : null,
        quantity_unit: quantityUnit || null,
        estimated_cost: estimatedCost ? Number(estimatedCost) : null,
        vendor_name: vendorName || null,
        availability_status: availabilityStatus || null,
        notes: notes || null,
      };

      let res;
      if (editingItem) {
        res = await foodService.update(editingItem.id, payload);
      } else {
        res = await foodService.createForEvent(eventId, payload);
      }

      if (res.success) {
        toast.success(editingItem ? 'Food item updated.' : 'Food item added.');
        setModalOpen(false);
        fetchFoodItems();
      } else {
        toast.error(res.message || 'Failed to save food item');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save food item'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFood = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await foodService.delete(deleteTarget.id);
      if (res.success) {
        toast.success('Food item deleted.');
        setDeleteTarget(null);
        fetchFoodItems();
      } else {
        toast.error(res.message || 'Failed to delete food item');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete food item'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<FoodItemEntity>[] = [
    {
      key: 'name',
      header: 'Item Name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block">{row.name}</span>
          <span className="text-xs text-slate-400">{row.description || '—'}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Planned Quantity',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.quantity ? `${row.quantity} ${row.quantity_unit || ''}` : '—'}
        </span>
      ),
    },
    {
      key: 'estimated_cost',
      header: 'Estimated Cost',
      align: 'right',
      render: (row) => <CurrencyDisplay amount={row.estimated_cost} />,
    },
    {
      key: 'vendor_name',
      header: 'Caterer / Vendor',
      render: (row) => <span className="text-xs text-slate-600">{row.vendor_name || 'In-House'}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard permission={Permissions.FOOD_MANAGE}>
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Item"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Item"
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
        title="Event Catering & Food Menu"
        subtitle="Manage food courses, catering vendors, and expense estimates."
        headerAction={
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFoodItems}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <PermissionGuard permission={Permissions.FOOD_MANAGE}>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Food Item
              </Button>
            </PermissionGuard>
          </div>
        }
      >
        <Table
          columns={columns}
          data={foodItems}
          isLoading={isLoading}
          emptyText="No food items or menu entries added for this event."
        />

        <Pagination
          meta={meta}
          onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
        />
      </Card>

      {/* Add / Edit Food Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Food Item' : 'Add Food Item'}
        description="Provide food item details, quantities, and vendor estimates."
        size="lg"
      >
        <form onSubmit={handleSaveFood} className="space-y-4">
          <Input
            label="Dish / Item Name"
            placeholder="e.g. Paneer Tikka, Biryani Buffet, Gulab Jamun"
            value={name}
            onChange={(e) => setName(e.target.value)}
            requiredIndicator
          />

          <Textarea
            label="Description"
            placeholder="Ingredients, dietary notes (Veg/Jain/Non-Veg)..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Quantity"
              type="number"
              placeholder="e.g. 50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Input
              label="Unit of Measure"
              placeholder="e.g. kg, plates, liters, pieces"
              value={quantityUnit}
              onChange={(e) => setQuantityUnit(e.target.value)}
            />
            <Input
              label="Estimated Cost (₹)"
              type="number"
              placeholder="e.g. 15000"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Catering Vendor / Chef Name"
              placeholder="e.g. Royal Caterers"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />

            <Select
              label="Availability Status"
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value)}
            >
              <option value="available">Available / Planned</option>
              <option value="confirmed">Vendor Confirmed</option>
              <option value="unavailable">Unavailable</option>
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
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFood}
        title="Delete Food Item"
        message={
          <span>
            Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from the event menu?
          </span>
        }
        confirmLabel="Delete Item"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventFoodPage;
