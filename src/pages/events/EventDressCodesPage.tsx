import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { dressCodesService } from '../../api/dressCodesService';
import { DressCodeItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import Spinner from '../../components/ui/Spinner';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { decodeId } from '../../utils/idObfuscator';
import { formatDate, formatDateTime } from '../../utils/formatters';
import {
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  LayoutGrid,
  List,
  Palette,
  Calendar as CalendarIcon,
  User as UserIcon,
  Clock,
  Info,
  ChevronRight,
} from 'lucide-react';

interface EventDressCodesPageProps {
  eventId?: string;
}

const PRESET_COLORS = [
  { name: 'Orange', hex: '#EA580C', goddess: 'Pratipada 🍊' },
  { name: 'White', hex: '#FFFFFF', goddess: 'Brahmacharini 🕊️' },
  { name: 'Red', hex: '#DC2626', goddess: 'Chandraghanta 🌹' },
  { name: 'Royal Blue', hex: '#1D4ED8', goddess: 'Kushmanda 💙' },
  { name: 'Yellow', hex: '#EAB308', goddess: 'Skandamata 🌟' },
  { name: 'Green', hex: '#16A34A', goddess: 'Katyayani 🌿' },
  { name: 'Grey', hex: '#64748B', goddess: 'Kalaratri 🩶' },
  { name: 'Purple', hex: '#9333EA', goddess: 'Mahagauri 👑' },
  { name: 'Peacock Green', hex: '#0F766E', goddess: 'Siddhidatri 🦚' },
  { name: 'Pink', hex: '#EC4899', goddess: 'Festive Pink 🌸' },
  { name: 'Maroon', hex: '#881337', goddess: 'Royal Maroon 🌺' },
  { name: 'Gold', hex: '#D97706', goddess: 'Grand Finale ✨' },
];

const toDateInputValue = (val: string | Date | null | undefined): string => {
  if (!val) return '';
  const parsed = dayjs(val);
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : '';
};

/**
 * Calculates perceived brightness (YIQ/HSP) of a hex color to ensure
 * WCAG-compliant high-contrast text and UI elements.
 */
const isLightColor = (hexColor?: string | null): boolean => {
  if (!hexColor) return false;
  let hex = hexColor.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 165;
};

export const EventDressCodesPage: React.FC<EventDressCodesPageProps> = ({ eventId: propEventId }) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = decodeId(propEventId || routeEventId);
  const toast = useToast();
  const { isResident } = usePermission();

  const [dressCodes, setDressCodes] = useState<DressCodeItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [displayMode, setDisplayMode] = useState<'3x3' | 'table'>('3x3');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DressCodeItem | null>(null);
  const [day, setDay] = useState<number | string>(1);
  const [date, setDate] = useState<string>('');
  const [color, setColor] = useState<string>('Orange');
  const [colorCode, setColorCode] = useState<string>('#EA580C');
  const [category, setCategory] = useState('Day 1: Orange Day');
  const [isSaving, setIsSaving] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

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

  // Sort items chronologically by scheduled date (ascending order), falling back to day number
  const sortedDressCodes = useMemo(() => {
    return [...dressCodes].sort((a, b) => {
      // If both items have scheduled dates, compare dates chronologically (earliest first)
      if (a.date && b.date) {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (timeA !== timeB) return timeA - timeB;
      }
      // If only one has a date, show dated items first
      if (a.date && !b.date) return -1;
      if (!a.date && b.date) return 1;

      // Fall back to day number ascending
      const dayA = a.day !== null && a.day !== undefined ? Number(a.day) : 9999;
      const dayB = b.day !== null && b.day !== undefined ? Number(b.day) : 9999;
      if (dayA !== dayB) return dayA - dayB;

      // Fall back to creation timestamp
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [dressCodes]);

  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setAuditOpen(false);
    setDay('');
    setDate('');
    setColor('');
    setColorCode('#EA580C');
    setCategory('');
    setModalOpen(true);
  };

  const handleOpenEditModal = async (item: DressCodeItem) => {
    setEditingItem(item);
    setAuditOpen(false);
    setDay(item.day !== null && item.day !== undefined ? item.day : '');
    setDate(toDateInputValue(item.date));

    // Determine clean color name
    let detectedColor = item.color || '';
    if (!detectedColor && item.category) {
      detectedColor = item.category
        .replace(/^Day\s*\d+:\s*/i, '')
        .replace(/\s*Day.*$/i, '')
        .trim();
    }
    setColor(detectedColor || 'Orange');
    setColorCode(item.color_code || '#EA580C');
    setCategory(item.category || (item.day ? `Day ${item.day}: ${detectedColor || 'Festive'} Day` : ''));
    setModalOpen(true);

    // Fetch freshest record from API to ensure complete accuracy
    if (item.id) {
      try {
        const fresh = await dressCodesService.getById(item.id);
        if (fresh.success && fresh.data) {
          const d = fresh.data;
          setEditingItem(d);
          setDay(d.day !== null && d.day !== undefined ? d.day : '');
          setDate(toDateInputValue(d.date));
          let freshColor = d.color || '';
          if (!freshColor && d.category) {
            freshColor = d.category
              .replace(/^Day\s*\d+:\s*/i, '')
              .replace(/\s*Day.*$/i, '')
              .trim();
          }
          setColor(freshColor || detectedColor || 'Orange');
          setColorCode(d.color_code || '#EA580C');
          setCategory(d.category || '');
        }
      } catch {
        // Fallback state already populated
      }
    }
  };

  const handleSelectPresetColor = (preset: { name: string; hex: string; goddess?: string }) => {
    setColor(preset.name);
    setColorCode(preset.hex);
    if (!category || category.startsWith('Day ') || category.toLowerCase().includes('theme') || category.toLowerCase().includes('day')) {
      const dayPrefix = day ? `Day ${day}: ` : '';
      setCategory(`${dayPrefix}${preset.name} Day${preset.goddess ? ` — ${preset.goddess}` : ''}`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!color.trim() || !eventId) {
      toast.warning('Please specify color name');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<DressCodeItem> = {
        day: day !== '' && day !== null && !isNaN(Number(day)) ? Number(day) : null,
        date: date ? date : null,
        color: color.trim(),
        color_code: colorCode.trim(),
        category: category.trim() || (day ? `Day ${day}: ${color.trim()}` : color.trim()),
        status: 'active', // Auto-published by default
      };

      let res;
      if (editingItem) {
        res = await dressCodesService.update(editingItem.id, payload);
      } else {
        res = await dressCodesService.createForEvent(eventId, payload);
      }

      if (res.success) {
        toast.success(editingItem ? 'Dress code day updated successfully.' : 'New dress code day added successfully.');
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
        toast.success('Dress code day deleted.');
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
      key: 'day',
      header: 'Day',
      align: 'center',
      render: (row) => (
        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
          {row.day !== null && row.day !== undefined ? String(row.day).padStart(2, '0') : '—'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Scheduled Date',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          {row.date ? formatDate(row.date) : <span className="text-slate-400 italic">No Date Set</span>}
        </div>
      ),
    },
    {
      key: 'color',
      header: 'Theme / Color',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border border-black/10 shadow-2xs shrink-0"
            style={{ backgroundColor: row.color_code || '#EA580C' }}
          />
          <div>
            <span className="font-bold text-slate-900 text-xs block">{row.color || 'Custom Color'}</span>
            <span className="text-[11px] text-slate-500 line-clamp-1">{row.category}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'audit',
      header: 'Audit Trail',
      render: (row) => (
        <div className="text-[11px] text-slate-500 space-y-0.5">
          <div className="flex items-center gap-1">
            <UserIcon className="w-3 h-3 text-slate-400" />
            <span className="font-medium text-slate-700">
              {row.updater?.full_name || row.creator?.full_name || 'Admin'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {formatDate(row.updated_at || row.created_at)}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard permission={Permissions.DRESS_CODE_MANAGE}>
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Day Schedule"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Delete Day"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-2.5 pb-8">
      {/* Sleek Minimalist Page Header */}
      <div className="flex items-center justify-between gap-2 px-1 py-1">
        {/* Title & Count */}
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
            Dress Codes
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80 shrink-0">
            {dressCodes.length} {dressCodes.length === 1 ? 'Day' : 'Days'}
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Segmented View Toggle */}
          <div className="inline-flex p-0.5 bg-slate-100/90 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => setDisplayMode('3x3')}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                displayMode === '3x3'
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="3×3 Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3×3</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('table')}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                displayMode === 'table'
                  ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchDressCodes}
            disabled={isLoading}
            className="p-1.5 text-slate-500 bg-white border border-slate-200/80 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Refresh Schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Add Day / Color Button */}
          <PermissionGuard permission={Permissions.DRESS_CODE_MANAGE}>
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-2xs transition-all cursor-pointer"
              title="Add Day / Color Theme"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Day</span>
            </button>
          </PermissionGuard>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="min-h-[260px] bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 flex items-center justify-center p-8">
          <Spinner size="md" label="Loading dress codes..." />
        </div>
      ) : displayMode === '3x3' ? (
        sortedDressCodes.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-100">
              <Palette className="w-5 h-5" />
            </div>
            <div className="max-w-xs mx-auto space-y-1">
              <h3 className="text-sm font-bold text-slate-900">No Dress Code Days Configured</h3>
              <p className="text-[11px] text-slate-500">
                Start setting up your festival theme schedule by adding the first day color guidelines.
              </p>
            </div>
            <PermissionGuard permission={Permissions.DRESS_CODE_MANAGE}>
              <Button variant="primary" size="sm" onClick={handleOpenCreateModal} leftIcon={<Plus className="w-3 h-3" />}>
                Add Day 1 Theme
              </Button>
            </PermissionGuard>
          </div>
        ) : (
          /* Primary 3×3 Grid — Maintains 3 columns strictly across mobile & desktop */
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 md:gap-4 w-full">
            {sortedDressCodes.map((item, idx) => {
              const bgHex = item.color_code || '#EA580C';
              const isLight = isLightColor(bgHex);
              const formattedNum =
                item.day !== null && item.day !== undefined
                  ? String(item.day).padStart(2, '0')
                  : String(idx + 1).padStart(2, '0');
              const dayLabel = item.day ? `Day ${item.day}` : `Day ${idx + 1}`;
              const formattedDate = item.date ? formatDate(item.date) : null;
              const displayTheme =
                item.color ||
                (item.category
                  ? item.category.replace(/^Day\s*\d+:\s*/i, '').replace(/\s*Day.*$/i, '').trim()
                  : '') ||
                'Theme';

              return (
                <div
                  key={item.id}
                  className={`group relative rounded-xl sm:rounded-2xl p-3 sm:p-4 flex flex-col justify-between h-full min-h-[135px] sm:min-h-[155px] md:min-h-[170px] transition-all duration-150 overflow-hidden shadow-2xs hover:shadow-md ${
                    isLight
                      ? 'border border-slate-200/90 text-slate-900 ring-1 ring-slate-900/5'
                      : 'border border-white/15 text-white shadow-sm'
                  }`}
                  style={{
                    backgroundColor: bgHex,
                  }}
                >
                  {/* Top Row: Day Pill & Action Buttons */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] sm:text-xs font-mono font-bold shrink-0 ${
                          isLight
                            ? 'bg-slate-900/10 text-slate-800'
                            : 'bg-white/20 text-white backdrop-blur-xs'
                        }`}
                      >
                        {formattedNum}
                      </span>
                    </div>

                    {!isResident && (
                      <div className="flex items-center gap-1 shrink-0">
                        <PermissionGuard permission={Permissions.DRESS_CODE_MANAGE}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(item);
                            }}
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                              isLight
                                ? 'text-slate-700 bg-slate-900/5 hover:bg-slate-900/15 hover:text-slate-900'
                                : 'text-white/90 bg-white/15 hover:bg-white/30 hover:text-white'
                            }`}
                            title={`Edit ${dayLabel}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(item);
                            }}
                            className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                              isLight
                                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700'
                                : 'text-white/90 bg-white/15 hover:bg-rose-500/80 hover:text-white'
                            }`}
                            title={`Delete ${dayLabel}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </PermissionGuard>
                      </div>
                    )}
                  </div>

                  {/* Middle / Main Content: Day Name, Date, Theme */}
                  <div className="my-auto py-1 space-y-0.5 sm:space-y-1 min-w-0">
                    <h3
                      className={`text-xs sm:text-sm md:text-base font-bold tracking-tight truncate leading-tight ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                    >
                      {dayLabel}
                    </h3>

                    <p
                      className={`text-[10px] sm:text-xs leading-tight truncate ${
                        isLight
                          ? formattedDate
                            ? 'text-slate-600 font-medium'
                            : 'text-slate-400 italic'
                          : formattedDate
                          ? 'text-white/85 font-medium'
                          : 'text-white/60 italic'
                      }`}
                    >
                      {formattedDate || 'No Date Set'}
                    </p>

                    <p
                      className={`text-xs sm:text-sm md:text-base font-extrabold uppercase tracking-tight truncate pt-0.5 sm:pt-1 leading-tight ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}
                      title={displayTheme}
                    >
                      {displayTheme}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Minimalist Table View */
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <Table
            columns={columns}
            data={sortedDressCodes}
            isLoading={isLoading}
            emptyText="No dress code specifications configured for this event."
          />

          <Pagination
            meta={meta}
            onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
            onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
          />
        </div>
      )}

      {/* Create / Edit Day Schedule Modal — Modern Compact Mobile-First Design */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {editingItem ? `Edit Day ${day || ''} Dress Code` : 'Add Day Dress Code'}
          </span>
        }
        description={
          <span className="text-[10.5px] sm:text-[11px] text-slate-500">
            Configure schedule and theme color.
          </span>
        }
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-3.5">
          {/* SECTION 1: SCHEDULE */}
          <div className="space-y-1.5">
            <span className="text-[9.5px] font-bold text-slate-400 tracking-wider uppercase block">
              Schedule
            </span>
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-5 sm:col-span-4">
                <Input
                  label="Day Number"
                  type="number"
                  min={1}
                  max={365}
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  placeholder="e.g. 1"
                  requiredIndicator
                  inputSize="sm"
                />
              </div>

              <div className="col-span-7 sm:col-span-8">
                <Input
                  label="Scheduled Date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  inputSize="sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: THEME */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <span className="text-[9.5px] font-bold text-slate-400 tracking-wider uppercase block">
              Theme & Color
            </span>

            {/* Unified Color Row */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-[#1E293B]">
                Theme Color <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  className="w-7 h-7 rounded-md border border-slate-300 cursor-pointer p-0.5 shrink-0 bg-transparent shadow-2xs"
                  title="Choose custom color hex"
                />
                <Input
                  placeholder="e.g. Orange"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-1"
                  requiredIndicator={false}
                  inputSize="sm"
                />
                <Input
                  value={colorCode}
                  onChange={(e) => setColorCode(e.target.value)}
                  placeholder="#EA580C"
                  className="w-22 font-mono text-[11px]"
                  inputSize="sm"
                />
              </div>
            </div>

            {/* Compact Color Presets */}
            <div className="pt-0.5">
              <span className="text-[10px] font-medium text-slate-400 block mb-1">
                Quick Festive Presets:
              </span>
              <div className="flex flex-wrap gap-1">
                {PRESET_COLORS.map((preset) => {
                  const isSelected =
                    Boolean(color.trim()) &&
                    (colorCode.toLowerCase() === preset.hex.toLowerCase() ||
                      color.trim().toLowerCase() === preset.name.toLowerCase());

                  return (
                    <button
                      key={preset.hex + preset.name}
                      type="button"
                      onClick={() => handleSelectPresetColor(preset)}
                      className={`px-1.5 py-0.5 rounded-md text-[10.5px] font-medium border transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500 font-bold'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Title */}
            <div className="pt-1">
              <Input
                label="Theme Title"
                placeholder="e.g. Day 1 Theme: White"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                inputSize="sm"
              />
            </div>
          </div>

          {/* SECTION 3: AUDIT HISTORY (Collapsible for editing) */}
          {editingItem && (
            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAuditOpen(!auditOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 hover:bg-slate-100/70 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                  <Info className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Audit History</span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    auditOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {auditOpen && (
                <div className="p-2.5 mt-1 rounded-lg bg-slate-50 border border-slate-200/70 text-[10.5px] text-slate-600 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div>
                    <span className="text-slate-400">Created: </span>
                    <span className="font-medium text-slate-700">
                      {formatDateTime(editingItem.created_at)}
                    </span>
                    {editingItem.creator && ` by ${editingItem.creator.full_name}`}
                  </div>
                  {editingItem.updated_at && (
                    <div>
                      <span className="text-slate-400">Last Modified: </span>
                      <span className="font-medium text-slate-700">
                        {formatDateTime(editingItem.updated_at)}
                      </span>
                      {editingItem.updater && ` by ${editingItem.updater.full_name}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Modal Footer / Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 sticky bottom-0 bg-white pb-0.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving}>
              {editingItem ? 'Save Changes' : 'Create Day Schedule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Dress Code Day"
        message={
          <span>
            Are you sure you want to delete{' '}
            <strong>Day {deleteTarget?.day}: {deleteTarget?.color || deleteTarget?.category}</strong>?
          </span>
        }
        confirmLabel="Delete Day"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventDressCodesPage;
