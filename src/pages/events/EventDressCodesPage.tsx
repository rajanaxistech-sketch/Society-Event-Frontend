import React, { useEffect, useState, useMemo } from 'react';
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
import {
  Plus,
  Edit2,
  Trash2,
  Shirt,
  RefreshCw,
  Sparkles,
  LayoutGrid,
  List,
  Palette,
  CheckCircle,
} from 'lucide-react';

interface EventDressCodesPageProps {
  eventId?: string;
}

const NAVRATRI_DAYS = [
  { day: 1, title: 'Day 1: Pratipada', color: 'Royal Blue / Yellow', hex: '#2563EB', goddess: 'Shailaputri' },
  { day: 2, title: 'Day 2: Brahmacharini', color: 'Green', hex: '#16A34A', goddess: 'Brahmacharini' },
  { day: 3, title: 'Day 3: Chandraghanta', color: 'Grey', hex: '#6B7280', goddess: 'Chandraghanta' },
  { day: 4, title: 'Day 4: Kushmanda', color: 'Orange', hex: '#EA580C', goddess: 'Kushmanda' },
  { day: 5, title: 'Day 5: Skandamata', color: 'White', hex: '#F3F4F6', textDark: true, goddess: 'Skandamata' },
  { day: 6, title: 'Day 6: Katyayani', color: 'Red', hex: '#DC2626', goddess: 'Katyayani' },
  { day: 7, title: 'Day 7: Kalaratri', color: 'Royal Blue', hex: '#1D4ED8', goddess: 'Kalaratri' },
  { day: 8, title: 'Day 8: Mahagauri', color: 'Pink', hex: '#DB2777', goddess: 'Mahagauri' },
  { day: 9, title: 'Day 9: Siddhidatri', color: 'Purple', hex: '#9333EA', goddess: 'Siddhidatri' },
];

export const EventDressCodesPage: React.FC<EventDressCodesPageProps> = ({ eventId: propEventId }) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = decodeId(propEventId || routeEventId);
  const toast = useToast();
  const { can, isResident } = usePermission();

  const [dressCodes, setDressCodes] = useState<DressCodeItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDayTab, setSelectedDayTab] = useState<number | null>(null);
  const [displayMode, setDisplayMode] = useState<'cards' | 'table'>('cards');

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
    setCategory(selectedDayTab ? `Day ${selectedDayTab}: Traditional Theme` : 'Traditional / Ethnic');
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

  // Filtered items based on selected day pill
  const filteredDressCodes = useMemo(() => {
    if (selectedDayTab === null) return dressCodes;
    return dressCodes.filter((item) => {
      const cat = item.category.toLowerCase();
      const desc = item.description.toLowerCase();
      const target = `day ${selectedDayTab}`;
      const target2 = `day-${selectedDayTab}`;
      return cat.includes(target) || cat.includes(target2) || desc.includes(target);
    });
  }, [dressCodes, selectedDayTab]);

  const columns: Column<DressCodeItem>[] = [
    {
      key: 'category',
      header: 'Category / Day Group',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Shirt className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-bold text-slate-900 text-xs">{row.category}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Attire Guidelines',
      render: (row) => <span className="text-slate-800 text-xs">{row.description}</span>,
    },
    {
      key: 'instructions',
      header: 'Special Instructions',
      render: (row) => (
        <span className="text-slate-500 text-xs truncate max-w-xs block">{row.instructions || '—'}</span>
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
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard permission={Permissions.DRESS_CODE_MANAGE}>
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Edit Dress Code"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Delete Dress Code"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 9-Day Navratri Quick Filter Tabs */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-indigo-600" />
            9-Day Festive Color Palette
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Click a day to filter theme</span>
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
            All 9 Days
          </button>
          {NAVRATRI_DAYS.map((d) => {
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
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: d.hex }}
                />
                <span>Day {d.day}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-indigo-700 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {d.color.split('/')[0].trim()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Dress Code Card */}
      <Card
        title="Event Dress Codes & Attire Guidelines"
        subtitle="Daily traditional color themes, ethnic wear recommendations, and accessories guide for residents."
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
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Dress Code
              </Button>
            </PermissionGuard>
          </div>
        }
      >
        {displayMode === 'cards' ? (
          <div className="space-y-4">
            {filteredDressCodes.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                {selectedDayTab
                  ? `No custom dress code configured specifically for Day ${selectedDayTab}.`
                  : 'No dress codes configured for this event.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredDressCodes.map((item, idx) => {
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow"
                    >
                      {/* Top Header Strip */}
                      <div className="p-3.5 bg-linear-to-r from-slate-50 to-indigo-50/40 border-b border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            <Shirt className="w-4 h-4" />
                          </div>
                          <span className="font-extrabold text-sm text-slate-900 line-clamp-1">
                            {item.category}
                          </span>
                        </div>
                        <StatusBadge status={item.status} size="sm" />
                      </div>

                      {/* Card Content Body */}
                      <div className="p-3.5 space-y-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Attire Guidelines
                          </span>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {item.description}
                          </p>
                        </div>

                        {item.instructions && (
                          <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 space-y-0.5">
                            <span className="font-bold text-[10px] uppercase text-amber-800 block flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-600" />
                              Special Notes / Accessories
                            </span>
                            <p className="text-[11px] leading-relaxed">{item.instructions}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Bar for Admins */}
                      {!isResident && (
                        <div className="px-3.5 py-2.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                          <PermissionGuard permission={Permissions.DRESS_CODE_MANAGE}>
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
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <Table
              columns={columns}
              data={filteredDressCodes}
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
            placeholder="e.g. Day 1: Traditional Ethnic / Men & Women"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            requiredIndicator
          />

          <Textarea
            label="Attire Description"
            placeholder="e.g. Kurta Pajama / Sherwani in Royal Blue for Men, Chaniya Choli in Yellow/Gold for Women"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            requiredIndicator
          />

          <Textarea
            label="Special Instructions / Accessories (Optional)"
            placeholder="e.g. Traditional wooden Dandiya sticks encouraged, ethnic dupattas..."
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

