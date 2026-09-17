import React, { useEffect, useState, useMemo } from 'react';
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
import {
  Plus,
  Edit2,
  Trash2,
  Utensils,
  RefreshCw,
  Sparkles,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  HeartHandshake,
} from 'lucide-react';

interface EventFoodPageProps {
  eventId?: string;
}

const NAVRATRI_FOOD_DAYS = [
  { day: 1, title: 'Day 1: Prasad & Fruits', delicacy: 'Ghee Prasad & Fresh Fruits' },
  { day: 2, title: 'Day 2: Sugar & Sweets', delicacy: 'Peda & Panchamrit' },
  { day: 3, title: 'Day 3: Milk Delicacies', delicacy: 'Kheer & Mawa Barfi' },
  { day: 4, title: 'Day 4: Malpua & Snacks', delicacy: 'Malpua & Farali Khichdi' },
  { day: 5, title: 'Day 5: Banana Prasad', delicacy: 'Banana Halwa & Sabudana Vada' },
  { day: 6, title: 'Day 6: Honey & Sweets', delicacy: 'Honey Dry Fruit Prasad' },
  { day: 7, title: 'Day 7: Jaggery Treats', delicacy: 'Gud Papdi & Dry Fruits' },
  { day: 8, title: 'Day 8: Coconut Feast', delicacy: 'Coconut Ladoo & Kheer' },
  { day: 9, title: 'Day 9: Mahaprasad Feast', delicacy: 'Grand Community Buffet' },
];

