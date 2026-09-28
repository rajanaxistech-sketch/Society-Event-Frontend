import React, { useEffect, useState, useMemo, useRef } from 'react';
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
import { compressImageFile } from '../../utils/fileHelper';
import {
  Plus,
  Edit2,
  Trash2,
  Utensils,
  Camera,
  FolderOpen,
  X,
  ChevronRight,
  ImageIcon,
} from 'lucide-react';

interface EventFoodPageProps {
  eventId?: string;
}

const NAVRATRI_FOOD_DAYS = [
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
  const [selectedDayTab, setSelectedDayTab] = useState<number | null>(1);

  // Day Photos: map of dayNumber -> imageUrl
  const [dayPhotosOverride, setDayPhotosOverride] = useState<Record<number, string | null>>({});
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<number | null>(null);

  // Batch Multi-Add Modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchDayNumber, setBatchDayNumber] = useState<number>(1);
  const [batchItems, setBatchItems] = useState<string[]>([]);
  const [currentBatchInput, setCurrentBatchInput] = useState('');
  const [batchPasteMode, setBatchPasteMode] = useState(false);
  const [batchPasteText, setBatchPasteText] = useState('');
  const [isSavingBatch, setIsSavingBatch] = useState(false);

  // Inline Quick Add
  const [inlineDishName, setInlineDishName] = useState('');
  const [isAddingInline, setIsAddingInline] = useState(false);

  // Single Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItemEntity | null>(null);
  const [editName, setEditName] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<FoodItemEntity | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    }));
  }, [event, isNavratri]);

  const fetchFoodItems = async () => {
    if (!eventId) return;
    try {
      const res = await foodService.listByEvent(eventId, { page: 1, limit: 200 });
      if (res.success && res.data) {
        setFoodItems(res.data.map(parseFoodItem));
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch food items'));
    }
  };

  useEffect(() => {
    fetchFoodItems();
  }, [eventId]);

  const dayPhotos = useMemo(() => {
    const map: Record<number, string> = {};
    foodItems.forEach((item) => {
      const d = item.day_number || 1;
      if (item.image_url && !map[d]) {
        map[d] = item.image_url;
      }
    });
    Object.entries(dayPhotosOverride).forEach(([dayStr, url]) => {
      const d = Number(dayStr);
      if (url === null) {
        delete map[d];
      } else if (url) {
        map[d] = url;
      }
    });
    return map;
  }, [foodItems, dayPhotosOverride]);

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
      setDayPhotosOverride((prev) => ({ ...prev, [targetDay]: compressedDataUrl }));

      const dayItems = foodItems.filter((i) => i.day_number === targetDay);
      if (dayItems.length > 0) {
        await Promise.all(
          dayItems.map((item) =>
            foodService.update(item.id, {
              image_url: compressedDataUrl,
              day_number: targetDay,
            })
          )
        );
      } else if (eventId) {
        await foodService.createForEvent(eventId, {
          name: isNavratri ? `Day ${targetDay} Feast` : `Day ${targetDay} Menu`,
          day_number: targetDay,
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
      setDayPhotosOverride((prev) => ({ ...prev, [targetDay]: null }));

      const dayItems = foodItems.filter((i) => i.day_number === targetDay && i.image_url);
      if (dayItems.length > 0) {
        await Promise.all(
          dayItems.map((item) =>
            foodService.update(item.id, {
              image_url: undefined,
            })
          )
        );
      }
      toast.success(`Photo removed for Day ${targetDay}`);
      fetchFoodItems();
    } catch (err) {
      toast.error('Failed to remove photo');
    } finally {
      setIsUploadingPhoto(null);
    }
  };

  const handleOpenBatchModal = (targetDay?: number) => {
    const d = targetDay || (selectedDayTab !== null ? selectedDayTab : 1);
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
      const dayPhoto = dayPhotos[batchDayNumber] || undefined;
      await Promise.all(
        finalItems.map((itemName) =>
          foodService.createForEvent(eventId, {
            name: itemName,
            day_number: batchDayNumber,
            image_url: dayPhoto,
          })
        )
      );

      toast.success(`${finalItems.length} dishes saved for Day ${batchDayNumber}`);
      setBatchModalOpen(false);
      fetchFoodItems();
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save dishes'));
    } finally {
      setIsSavingBatch(false);
    }
  };

  const handleInlineQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = inlineDishName.trim();
    if (!name || !eventId) return;

    const targetDay = selectedDayTab !== null ? selectedDayTab : 1;
    try {
      setIsAddingInline(true);
      const dayPhoto = dayPhotos[targetDay] || undefined;
      const res = await foodService.createForEvent(eventId, {
        name,
        day_number: targetDay,
        image_url: dayPhoto,
      });

      if (res.success) {
        setInlineDishName('');
        fetchFoodItems();
      } else {
        toast.error(res.message || 'Failed to add dish');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to add dish'));
    } finally {
      setIsAddingInline(false);
    }
  };

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
        fetchFoodItems();
      } else {
        toast.error(res.message || 'Failed to update dish');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update dish'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteFood = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await foodService.delete(deleteTarget.id);
      if (res.success) {
        toast.success('Dish removed');
        setDeleteTarget(null);
        fetchFoodItems();
      } else {
        toast.error(res.message || 'Failed to delete dish');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete dish'));
    } finally {
      setIsDeleting(false);
    }
  };

  const activeDayMeta = useMemo(() => {
    if (selectedDayTab === null) return null;
    return daysList.find((d) => d.day === selectedDayTab) || {
      day: selectedDayTab,
      title: `Day ${selectedDayTab}`,
      subtitle: `Day ${selectedDayTab} Menu`,
    };
  }, [daysList, selectedDayTab]);

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

      {/* 1. ULTRA-MINIMALIST DAY PILL SELECTOR */}
      {daysList.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDayTab(null)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              selectedDayTab === null
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            All ({foodItems.length})
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
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-600'
                }`}
              >
                <span>{d.title}</span>
                {countForDay > 0 && (
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {countForDay}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 2. SINGLE DAY VIEW */}
      {selectedDayTab !== null && activeDayMeta && (
        <div className="space-y-3">
          {/* DAY PHOTO BANNER (Minimalist) */}
          {dayPhotos[selectedDayTab] ? (
            <div className="relative h-36 sm:h-44 w-full rounded-2xl overflow-hidden bg-slate-900 shadow-2xs group">
              <img
                src={dayPhotos[selectedDayTab]}
                alt={`Day ${selectedDayTab}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

              <div className="absolute bottom-2.5 left-3 text-white">
                <span className="text-xs font-bold block">{activeDayMeta.title} • {activeDayMeta.subtitle}</span>
              </div>

              {!isResident && (
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => triggerCamera(selectedDayTab)}
                    className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all"
                    title="Camera"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerGallery(selectedDayTab)}
                    className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white backdrop-blur-xs text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all"
                    title="Gallery"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveDayPhoto(selectedDayTab)}
                    className="p-1.5 rounded-lg bg-black/50 hover:bg-rose-600 text-white backdrop-blur-xs text-[11px] font-medium cursor-pointer transition-all"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Minimalist single-line banner without heavy borders */
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-200/60 text-xs">
              <div className="flex items-center gap-2 text-slate-700 min-w-0">
                <ImageIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold truncate">{activeDayMeta.title} • {activeDayMeta.subtitle}</span>
              </div>

              {!isResident && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => triggerCamera(selectedDayTab)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Camera className="w-3 h-3 text-indigo-600" />
                    <span>Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => triggerGallery(selectedDayTab)}
                    className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <FolderOpen className="w-3 h-3 text-indigo-600" />
                    <span>Upload</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* DISHES HEADER & BATCH ADD */}
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {activeDayMeta.title} Menu ({filteredFoodItems.length})
            </span>
            <button
              type="button"
              onClick={() => handleOpenBatchModal(selectedDayTab)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isResident ? 'Suggest' : 'Add Dishes'}</span>
            </button>
          </div>

          {/* DISHES LIST */}
          {filteredFoodItems.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No dishes listed for {activeDayMeta.title}.
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredFoodItems.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200/70 p-2.5 flex items-center justify-between gap-2.5 transition-colors group hover:border-slate-300"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-500 font-semibold text-[10.5px] flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-[13.5px] font-semibold text-slate-800 tracking-tight truncate">
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

          {/* INLINE QUICK ADD BAR */}
          {!isResident && (
            <form onSubmit={handleInlineQuickAdd} className="pt-0.5">
              <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/80 focus-within:border-indigo-500 transition-colors">
                <input
                  type="text"
                  placeholder={`+ Quick add dish for Day ${selectedDayTab}...`}
                  value={inlineDishName}
                  onChange={(e) => setInlineDishName(e.target.value)}
                  className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent border-0 focus:outline-hidden py-0.5"
                />
                <button
                  type="submit"
                  disabled={!inlineDishName.trim() || isAddingInline}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shrink-0 transition-all cursor-pointer"
                >
                  {isAddingInline ? '...' : 'Add'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. ALL DAYS OVERVIEW */}
      {selectedDayTab === null && (
        <div className="space-y-2.5">
          {daysList.map((d) => {
            const dayItems = foodItems.filter(
              (item) => item.day_number === d.day || (!item.day_number && (item.name + ' ' + (item.description || '')).toLowerCase().includes(`day ${d.day}`))
            );
            const photo = dayPhotos[d.day];

            return (
              <div
                key={d.day}
                onClick={() => setSelectedDayTab(d.day)}
                className="bg-white rounded-xl border border-slate-200/80 p-3 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {photo ? (
                      <img src={photo} alt={d.title} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                        {d.day}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-800 truncate">
                        {d.title} <span className="font-normal text-slate-400">• {d.subtitle}</span>
                      </h4>
                      <span className="text-[10.5px] text-slate-400">
                        {dayItems.length} {dayItems.length === 1 ? 'dish' : 'dishes'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BATCH ADD MODAL */}
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
                {d.title}
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

      {/* DELETE CONFIRMATION DIALOG */}
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
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventFoodPage;
