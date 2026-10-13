import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { foodService } from '../../api/foodService';
import { eventsService } from '../../api/eventsService';
import { FoodItemEntity, EventItem, FoodDayMetaInput } from '../../types';
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
import { compressImageFile } from '../../utils/fileHelper';
import {
  Plus,
  Edit2,
  Trash2,
  Camera,
  FolderOpen,
  X,
  ChevronDown,
  Calendar,
  Tag,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

interface EventFoodPageProps {
  eventId?: string;
}

interface DayItemStructure {
  day: number;
  title: string;
  subtitle: string;
  date?: string;
  price?: number | null;
  priceUnit?: string;
  photo?: string | null;
}

const NAVRATRI_FOOD_DAYS: DayItemStructure[] = [
  { day: 1, title: 'Day 1', subtitle: 'Prasad & Fruits' },
  { day: 2, title: 'Day 2', subtitle: 'Sugar & Sweets' },
  { day: 3, title: 'Day 3', subtitle: 'Milk Delicacies' },
  { day: 4, title: 'Day 4', subtitle: 'Malpua & Snacks' },
  { day: 5, title: 'Day 5', subtitle: 'Banana Prasad' },
  { day: 6, title: 'Day 6', subtitle: 'Honey & Sweets' },
  { day: 7, title: 'Day 7', subtitle: 'Jaggery Treats' },
  { day: 8, title: 'Day 8', subtitle: 'Coconut Feast' },
  { day: 9, title: 'Day 9', subtitle: 'Mahaprasad Feast' },
];

const formatDateDisplay = (dateStr?: string | null): string | null => {
  if (!dateStr) return null;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
};

const parseFoodItem = (item: FoodItemEntity): FoodItemEntity => {
  let imageUrl = item.image_url || null;
  let dayNumber = item.day_number ?? null;
  let dayTitle = item.day_title || null;
  let daySubtitle = item.day_subtitle || null;
  let menuDate = item.menu_date || (item.food_datetime ? item.food_datetime.slice(0, 10) : null);
  let dayPrice = item.day_price !== undefined ? item.day_price : null;
  let priceUnit = item.price_unit || 'per plate';
  let cleanNotes = item.notes || '';

  if (item.notes && item.notes.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(item.notes);
      if (parsed.image_url) imageUrl = parsed.image_url;
      if (parsed.day_number !== undefined && parsed.day_number !== null) dayNumber = Number(parsed.day_number);
      if (parsed.dayNumber !== undefined && parsed.dayNumber !== null) dayNumber = Number(parsed.dayNumber);
      if (parsed.day_title) dayTitle = parsed.day_title;
      if (parsed.dayTitle) dayTitle = parsed.dayTitle;
      if (parsed.day_subtitle) daySubtitle = parsed.day_subtitle;
      if (parsed.menu_date) menuDate = parsed.menu_date;
      if (parsed.day_price !== undefined && parsed.day_price !== null) dayPrice = Number(parsed.day_price);
      if (parsed.price_unit) priceUnit = parsed.price_unit;
      if (parsed.note !== undefined) cleanNotes = parsed.note;
    } catch (_) {}
  }

  if (dayNumber === null) {
    const text = `${item.name} ${item.description || ''} ${item.notes || ''}`.toLowerCase();
    const match = text.match(/day\s*[-:]?\s*(\d+)/i);
    if (match && match[1]) {
      dayNumber = parseInt(match[1], 10);
    }
  }

  return {
    ...item,
    image_url: imageUrl,
    day_number: dayNumber || 1,
    day_title: dayTitle,
    day_subtitle: daySubtitle,
    menu_date: menuDate,
    day_price: dayPrice,
    price_unit: priceUnit,
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
  const [isLoading, setIsLoading] = useState(false);
  const [openDayNumber, setOpenDayNumber] = useState<number | null>(1);

  // Day metadata overrides (local cache / state)
  const [dayMetaOverrides, setDayMetaOverrides] = useState<Record<number, Partial<FoodDayMetaInput>>>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<number | null>(null);

  // Add / Edit Day Modal
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [isEditingDay, setIsEditingDay] = useState(false);
  const [dayForm, setDayForm] = useState<{
    dayNumber: number;
    dayTitle: string;
    daySubtitle: string;
    menuDate: string;
    dayPrice: string;
    priceUnit: string;
  }>({
    dayNumber: 1,
    dayTitle: '',
    daySubtitle: '',
    menuDate: '',
    dayPrice: '',
    priceUnit: 'per plate',
  });
  const [isSavingDay, setIsSavingDay] = useState(false);

  // Delete Day Target
  const [deleteDayTarget, setDeleteDayTarget] = useState<number | null>(null);
  const [isDeletingDay, setIsDeletingDay] = useState(false);

  // Batch Multi-Add Modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchDayNumber, setBatchDayNumber] = useState<number>(1);
  const [batchItems, setBatchItems] = useState<string[]>([]);
  const [currentBatchInput, setCurrentBatchInput] = useState('');
  const [batchPasteMode, setBatchPasteMode] = useState(false);
  const [batchPasteText, setBatchPasteText] = useState('');
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Inline Quick Add per day
  const [inlineDishInputs, setInlineDishInputs] = useState<Record<number, string>>({});
  const [addingInlineForDay, setAddingInlineForDay] = useState<number | null>(null);

  // Single Edit Dish Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItemEntity | null>(null);
  const [editName, setEditName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Single Delete Dish State
  const [deleteTarget, setDeleteTarget] = useState<FoodItemEntity | null>(null);
  const [isDeletingDish, setIsDeletingDish] = useState(false);

  // Hidden File Inputs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadDay, setActiveUploadDay] = useState<number>(1);

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

  const isNavratri = Boolean(event?.is_navratri || event?.name?.toLowerCase().includes('navratri'));

  const fetchFoodItems = async () => {
    if (!eventId) return;
    try {
      setIsLoading(true);
      const res = await foodService.listByEvent(eventId, { page: 1, limit: 300 });
      if (res.success && res.data) {
        setFoodItems(res.data.map(parseFoodItem));
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

  // Aggregate dynamic days list
  const daysList: DayItemStructure[] = useMemo(() => {
    const dayMap = new Map<number, DayItemStructure>();

    // 1. Initial base template days
    if (isNavratri) {
      NAVRATRI_FOOD_DAYS.forEach((d) => {
        dayMap.set(d.day, { ...d });
      });
    } else if (event) {
      const start = new Date(event.start_date);
      const end = event.end_date ? new Date(event.end_date) : start;
      const diffDays = Math.max(1, Math.round(Math.max(0, end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
      for (let i = 1; i <= diffDays; i++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + (i - 1));
        dayMap.set(i, {
          day: i,
          title: `Day ${i}`,
          subtitle: `Day ${i} Menu`,
          date: currentDate.toISOString().slice(0, 10),
        });
      }
    }

    // 2. Discover days from loaded food items
    foodItems.forEach((item) => {
      const d = item.day_number || 1;
      const existing = dayMap.get(d) || {
        day: d,
        title: item.day_title || `Day ${d}`,
        subtitle: item.day_subtitle || `Day ${d} Menu`,
      };

      if (item.day_title) existing.title = item.day_title;
      if (item.day_subtitle) existing.subtitle = item.day_subtitle;
      if (item.menu_date) existing.date = item.menu_date;
      if (item.day_price !== undefined && item.day_price !== null) existing.price = item.day_price;
      if (item.price_unit) existing.priceUnit = item.price_unit;
      if (item.image_url) existing.photo = item.image_url;

      dayMap.set(d, existing);
    });

    // 3. Apply local overrides
    Object.entries(dayMetaOverrides).forEach(([dayStr, meta]) => {
      const d = Number(dayStr);
      const current = dayMap.get(d) || {
        day: d,
        title: `Day ${d}`,
        subtitle: `Day ${d} Menu`,
      };
      if (meta.day_title) current.title = meta.day_title;
      if (meta.day_subtitle !== undefined) current.subtitle = meta.day_subtitle;
      if (meta.menu_date !== undefined) current.date = meta.menu_date;
      if (meta.day_price !== undefined) current.price = meta.day_price;
      if (meta.price_unit !== undefined) current.priceUnit = meta.price_unit;
      if (meta.image_url !== undefined) current.photo = meta.image_url;
      dayMap.set(d, current);
    });

    if (dayMap.size === 0) {
      dayMap.set(1, { day: 1, title: 'Day 1', subtitle: 'Day 1 Menu' });
    }

    return Array.from(dayMap.values()).sort((a, b) => a.day - b.day);
  }, [event, isNavratri, foodItems, dayMetaOverrides]);

  // Auto-open first or today's day if none is opened yet
  useEffect(() => {
    if (daysList.length > 0) {
      setOpenDayNumber((prev) => {
        if (prev !== null && daysList.some((d) => d.day === prev)) return prev;
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayDay = daysList.find((d) => d.date === todayStr);
        return todayDay ? todayDay.day : daysList[0].day;
      });
    }
  }, [daysList]);

  // Exclusive Accordion: opening a day closes all other days
  const toggleDayAccordion = (dayNum: number) => {
    setOpenDayNumber((prev) => (prev === dayNum ? null : dayNum));
  };

  const getDishesForDay = (dayNum: number) => {
    return foodItems.filter((item) => {
      if (item.day_number !== null && item.day_number !== undefined) {
        return item.day_number === dayNum;
      }
      const nameL = item.name.toLowerCase();
      const descL = (item.description || '').toLowerCase();
      const target = `day ${dayNum}`;
      const target2 = `day-${dayNum}`;
      return nameL.includes(target) || nameL.includes(target2) || descL.includes(target) || descL.includes(target2);
    });
  };

  // Photo handlers
  const handleProcessImageFile = async (file: File, targetDay: number) => {
    if (!file.type.startsWith('image/')) {
      toast.warning('Please select a valid image file');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.warning('Image size must be less than 15MB');
      return;
    }

    try {
      setIsUploadingPhoto(targetDay);
      const compressedDataUrl = await compressImageFile(file, 900, 600, 0.8);
      setDayMetaOverrides((prev) => ({
        ...prev,
        [targetDay]: { ...prev[targetDay], image_url: compressedDataUrl },
      }));

      if (eventId) {
        await foodService.updateDayMeta(eventId, targetDay, {
          image_url: compressedDataUrl,
        });
        fetchFoodItems();
      }
      toast.success(`Photo set for Day ${targetDay}`);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to process image'));
    } finally {
      setIsUploadingPhoto(null);
    }
  };

  const triggerCamera = (day: number) => {
    setActiveUploadDay(day);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  const triggerGallery = (day: number) => {
    setActiveUploadDay(day);
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
      galleryInputRef.current.click();
    }
  };

  const handleRemoveDayPhoto = async (targetDay: number) => {
    try {
      setIsUploadingPhoto(targetDay);
      setDayMetaOverrides((prev) => ({
        ...prev,
        [targetDay]: { ...prev[targetDay], image_url: null },
      }));

      if (eventId) {
        await foodService.updateDayMeta(eventId, targetDay, {
          image_url: null,
        });
        toast.success(`Photo removed for Day ${targetDay}`);
        fetchFoodItems();
      }
    } catch (err) {
      toast.error('Failed to remove photo');
    } finally {
      setIsUploadingPhoto(null);
    }
  };

  // Open "Add Day" modal
  const handleOpenAddDayModal = () => {
    const nextDayNum = daysList.length > 0 ? Math.max(...daysList.map((d) => d.day)) + 1 : 1;
    let suggestedDate = '';
    if (event?.start_date) {
      const d = new Date(event.start_date);
      d.setDate(d.getDate() + (nextDayNum - 1));
      suggestedDate = d.toISOString().slice(0, 10);
    } else {
      suggestedDate = new Date().toISOString().slice(0, 10);
    }

    setDayForm({
      dayNumber: nextDayNum,
      dayTitle: `Day ${nextDayNum}`,
      daySubtitle: '',
      menuDate: suggestedDate,
      dayPrice: '',
      priceUnit: 'per plate',
    });
    setIsEditingDay(false);
    setDayModalOpen(true);
  };

  // Open "Edit Day Info" modal
  const handleOpenEditDayModal = (targetDayMeta: DayItemStructure) => {
    setDayForm({
      dayNumber: targetDayMeta.day,
      dayTitle: targetDayMeta.title || `Day ${targetDayMeta.day}`,
      daySubtitle: targetDayMeta.subtitle || '',
      menuDate: targetDayMeta.date || '',
      dayPrice: targetDayMeta.price !== undefined && targetDayMeta.price !== null ? String(targetDayMeta.price) : '',
      priceUnit: targetDayMeta.priceUnit || 'per plate',
    });
    setIsEditingDay(true);
    setDayModalOpen(true);
  };

  // Save Day (Add or Edit)
  const handleSaveDayForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    try {
      setIsSavingDay(true);
      const parsedPrice = dayForm.dayPrice.trim() ? parseFloat(dayForm.dayPrice) : null;

      const payload: FoodDayMetaInput = {
        day_number: dayForm.dayNumber,
        day_title: dayForm.dayTitle.trim() || `Day ${dayForm.dayNumber}`,
        day_subtitle: dayForm.daySubtitle.trim() || undefined,
        menu_date: dayForm.menuDate || undefined,
        day_price: isNaN(parsedPrice as number) ? null : parsedPrice,
        price_unit: dayForm.priceUnit || 'per plate',
      };

      await foodService.updateDayMeta(eventId, dayForm.dayNumber, payload);

      setDayMetaOverrides((prev) => ({
        ...prev,
        [dayForm.dayNumber]: payload,
      }));

      toast.success(isEditingDay ? `Day ${dayForm.dayNumber} updated` : `Day ${dayForm.dayNumber} added successfully`);
      setDayModalOpen(false);
      setOpenDayNumber(dayForm.dayNumber);
      await fetchFoodItems();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save day'));
    } finally {
      setIsSavingDay(false);
    }
  };

  // Delete Day Confirmation
  const handleDeleteDay = async () => {
    if (!eventId || deleteDayTarget === null) return;
    try {
      setIsDeletingDay(true);
      await foodService.deleteDay(eventId, deleteDayTarget);
      toast.success(`Day ${deleteDayTarget} deleted`);
      const removedDay = deleteDayTarget;
      setDeleteDayTarget(null);
      setOpenDayNumber((prev) => {
        if (prev === removedDay) {
          const remaining = daysList.filter((d) => d.day !== removedDay);
          return remaining.length > 0 ? remaining[0].day : null;
        }
        return prev;
      });
      await fetchFoodItems();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete day'));
    } finally {
      setIsDeletingDay(false);
    }
  };

  // Batch Multi-Add Modal
  const handleOpenBatchModal = (targetDay?: number) => {
    const d = targetDay || (daysList.length > 0 ? daysList[0].day : 1);
    setBatchDayNumber(d);
    setBatchItems([]);
    setCurrentBatchInput('');
    setBatchPasteText('');
    setBatchPasteMode(false);
    setBatchModalOpen(true);
  };

  const handleAddBatchItemFromInput = () => {
    const trimmed = currentBatchInput.trim();
    if (!trimmed) return;
    const itemsToAdd = trimmed.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
    setBatchItems((prev) => [...prev, ...itemsToAdd]);
    setCurrentBatchInput('');
  };

  const handleRemoveBatchItem = (index: number) => {
    setBatchItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPasteText = () => {
    if (!batchPasteText.trim()) return;
    const lines = batchPasteText.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    if (lines.length > 0) {
      setBatchItems((prev) => [...prev, ...lines]);
      setBatchPasteText('');
      setBatchPasteMode(false);
    }
  };

  const handleSaveBatchItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    let finalItems = [...batchItems];
    if (currentBatchInput.trim()) {
      const extra = currentBatchInput.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
      finalItems = [...finalItems, ...extra];
    }

    if (finalItems.length === 0) {
      toast.warning('Please enter dish name');
      return;
    }

    try {
      setIsSavingBatch(true);
      const targetMeta = daysList.find((d) => d.day === batchDayNumber);

      await Promise.all(
        finalItems.map((itemName) =>
          foodService.createForEvent(eventId, {
            name: itemName,
            day_number: batchDayNumber,
            day_title: targetMeta?.title,
            day_subtitle: targetMeta?.subtitle,
            menu_date: targetMeta?.date,
            day_price: targetMeta?.price,
            price_unit: targetMeta?.priceUnit,
            image_url: targetMeta?.photo || undefined,
          })
        )
      );

      toast.success(`${finalItems.length} dishes saved for Day ${batchDayNumber}`);
      setBatchModalOpen(false);
      setOpenDayNumber(batchDayNumber);
      await fetchFoodItems();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save dishes'));
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Inline Quick Add for specific day
  const handleInlineQuickAddForDay = async (dayNumber: number, e: React.FormEvent) => {
    e.preventDefault();
    const name = (inlineDishInputs[dayNumber] || '').trim();
    if (!name || !eventId) return;

    const targetMeta = daysList.find((d) => d.day === dayNumber);

    try {
      setAddingInlineForDay(dayNumber);
      const res = await foodService.createForEvent(eventId, {
        name,
        day_number: dayNumber,
        day_title: targetMeta?.title,
        day_subtitle: targetMeta?.subtitle,
        menu_date: targetMeta?.date,
        day_price: targetMeta?.price,
        price_unit: targetMeta?.priceUnit,
        image_url: targetMeta?.photo || undefined,
      });

      if (res.success) {
        setInlineDishInputs((prev) => ({ ...prev, [dayNumber]: '' }));
        await fetchFoodItems();
      } else {
        toast.error(res.message || 'Failed to add dish');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to add dish'));
    } finally {
      setAddingInlineForDay(null);
    }
  };

  // Single Dish Edit
  const handleOpenEditModal = (item: FoodItemEntity) => {
    setEditingItem(item);
    setEditName(item.name);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editName.trim()) return;

    try {
      setIsSavingEdit(true);
      const res = await foodService.update(editingItem.id, {
        name: editName.trim(),
        day_number: editingItem.day_number,
      });

      if (res.success) {
        toast.success('Dish updated');
        setEditModalOpen(false);
        await fetchFoodItems();
      } else {
        toast.error(res.message || 'Failed to update dish');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update dish'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Single Dish Delete
  const handleDeleteFood = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeletingDish(true);
      const res = await foodService.delete(deleteTarget.id);
      if (res.success) {
        toast.success('Dish removed');
        setDeleteTarget(null);
        await fetchFoodItems();
      } else {
        toast.error(res.message || 'Failed to delete dish');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete dish'));
    } finally {
      setIsDeletingDish(false);
    }
  };

  return (
    <div className="space-y-3 pb-8">
      {/* Hidden File Inputs for Camera and Gallery */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleProcessImageFile(file, activeUploadDay);
        }}
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleProcessImageFile(file, activeUploadDay);
        }}
      />

      {/* Sleek Minimalist Page Header */}
      <div className="flex items-center justify-between gap-2 px-1 py-1">
        {/* Title & Badges */}
        <div className="flex items-center gap-1.5 min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
            Food Menu
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80 shrink-0">
            {daysList.length} {daysList.length === 1 ? 'Day' : 'Days'}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
            {foodItems.length} {foodItems.length === 1 ? 'Dish' : 'Dishes'}
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchFoodItems}
            disabled={isLoading}
            className="p-1.5 text-slate-500 bg-white border border-slate-200/80 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh Food Menu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Add Day Button */}
          {!isResident && (
            <PermissionGuard permission={Permissions.FOOD_MANAGE}>
              <button
                type="button"
                onClick={handleOpenAddDayModal}
                className="flex items-center gap-1 px-2.5 sm:px-3 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-2xs transition-all cursor-pointer"
                title="Add Day"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Day</span>
              </button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* ACCORDION LIST: ALL DAYS EXPANDABLE / COLLAPSIBLE */}
      <div className="space-y-2.5">
        {daysList.length === 0 ? (
          <div className="py-10 text-center bg-white rounded-2xl border border-slate-200/80 p-6 space-y-2 shadow-2xs">
            <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">No menu days configured yet</p>
            <p className="text-xs text-slate-400">Click &ldquo;+ Add Day&rdquo; above to set up daily food menus.</p>
          </div>
        ) : (
          daysList.map((d) => {
            const isOpen = openDayNumber === d.day;
            const dayDishes = getDishesForDay(d.day);

            return (
              <div
                key={d.day}
                className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-2xs ${
                  isOpen
                    ? 'border-indigo-200 ring-2 ring-indigo-500/10 shadow-xs'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* ACCORDION HEADER / TRIGGER */}
                <div
                  onClick={() => toggleDayAccordion(d.day)}
                  className="w-full p-3 sm:p-3.5 flex items-center justify-between gap-2.5 cursor-pointer select-none transition-colors hover:bg-slate-50/70"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Day Number Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-colors ${
                        isOpen
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-100/80'
                      }`}
                    >
                      {d.day}
                    </div>

                    {/* Titles and Metadata Chips */}
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[14px] sm:text-[15px] font-bold text-slate-900 tracking-tight">
                          Day {d.day}
                        </span>
                        {d.subtitle && (
                          <span className="text-xs font-semibold text-indigo-600 truncate">
                            • {d.subtitle}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
                        {d.date && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {formatDateDisplay(d.date)}
                          </span>
                        )}

                        {d.price !== undefined && d.price !== null ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold">
                            <Tag className="w-3 h-3 text-emerald-600" />
                            ₹{d.price} <span className="font-normal opacity-85">({d.priceUnit || 'per plate'})</span>
                          </span>
                        ) : null}

                        <span className="px-1.5 py-0.5 rounded-md bg-slate-100/80 text-slate-500 font-medium text-[10.5px]">
                          {dayDishes.length} {dayDishes.length === 1 ? 'dish' : 'dishes'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header Right: Admin quick actions + Accordion toggle chevron */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isResident && (
                      <PermissionGuard permission={Permissions.FOOD_MANAGE}>
                        <div
                          className="flex items-center gap-0.5 sm:gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEditDayModal(d)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Day Details & Price"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => triggerGallery(d.day)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Upload Day Photo"
                          >
                            <Camera className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteDayTarget(d.day)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Day"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </PermissionGuard>
                    )}

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-indigo-600' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* ACCORDION BODY (WHEN OPEN) */}
                {isOpen && (
                  <div className="border-t border-slate-100 bg-slate-50/50 p-3 sm:p-3.5 space-y-3">
                    {/* Day Photo Banner if uploaded */}
                    {d.photo && (
                      <div className="relative h-36 sm:h-44 w-full rounded-xl overflow-hidden bg-slate-900 shadow-2xs group">
                        <img
                          src={d.photo}
                          alt={d.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        <div className="absolute bottom-2.5 left-3 right-3 text-white flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold">{d.title}</p>
                            {d.subtitle && <p className="text-[11px] text-slate-200">{d.subtitle}</p>}
                          </div>
                        </div>

                        {!isResident && (
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <PermissionGuard permission={Permissions.FOOD_MANAGE}>
                              <button
                                type="button"
                                onClick={() => triggerCamera(d.day)}
                                className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs text-[11px] cursor-pointer"
                                title="Camera"
                              >
                                <Camera className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => triggerGallery(d.day)}
                                className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs text-[11px] cursor-pointer"
                                title="Gallery"
                              >
                                <FolderOpen className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveDayPhoto(d.day)}
                                className="p-1.5 rounded-lg bg-black/50 hover:bg-rose-600 text-white backdrop-blur-xs text-[11px] cursor-pointer"
                                title="Remove Photo"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </PermissionGuard>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Subheader: Day X Menu & + Add Dishes */}
                    <div className="flex items-center justify-between px-0.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Day {d.day} Menu ({dayDishes.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenBatchModal(d.day)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isResident ? 'Suggest' : 'Add Dishes'}</span>
                      </button>
                    </div>

                    {/* Dishes List */}
                    {dayDishes.length === 0 ? (
                      <div className="py-5 text-center bg-white rounded-xl border border-dashed border-slate-200/90 p-3 space-y-1">
                        <Sparkles className="w-4 h-4 text-indigo-400 mx-auto" />
                        <p className="text-xs font-semibold text-slate-700">No dishes listed for Day {d.day}</p>
                        <p className="text-[11px] text-slate-400">Quick add dishes below or use Add Dishes above.</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {dayDishes.map((item, index) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border border-slate-200/80 p-2.5 flex items-center justify-between gap-2.5 transition-colors group hover:border-slate-300 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                                {index + 1}
                              </span>
                              <span className="text-[13px] sm:text-[13.5px] font-semibold text-slate-800 tracking-tight truncate">
                                {item.name}
                              </span>
                            </div>

                            {!isResident && (
                              <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                                <PermissionGuard permission={Permissions.FOOD_MANAGE}>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(item)}
                                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md transition-colors cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(item)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                                    title="Remove"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </PermissionGuard>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Quick Add Bar for this Day */}
                    {!isResident && (
                      <form onSubmit={(e) => handleInlineQuickAddForDay(d.day, e)} className="pt-0.5">
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200/80 focus-within:border-indigo-500 shadow-2xs transition-colors">
                          <input
                            type="text"
                            placeholder={`+ Quick add dish for Day ${d.day}...`}
                            value={inlineDishInputs[d.day] || ''}
                            onChange={(e) =>
                              setInlineDishInputs((prev) => ({ ...prev, [d.day]: e.target.value }))
                            }
                            className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent border-0 focus:outline-hidden py-1"
                          />
                          <button
                            type="submit"
                            disabled={!(inlineDishInputs[d.day] || '').trim() || addingInlineForDay === d.day}
                            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer shadow-xs"
                          >
                            {addingInlineForDay === d.day ? '...' : 'Add'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ADD / EDIT DAY MODAL */}
      <Modal
        isOpen={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        title={isEditingDay ? `Edit Day ${dayForm.dayNumber}` : `Add New Day`}
        description="Configure date, theme, and full menu pricing for this day."
        size="md"
      >
        <form onSubmit={handleSaveDayForm} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Day Number"
              type="number"
              min={1}
              value={dayForm.dayNumber}
              onChange={(e) => setDayForm({ ...dayForm, dayNumber: parseInt(e.target.value, 10) || 1 })}
              requiredIndicator
              disabled={isEditingDay}
            />
            <Input
              label="Menu Date"
              type="date"
              value={dayForm.menuDate}
              onChange={(e) => setDayForm({ ...dayForm, menuDate: e.target.value })}
              requiredIndicator
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <Input
              label="Day Title"
              placeholder="e.g. Day 5"
              value={dayForm.dayTitle}
              onChange={(e) => setDayForm({ ...dayForm, dayTitle: e.target.value })}
              requiredIndicator
            />
            <Input
              label="Theme / Subtitle"
              placeholder="e.g. Fafda & Jalebi"
              value={dayForm.daySubtitle}
              onChange={(e) => setDayForm({ ...dayForm, daySubtitle: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Whole Menu Price (₹)"
              type="number"
              min={0}
              placeholder="e.g. 250"
              value={dayForm.dayPrice}
              onChange={(e) => setDayForm({ ...dayForm, dayPrice: e.target.value })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Price Unit / Type</label>
              <select
                value={dayForm.priceUnit}
                onChange={(e) => setDayForm({ ...dayForm, priceUnit: e.target.value })}
                className="w-full text-xs h-9 px-2.5 bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="per plate">per plate</option>
                <option value="per person">per person</option>
                <option value="per flat">per flat</option>
                <option value="total menu">total package / budget</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDayModalOpen(false)}
              disabled={isSavingDay}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingDay}
              className="rounded-xl shadow-xs"
            >
              {isEditingDay ? 'Save Changes' : 'Create Day'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE DAY CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={deleteDayTarget !== null}
        onClose={() => setDeleteDayTarget(null)}
        onConfirm={handleDeleteDay}
        title="Delete Day"
        message={
          <span>
            Are you sure you want to delete <strong>Day {deleteDayTarget}</strong> and all of its dishes? This action cannot be undone.
          </span>
        }
        confirmLabel="Delete Day"
        variant="danger"
        isLoading={isDeletingDay}
      />

      {/* BATCH ADD DISHES MODAL */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        title={isResident ? 'Suggest Dishes' : `Add Dishes (Day ${batchDayNumber})`}
        description="Add multiple items at once."
        size="sm"
      >
        <form onSubmit={handleSaveBatchItems} className="space-y-3">
          {/* Day Selector */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {daysList.map((d) => (
              <button
                key={d.day}
                type="button"
                onClick={() => setBatchDayNumber(d.day)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 cursor-pointer ${
                  batchDayNumber === d.day
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Day {d.day}
              </button>
            ))}
          </div>

          {/* Dishes Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Items ({batchItems.length})</span>
              <button
                type="button"
                onClick={() => setBatchPasteMode(!batchPasteMode)}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                {batchPasteMode ? 'Single Input' : 'Paste List'}
              </button>
            </div>

            {batchPasteMode ? (
              <div className="space-y-1.5">
                <textarea
                  rows={3}
                  placeholder="Paste dishes here (separated by new line or comma)"
                  value={batchPasteText}
                  onChange={(e) => setBatchPasteText(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleApplyPasteText}
                  className="w-full py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                >
                  Convert to Items
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Input
                  placeholder="Type dish & press Enter..."
                  value={currentBatchInput}
                  onChange={(e) => setCurrentBatchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBatchItemFromInput();
                    }
                  }}
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddBatchItemFromInput}
                  className="rounded-xl shrink-0 h-9 px-2.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}

            {/* Chips List */}
            {batchItems.length > 0 && (
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                {batchItems.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white rounded-md border border-slate-200 text-xs font-medium text-slate-800"
                  >
                    <span>{item}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBatchItem(idx)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBatchModalOpen(false)}
              disabled={isSavingBatch}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingBatch}
              className="rounded-xl shadow-xs"
            >
              {isResident ? 'Submit' : `Save ${batchItems.length || (currentBatchInput ? 1 : 0)} Dishes`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* SINGLE DISH EDIT MODAL */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Dish Name"
        size="sm"
      >
        <form onSubmit={handleSaveEdit} className="space-y-3">
          <Input
            label="Dish Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="e.g. Sabudana Khichdi"
            requiredIndicator
          />
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              disabled={isSavingEdit}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSavingEdit} className="rounded-xl shadow-xs">
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* SINGLE DISH DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteFood}
        title="Remove Dish"
        message={
          <span>
            Remove <strong>{deleteTarget?.name}</strong>?
          </span>
        }
        confirmLabel="Remove"
        variant="danger"
        isLoading={isDeletingDish}
      />
    </div>
  );
};

export default EventFoodPage;