export const EventFoodPage: React.FC<EventFoodPageProps> = ({ eventId: propEventId }) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = decodeId(propEventId || routeEventId);
  const toast = useToast();
  const { can, isResident } = usePermission();

  const [foodItems, setFoodItems] = useState<FoodItemEntity[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 30, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayTab, setSelectedDayTab] = useState<number | null>(null);
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');

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
    setDescription(selectedDayTab ? `Day ${selectedDayTab} Prasad / Menu` : '');
    setQuantity('');
    setQuantityUnit('plates');
    setEstimatedCost('');
    setVendorName('');
    setAvailabilityStatus('available');
    setNotes(isResident ? 'Suggested by Resident' : '');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: FoodItemEntity) => {
    setEditingItem(item);
    setName(item.name);
    setDescription(item.description || '');
    setQuantity(item.quantity ? String(item.quantity) : '');
    setQuantityUnit(item.quantity_unit || 'plates');
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
        notes: notes || (isResident ? 'Suggested by Resident' : null),
      };

      let res;
      if (editingItem) {
        res = await foodService.update(editingItem.id, payload);
      } else {
        res = await foodService.createForEvent(eventId, payload);
      }

      if (res.success) {
        toast.success(
          editingItem
            ? 'Food item updated.'
            : isResident
            ? 'Dish suggestion submitted successfully!'
            : 'Food item added to menu.'
        );
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

  // Filtered items based on selected day pill
  const filteredFoodItems = useMemo(() => {
    if (selectedDayTab === null) return foodItems;
    return foodItems.filter((item) => {
      const nameL = item.name.toLowerCase();
      const descL = (item.description || '').toLowerCase();
      const target = `day ${selectedDayTab}`;
      const target2 = `day-${selectedDayTab}`;
      return nameL.includes(target) || nameL.includes(target2) || descL.includes(target) || descL.includes(target2);
    });
  }, [foodItems, selectedDayTab]);

  const columns: Column<FoodItemEntity>[] = useMemo(() => {
    const baseCols: Column<FoodItemEntity>[] = [
      {
        key: 'name',
        header: 'Item Name & Description',
        render: (row) => (
          <div>
            <div className="flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-bold text-slate-900 text-xs">{row.name}</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-0.5">{row.description || '—'}</span>
          </div>
        ),
      },
      {
        key: 'quantity',
        header: 'Planned Quantity',
        render: (row) => (
          <span className="text-xs font-semibold text-slate-700">
            {row.quantity ? `${row.quantity} ${row.quantity_unit || ''}` : '—'}
          </span>
        ),
      },
    ];

    if (!isResident) {
      baseCols.push({
        key: 'estimated_cost',
        header: 'Estimated Cost',
        align: 'right',
        render: (row) => <CurrencyDisplay amount={row.estimated_cost} />,
      });
    }

    baseCols.push({
      key: 'vendor_name',
      header: 'Caterer / Kitchen',
      render: (row) => <span className="text-xs text-slate-600 font-medium">{row.vendor_name || 'Society In-House'}</span>,
    });

    if (!isResident) {
      baseCols.push({
        key: 'actions',
        header: 'Actions',
        align: 'right',
        render: (row) => (
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <PermissionGuard permission={Permissions.FOOD_MANAGE}>
              <button
                type="button"
                onClick={() => handleOpenEditModal(row)}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Edit Item"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(row)}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Delete Item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </PermissionGuard>
          </div>
        ),
      });
    }

    return baseCols;
  }, [isResident]);

  return (
    <div className="space-y-4">
      {/* 9-Day Festival Menu Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-indigo-600" />
            9-Day Festive Menu & Prasad Schedule
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Filter by celebration day</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedDayTab(null)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
              selectedDayTab === null
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Menu Items
          </button>
          {NAVRATRI_FOOD_DAYS.map((d) => {
            const isSelected = selectedDayTab === d.day;
            return (
              <button
                key={d.day}
                type="button"
                onClick={() => setSelectedDayTab(d.day)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>Day {d.day}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {d.delicacy.split('&')[0].trim()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Catering Card */}
      <Card
        title="Event Catering, Prasad & Food Menu"
        subtitle="Explore the 9-day Prasad schedule, live food courses, vendor arrangements, and dish suggestions."
        headerAction={
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher */}
            <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setDisplayMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  displayMode === 'cards'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Cards
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  displayMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Table
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchFoodItems}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              {isResident ? '+ Suggest Dish' : 'Add Food Item'}
            </Button>
          </div>
        }
      >
        {displayMode === 'cards' ? (
          <div className="space-y-4">
            {filteredFoodItems.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {selectedDayTab
                  ? `No menu items or Prasad recorded yet for Day ${selectedDayTab}.`
                  : 'No food items configured for this event.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredFoodItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow"
                  >
                    {/* Header Strip */}
                    <div className="p-3.5 bg-linear-to-r from-amber-50/50 via-white to-orange-50/30 border-b border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          <Utensils className="w-4 h-4" />
                        </div>
                        <span className="font-extrabold text-sm text-slate-900 line-clamp-1">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        {item.availability_status || 'Available'}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-3.5 space-y-2.5">
                      {item.description && (
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {item.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Planned Quantity</span>
                          <span className="font-semibold text-slate-800">
                            {item.quantity ? `${item.quantity} ${item.quantity_unit || 'units'}` : 'Open Buffet'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Caterer / Chef</span>
                          <span className="font-semibold text-slate-800 line-clamp-1">
                            {item.vendor_name || 'In-House Volunteers'}
                          </span>
                        </div>
                      </div>

                      {!isResident && item.estimated_cost && (
                        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Estimated Budget:</span>
                          <CurrencyDisplay amount={item.estimated_cost} className="font-extrabold text-slate-900" />
                        </div>
                      )}

                      {item.notes && (
                        <p className="text-[11px] text-slate-400 italic">Note: {item.notes}</p>
                      )}
                    </div>

                    {/* Admin Actions */}
                    {!isResident && (
                      <div className="px-3.5 py-2 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                        <PermissionGuard permission={Permissions.FOOD_MANAGE}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenEditModal(item)}
                            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                            className="h-7 text-xs text-slate-600 hover:text-indigo-600"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(item)}
                            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                            className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            Delete
                          </Button>
                        </PermissionGuard>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <Table
              columns={columns}
              data={filteredFoodItems}
              isLoading={isLoading}
              emptyText="No food items or menu entries added for this event."
            />

            <Pagination
              meta={meta}
              onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
              onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
            />
          </div>
        )}
      </Card>

      {/* Add / Edit Food Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Food Item' : isResident ? 'Suggest a Dish / Prasad Item' : 'Add Food Item to Menu'}
        description={
          isResident
            ? 'Suggest a delicacy, Prasad item, or fasting dish for the organizing committee to review.'
            : 'Provide food item details, quantities, and vendor estimates.'
        }
        size="lg"
      >
        <form onSubmit={handleSaveFood} className="space-y-4">
          <Input
            label="Dish / Item Name"
            placeholder="e.g. Sabudana Khichdi, Kheer Prasad, Gulab Jamun"
            value={name}
            onChange={(e) => setName(e.target.value)}
            requiredIndicator
          />

          <Textarea
            label="Description & Dietary Info"
            placeholder="e.g. Day 1 Prasad / Pure Ghee / Fasting friendly / Jain option available..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Planned Quantity"
              type="number"
              placeholder="e.g. 500"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <Input
              label="Unit of Measure"
              placeholder="e.g. plates, kg, packets, boxes"
              value={quantityUnit}
              onChange={(e) => setQuantityUnit(e.target.value)}
            />
          </div>

          {!isResident && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Estimated Cost (₹)"
                type="number"
                placeholder="e.g. 15000"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
              />
              <Input
                label="Catering Vendor / Chef Name"
                placeholder="e.g. Royal Caterers"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
              />
            </div>
          )}

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
              {editingItem ? 'Save Changes' : isResident ? 'Submit Suggestion' : 'Add Item'}
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

