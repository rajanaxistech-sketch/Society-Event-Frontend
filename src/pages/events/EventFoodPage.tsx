import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { foodService } from '../../api/foodService';
import { eventsService } from '../../api/eventsService';
import { FoodItemEntity, EventItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { decodeId } from '../../utils/idObfuscator';
import {
  Plus,
  Edit2,
  Trash2,
  Utensils,
  Sparkles,
  Image as ImageIcon,
  Upload,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface EventFoodPageProps {
  eventId?: string;
}

const NAVRATRI_FOOD_DAYS = [
  { day: 1, title: 'Day 1', subtitle: 'Prasad & Fruits', delicacy: 'Pure Ghee Prasad & Fresh Fruits' },
  { day: 2, title: 'Day 2', subtitle: 'Sugar & Sweets', delicacy: 'Peda & Panchamrit' },
  { day: 3, title: 'Day 3', subtitle: 'Milk Delicacies', delicacy: 'Kheer & Mawa Barfi' },
  { day: 4, title: 'Day 4', subtitle: 'Malpua & Snacks', delicacy: 'Malpua & Farali Khichdi' },
  { day: 5, title: 'Day 5', subtitle: 'Banana Prasad', delicacy: 'Banana Halwa & Sabudana Vada' },
  { day: 6, title: 'Day 6', subtitle: 'Honey & Sweets', delicacy: 'Honey Dry Fruit Prasad' },
  { day: 7, title: 'Day 7', subtitle: 'Jaggery Treats', delicacy: 'Gud Papdi & Dry Fruits' },
  { day: 8, title: 'Day 8', subtitle: 'Coconut Feast', delicacy: 'Coconut Ladoo & Kheer' },
  { day: 9, title: 'Day 9', subtitle: 'Mahaprasad Feast', delicacy: 'Grand Community Buffet' },
];

const FOOD_PRESET_IMAGES = [
  {
    name: 'Pure Ghee Prasad',
    url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Kheer & Sweets',
    url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Grand Indian Thali',
    url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Farali Khichdi & Vada',
    url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Fresh Fruits Basket',
    url: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Halwa & Sheera',
    url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Ladoo & Mithai',
    url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80',
  },
  {
    name: 'Masala Chai / Milk',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
  },
];

// Helper to normalize and parse metadata for food items
const parseFoodItem = (item: FoodItemEntity): FoodItemEntity => {
  let imageUrl = item.image_url || null;
  let dayNumber = item.day_number ?? null;
  let cleanNotes = item.notes || '';

  if (item.notes && item.notes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(item.notes);
      if (parsed.image_url) imageUrl = parsed.image_url;
      if (parsed.day_number !== undefined && parsed.day_number !== null) dayNumber = Number(parsed.day_number);
      if (parsed.note !== undefined) cleanNotes = parsed.note;
    } catch (_) {}
  }

  // Auto-infer day number if not set
  if (dayNumber === null) {
    const text = `${item.name} ${item.description || ''} ${item.notes || ''}`.toLowerCase();
    const match = text.match(/day\s*[-:]?\s*([1-9])/i);
    if (match && match[1]) {
      dayNumber = parseInt(match[1], 10);
    }
  }

  return {
    ...item,
    image_url: imageUrl,
    day_number: dayNumber || 1,
    notes: cleanNotes,
  };
};

export const EventFoodPage: React.FC<EventFoodPageProps> = ({ eventId: propEventId }) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = decodeId(propEventId || routeEventId);
  const toast = useToast();
  const { isResident } = usePermission();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItemEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayTab, setSelectedDayTab] = useState<number | null>(1);

  // Modal State - Cleaned & Simplified
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItemEntity | null>(null);
  const [name, setName] = useState('');
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageTab, setImageTab] = useState<'preset' | 'upload' | 'url'>('preset');
  const [isSaving, setIsSaving] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<FoodItemEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (eventId) {
      eventsService
        .getById(eventId)
        .then((res) => {
          if (res.success && res.data) {
            setEvent(res.data);
          }
        })
        .catch(() => {});
    }
  }, [eventId]);

  const isNavratri = event?.is_navratri || event?.name?.toLowerCase().includes('navratri');

  const daysList = useMemo(() => {
    if (isNavratri) return NAVRATRI_FOOD_DAYS;
    if (!event) return [];
    const start = new Date(event.start_date);
    const end = event.end_date ? new Date(event.end_date) : start;
    const diffDays = Math.max(1, Math.round(Math.max(0, end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    if (diffDays <= 1) return [];
    return Array.from({ length: diffDays }, (_, i) => ({
      day: i + 1,
      title: `Day ${i + 1}`,
      subtitle: `Day ${i + 1} Menu`,
      delicacy: `Day ${i + 1} Food Schedule`,
    }));
  }, [event, isNavratri]);

  const fetchFoodItems = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const res = await foodService.listByEvent(eventId, {
        page: 1,
        limit: 100,
      });

      if (res.success && res.data) {
        const parsed = res.data.map(parseFoodItem);
        setFoodItems(parsed);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch food items'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, [eventId]);

  const handleOpenCreateModal = (targetDay?: number) => {
    const dayToUse = targetDay || (selectedDayTab !== null ? selectedDayTab : 1);
    setEditingItem(null);
    setName('');
    setDayNumber(dayToUse);
    setImageUrl(FOOD_PRESET_IMAGES[0]?.url || '');
    setImageTab('preset');
    setModalOpen(true);
  };

  const handleOpenEditModal = (item: FoodItemEntity) => {
    setEditingItem(item);
    setName(item.name);
    setDayNumber(item.day_number || 1);
    setImageUrl(item.image_url || '');
    setImageTab(item.image_url ? (FOOD_PRESET_IMAGES.some(p => p.url === item.image_url) ? 'preset' : 'url') : 'preset');
    setModalOpen(true);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageUrl(reader.result as string);
      toast.success('Image loaded successfully');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !eventId) {
      toast.warning('Please enter food item name');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<FoodItemEntity> = {
        name: name.trim(),
        image_url: imageUrl || null,
        day_number: dayNumber || 1,
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
            ? 'Food item updated successfully.'
            : isResident
            ? 'Dish suggestion submitted for review!'
            : `Food item added for Day ${dayNumber}.`
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
        toast.success('Food item removed from menu.');
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

  // Filtered items based on selected day tab
  const filteredFoodItems = useMemo(() => {
    if (selectedDayTab === null) return foodItems;
    return foodItems.filter((item) => {
      if (item.day_number !== null && item.day_number !== undefined) {
        return item.day_number === selectedDayTab;
      }
      const nameL = item.name.toLowerCase();
      const descL = (item.description || '').toLowerCase();
      const target = `day ${selectedDayTab}`;
      const target2 = `day-${selectedDayTab}`;
      return nameL.includes(target) || nameL.includes(target2) || descL.includes(target) || descL.includes(target2);
    });
  }, [foodItems, selectedDayTab]);

  return (
    <div className="space-y-3">
      {/* 1. Horizontal Day Carousel / Filter Tabs */}
      {daysList.length > 0 && (
        <div className="bg-white p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSelectedDayTab(null)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-1.5 cursor-pointer ${
                selectedDayTab === null
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-slate-900/10'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Days ({foodItems.length})</span>
            </button>

            {daysList.map((d) => {
              const isSelected = selectedDayTab === d.day;
              const countForDay = foodItems.filter(
                (item) => item.day_number === d.day || (!item.day_number && (item.name + ' ' + (item.description || '')).toLowerCase().includes(`day ${d.day}`))
              ).length;

              return (
                <button
                  key={d.day}
                  type="button"
                  onClick={() => setSelectedDayTab(d.day)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-600/20'
                      : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50'
                  }`}
                >
                  <span className="font-extrabold">{d.title}</span>
                  {d.subtitle && (
                    <span
                      className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-lg ${
                        isSelected ? 'bg-indigo-700/80 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {d.subtitle}
                    </span>
                  )}
                  {countForDay > 0 && (
                    <span
                      className={`text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-white text-indigo-700 font-black' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      {countForDay}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Day Header Strip & Minimalist Food Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {selectedDayTab !== null ? `Day ${selectedDayTab} Menu` : 'All Days Menu'} ({filteredFoodItems.length} {filteredFoodItems.length === 1 ? 'dish' : 'dishes'})
          </span>
          <button
            type="button"
            onClick={() => handleOpenCreateModal(selectedDayTab || 1)}
            className="text-xs font-bold text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 border border-indigo-200/80 hover:border-indigo-600 px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isResident ? 'Suggest Dish' : `Add Dish for ${selectedDayTab !== null ? `Day ${selectedDayTab}` : 'Day 1'}`}</span>
          </button>
        </div>

        {filteredFoodItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-2xs">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">
                {selectedDayTab
                  ? `No dishes configured for Day ${selectedDayTab} yet`
                  : 'No food items added for this event'}
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {selectedDayTab
                  ? `Add Prasad or feast items specifically for Day ${selectedDayTab}.`
                  : 'Get started by adding items to the festive food schedule.'}
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleOpenCreateModal(selectedDayTab || 1)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="rounded-xl shadow-xs mx-auto"
            >
              {isResident ? 'Suggest a Dish' : `Add Dish for ${selectedDayTab ? `Day ${selectedDayTab}` : 'Day 1'}`}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFoodItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs p-3 flex items-center gap-3.5 transition-all duration-200 group"
              >
                {/* Left: Food Image Thumbnail */}
                <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 shadow-2xs">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-linear-to-br from-amber-50 via-orange-50 to-rose-50 text-slate-400">
                      <Utensils className="w-6 h-6 text-amber-500/70" />
                    </div>
                  )}

                  {/* Day Badge Overlay */}
                  <div className="absolute bottom-1 left-1 pointer-events-none">
                    <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-white shadow-xs">
                      Day {item.day_number || 1}
                    </span>
                  </div>
                </div>

                {/* Middle: Dish Name & Meta */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-[14.5px] sm:text-[15px] text-slate-900 tracking-tight leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Festive Delicacy • Day {item.day_number || 1}
                  </p>
                </div>

                {/* Right: Actions */}
                {!isResident && (
                  <div className="flex items-center gap-1 shrink-0">
                    <PermissionGuard permission={Permissions.FOOD_MANAGE}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer"
                        title="Edit Dish"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete Dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PermissionGuard>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Add / Edit Food Item Modal - Super Simplified: ONLY Dish Name & Image */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Food Item' : isResident ? 'Suggest Food Item' : `Add Food Item (Day ${dayNumber})`}
        description={`Enter dish name and pick a food photo for Day ${dayNumber}.`}
        size="md"
      >
        <form onSubmit={handleSaveFood} className="space-y-4">
          {/* Dish Name */}
          <Input
            label="Dish / Item Name"
            placeholder="e.g. Pure Ghee Sheera Prasad, Sabudana Khichdi, Gujarati Thali"
            value={name}
            onChange={(e) => setName(e.target.value)}
            requiredIndicator
          />

          {/* Food Image Selection (Presets / Upload / URL) */}
          <div className="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/90">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                Dish Image
              </label>
              <div className="inline-flex p-0.5 bg-slate-200/70 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setImageTab('preset')}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    imageTab === 'preset' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    imageTab === 'upload' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-2.5 py-0.5 rounded-md transition-all cursor-pointer ${
                    imageTab === 'url' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  URL
                </button>
              </div>
            </div>

            {/* Presets Gallery */}
            {imageTab === 'preset' && (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {FOOD_PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`relative rounded-xl overflow-hidden border-2 text-left group transition-all cursor-pointer ${
                      imageUrl === preset.url
                        ? 'border-indigo-600 ring-2 ring-indigo-600/30'
                        : 'border-slate-200 hover:border-slate-300 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-14 object-cover" />
                    <div className="p-1 bg-white/95 text-[10px] font-bold text-slate-800 truncate text-center">
                      {preset.name}
                    </div>
                    {imageUrl === preset.url && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* File Upload */}
            {imageTab === 'upload' && (
              <div className="space-y-2 pt-1">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-2 pb-3">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <p className="text-xs text-slate-600 font-semibold">
                      Click to upload image file
                    </p>
                    <p className="text-[10px] text-slate-400">PNG, JPG or WebP (max. 5MB)</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageFileUpload} />
                </label>
              </div>
            )}

            {/* Custom URL */}
            {imageTab === 'url' && (
              <div className="pt-1">
                <Input
                  placeholder="https://example.com/dish-photo.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            )}

            {/* Image Preview */}
            {imageUrl && (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200/60">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-slate-700 block">Selected Photo Preview</span>
                  <span className="text-[10px] text-slate-400 truncate block">{imageUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-rose-600 hover:underline font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving} className="rounded-xl shadow-xs">
              {editingItem ? 'Save Changes' : isResident ? 'Submit Suggestion' : 'Add Food Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFood}
        title="Remove Food Item"
        message={
          <span>
            Are you sure you want to remove <strong>{deleteTarget?.name}</strong> from the Day {deleteTarget?.day_number || 1} menu?
          </span>
        }
        confirmLabel="Remove Item"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventFoodPage;
