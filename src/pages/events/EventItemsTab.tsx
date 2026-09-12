import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { eventItemsService } from '../../api/eventItemsService';
import { serviceGroupsService } from '../../api/serviceGroupsService';
import { vendorsService } from '../../api/vendorsService';
import { eventVendorsService } from '../../api/eventVendorsService';
import {
  EventServiceItem,
  EventServiceGroupItem,
  EventDayItem,
  VendorItem,
  EventContractItem,
  PricingType,
  EventDayBreakdownResponse,
  EventVendorBreakdownResponse,
  DayAssignmentPayload,
} from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import StatusBadge from '../../components/common/StatusBadge';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatCurrency } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  RefreshCw,
  Calculator,
  Building2,
  ChevronDown,
  ChevronRight,
  Search,
  Users,
  Grid,
  List,
  Copy,
  Check,
  CalendarDays,
  Phone,
  Tag,
  Clock,
  Briefcase,
  SlidersHorizontal,
} from 'lucide-react';

interface EventItemsTabProps {
  eventId: string;
  isNavratri?: boolean;
}

type ViewMode = 'groups' | 'days' | 'vendors' | 'table';

export const EventItemsTab: React.FC<EventItemsTabProps> = ({ eventId, isNavratri }) => {
  const toast = useToast();
  const { can } = usePermission();

  // Primary Data
  const [items, setItems] = useState<EventServiceItem[]>([]);
  const [serviceGroups, setServiceGroups] = useState<EventServiceGroupItem[]>([]);
  const [eventDays, setEventDays] = useState<EventDayItem[]>([]);
  const [masterVendors, setMasterVendors] = useState<VendorItem[]>([]);
  const [eventContracts, setEventContracts] = useState<EventContractItem[]>([]);
  const [dayBreakdown, setDayBreakdown] = useState<EventDayBreakdownResponse | null>(null);
  const [vendorBreakdown, setVendorBreakdown] = useState<EventVendorBreakdownResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('groups');
  const [selectedDayId, setSelectedDayId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Add / Edit Item Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventServiceItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [serviceGroupId, setServiceGroupId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vendorMode, setVendorMode] = useState<'master' | 'external'>('master');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [externalVendorName, setExternalVendorName] = useState('');
  const [externalContactPerson, setExternalContactPerson] = useState('');
  const [externalPhone, setExternalPhone] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>('fixed');
  const [basePrice, setBasePrice] = useState('0');
  const [pricePerDay, setPricePerDay] = useState('0');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('Nos');
  const [notes, setNotes] = useState('');

  // Day Assignment in Form
  const [dayAssignmentMode, setDayAssignmentMode] = useState<'all' | 'custom'>('all');
  const [selectedDayIds, setSelectedDayIds] = useState<string[]>([]);
  const [dayRows, setDayRows] = useState<
    Record<
      string,
      {
        vendorId?: string;
        vendorName?: string;
        quantity?: number;
        rate?: number;
        price: number;
        notes?: string;
      }
    >
  >({});

  // Delete Confirmation
  const [itemToDelete, setItemToDelete] = useState<EventServiceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Service Group Master Modal
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Dynamic Event Day Modal & Inline State
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [newDayDate, setNewDayDate] = useState('');
  const [newDayDisplayName, setNewDayDisplayName] = useState('');
  const [newDayNotes, setNewDayNotes] = useState('');
  const [isCreatingDay, setIsCreatingDay] = useState(false);
  const [inlineAddDayOpen, setInlineAddDayOpen] = useState(false);

  // Day Deletion
  const [dayToDelete, setDayToDelete] = useState<EventDayItem | null>(null);
  const [isDeletingDay, setIsDeletingDay] = useState(false);

  // Fetch all necessary data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [
        itemsRes,
        groupsRes,
        daysRes,
        masterVendorsRes,
        contractsRes,
        dayBreakdownRes,
        vendorBreakdownRes,
      ] = await Promise.all([
        eventItemsService.listByEvent(eventId, { limit: 100 }),
        serviceGroupsService.getAll({ limit: 100 }),
        eventItemsService.getEventDays(eventId),
        vendorsService.getAll({ limit: 100 }),
        eventVendorsService.listByEvent(eventId, { limit: 100 }),
        eventItemsService.getDayBreakdown(eventId),
        eventItemsService.getVendorBreakdown(eventId),
      ]);

      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data);
      }
      if (groupsRes.success && groupsRes.data) {
        setServiceGroups(groupsRes.data);
        // Expand all groups by default
        const initExpanded: Record<string, boolean> = {};
        groupsRes.data.forEach((g) => {
          initExpanded[g.name] = true;
        });
        initExpanded['Other'] = true;
        setExpandedGroups((prev) => ({ ...initExpanded, ...prev }));
      }
      if (daysRes.success && daysRes.data) {
        setEventDays(daysRes.data);
      }
      if (masterVendorsRes.success && masterVendorsRes.data) {
        setMasterVendors(masterVendorsRes.data);
      }
      if (contractsRes.success && contractsRes.data) {
        setEventContracts(contractsRes.data);
      }
      if (dayBreakdownRes.success && dayBreakdownRes.data) {
        setDayBreakdown(dayBreakdownRes.data);
      }
      if (vendorBreakdownRes.success && vendorBreakdownRes.data) {
        setVendorBreakdown(vendorBreakdownRes.data);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load event planning data'));
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId, fetchData]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalItems = items.length;
    const totalEstimatedCost = items.reduce((acc, i) => acc + Number(i.total_price || 0), 0);
    const activeDaysCount = eventDays.length || 1;
    const contractedVendorsCount = vendorBreakdown?.totalVendors || masterVendors.length;
    const totalGroupsCount = new Set(
      items.map((i) => i.service_group?.name || i.category || 'Other')
    ).size;

    return {
      totalItems,
      totalEstimatedCost,
      activeDaysCount,
      contractedVendorsCount,
      totalGroupsCount,
    };
  }, [items, eventDays, vendorBreakdown, masterVendors]);

  // Grouped Items Map
  const groupedItems = useMemo(() => {
    const map: Record<string, { group?: EventServiceGroupItem; items: EventServiceItem[]; totalCost: number }> = {};

    // Initialize all known service groups
    serviceGroups.forEach((g) => {
      map[g.name] = { group: g, items: [], totalCost: 0 };
    });

    // Filter items
    const filtered = items.filter((item) => {
      if (selectedGroupFilter && item.service_group?.name !== selectedGroupFilter && item.category !== selectedGroupFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesVendor = (item.vendor?.vendor_name || item.vendor_name || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesCat = (item.category || '').toLowerCase().includes(q);
        return matchesName || matchesVendor || matchesDesc || matchesCat;
      }
      return true;
    });

    filtered.forEach((item) => {
      const gName = item.service_group?.name || item.category || 'Other';
      if (!map[gName]) {
        map[gName] = { items: [], totalCost: 0 };
      }
      map[gName].items.push(item);
      map[gName].totalCost += Number(item.total_price || 0);
    });

    return map;
  }, [items, serviceGroups, selectedGroupFilter, searchQuery]);

  // Form Calculations
  const calculatedFormTotal = useMemo(() => {
    if (pricingType === 'fixed') {
      return Number(basePrice) || 0;
    }

    if (pricingType === 'recurring_daily') {
      const daily = Number(pricePerDay) || 0;
      const count = selectedDayIds.length || (dayAssignmentMode === 'all' ? eventDays.length : 1);
      return daily * count;
    }

    if (pricingType === 'quantity_based') {
      if (dayAssignmentMode === 'custom' && selectedDayIds.length > 0) {
        return selectedDayIds.reduce((sum, dayId) => {
          const row = dayRows[dayId];
          const q = row?.quantity !== undefined ? Number(row.quantity) : Number(quantity) || 1;
          const r = row?.rate !== undefined ? Number(row.rate) : Number(basePrice) || 0;
          return sum + q * r;
        }, 0);
      }
      return (Number(quantity) || 1) * (Number(basePrice) || 0) * (eventDays.length || 1);
    }

    if (pricingType === 'day_wise') {
      const activeIds = dayAssignmentMode === 'all' ? eventDays.map((d) => d.id) : selectedDayIds;
      return activeIds.reduce((sum, dayId) => {
        const row = dayRows[dayId];
        return sum + (Number(row?.price) || 0);
      }, 0);
    }

    return Number(basePrice) || 0;
  }, [pricingType, basePrice, pricePerDay, quantity, selectedDayIds, dayAssignmentMode, eventDays, dayRows]);

  // Open Create Modal
  const openCreateModal = (presetGroupName?: string) => {
    setEditingItem(null);
    const matchedGroup = serviceGroups.find((g) => g.name === presetGroupName) || serviceGroups[0];
    setServiceGroupId(matchedGroup?.id || '');
    setName('');
    setDescription('');
    setVendorMode('master');
    setSelectedVendorId(masterVendors[0]?.id || '');
    setExternalVendorName('');
    setExternalContactPerson('');
    setExternalPhone('');
    setPricingType('fixed');
    setBasePrice('0');
    setPricePerDay('0');
    setQuantity('1');
    setUnit('Nos');
    setNotes('');

    setDayAssignmentMode('all');
    const allDayIds = eventDays.map((d) => d.id);
    setSelectedDayIds(allDayIds);

    const initialRows: Record<string, any> = {};
    allDayIds.forEach((id) => {
      initialRows[id] = {
        vendorId: masterVendors[0]?.id || '',
        vendorName: masterVendors[0]?.vendor_name || '',
        quantity: 1,
        rate: 0,
        price: 0,
      };
    });
    setDayRows(initialRows);

    setModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item: EventServiceItem) => {
    setEditingItem(item);
    setServiceGroupId(item.service_group_id || (serviceGroups.find((g) => g.name === item.category)?.id ?? ''));
    setName(item.name);
    setDescription(item.description || '');

    if (item.vendor_id) {
      setVendorMode('master');
      setSelectedVendorId(item.vendor_id);
      setExternalVendorName('');
      setExternalContactPerson('');
      setExternalPhone('');
    } else if (item.vendor_name) {
      setVendorMode('external');
      setSelectedVendorId('');
      setExternalVendorName(item.vendor_name);
      setExternalContactPerson('');
      setExternalPhone('');
    } else {
      setVendorMode('master');
      setSelectedVendorId(masterVendors[0]?.id || '');
    }

    setPricingType(item.pricing_type || 'fixed');
    setBasePrice(String(item.base_price ?? item.total_price ?? 0));
    setPricePerDay(String(item.price_per_day ?? 0));
    setQuantity(String(item.quantity ?? 1));
    setUnit(item.unit || 'Nos');
    setNotes(item.notes || '');

    if (item.day_assignments && item.day_assignments.length > 0) {
      setDayAssignmentMode(item.day_assignments.length === eventDays.length ? 'all' : 'custom');
      const assignedIds = item.day_assignments.map((a) => a.event_day_id);
      setSelectedDayIds(assignedIds);

      const rows: Record<string, any> = {};
      item.day_assignments.forEach((a) => {
        rows[a.event_day_id] = {
          vendorId: a.vendor_id || '',
          vendorName: a.vendor_name || a.vendor?.vendor_name || '',
          quantity: a.quantity !== null ? Number(a.quantity) : undefined,
          rate: a.rate !== null ? Number(a.rate) : undefined,
          price: Number(a.price || 0),
          notes: a.notes || '',
        };
      });
      setDayRows(rows);
    } else {
      // Legacy item without day assignments
      const allDayIds = eventDays.map((d) => d.id);
      setDayAssignmentMode('all');
      setSelectedDayIds(allDayIds);
      const rows: Record<string, any> = {};
      allDayIds.forEach((id) => {
        rows[id] = {
          vendorId: item.vendor_id || '',
          vendorName: item.vendor_name || '',
          quantity: Number(item.quantity || 1),
          rate: Number(item.base_price || 0),
          price: Number(item.total_price || 0) / (allDayIds.length || 1),
        };
      });
      setDayRows(rows);
    }

    setModalOpen(true);
  };

  // Shortcut: Apply Vendor to All Days
  const applyVendorToAllDays = (vId: string, vName?: string) => {
    setDayRows((prev) => {
      const updated = { ...prev };
      eventDays.forEach((d) => {
        updated[d.id] = {
          ...updated[d.id],
          vendorId: vId,
          vendorName: vName || masterVendors.find((v) => v.id === vId)?.vendor_name || '',
        };
      });
      return updated;
    });
    toast.success('Assigned vendor applied to all days');
  };

  // Shortcut: Apply Rate / Price to All Days
  const applyRateToAllDays = (rateVal: number, qtyVal?: number) => {
    setDayRows((prev) => {
      const updated = { ...prev };
      eventDays.forEach((d) => {
        const q = qtyVal !== undefined ? qtyVal : updated[d.id]?.quantity || Number(quantity) || 1;
        const calculatedPrice = q * rateVal;
        updated[d.id] = {
          ...updated[d.id],
          rate: rateVal,
          quantity: q,
          price: calculatedPrice,
        };
      });
      return updated;
    });
    toast.success('Pricing applied across all event days');
  };

  // Save Item
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please enter an item or service name');
      return;
    }

    try {
      setIsSaving(true);

      const targetDays = dayAssignmentMode === 'all' ? eventDays : eventDays.filter((d) => selectedDayIds.includes(d.id));

      const dayAssignmentsPayload: DayAssignmentPayload[] = targetDays.map((day) => {
        const row = dayRows[day.id] || {};
        const vId = row.vendorId || (vendorMode === 'master' ? selectedVendorId : null);
        const vName =
          row.vendorName ||
          (vendorMode === 'master'
            ? masterVendors.find((v) => v.id === selectedVendorId)?.vendor_name
            : externalVendorName);

        let rowPrice = Number(row.price || 0);
        if (pricingType === 'quantity_based') {
          const q = row.quantity !== undefined ? Number(row.quantity) : Number(quantity) || 1;
          const r = row.rate !== undefined ? Number(row.rate) : Number(basePrice) || 0;
          rowPrice = q * r;
        } else if (pricingType === 'recurring_daily') {
          rowPrice = Number(pricePerDay) || 0;
        } else if (pricingType === 'fixed') {
          rowPrice = (Number(basePrice) || 0) / (targetDays.length || 1);
        }

        return {
          event_day_id: day.id,
          vendor_id: vId || null,
          vendor_name: vName || null,
          contact_person: externalContactPerson || null,
          contact_number: externalPhone || null,
          quantity: row.quantity !== undefined ? Number(row.quantity) : Number(quantity) || 1,
          rate: row.rate !== undefined ? Number(row.rate) : Number(basePrice) || 0,
          price: rowPrice,
          notes: row.notes || null,
          status: 'active',
        };
      });

      const selectedGroup = serviceGroups.find((g) => g.id === serviceGroupId);
      const selectedMasterVendor = masterVendors.find((v) => v.id === selectedVendorId);

      const payload = {
        event_id: eventId,
        service_group_id: serviceGroupId || null,
        vendor_id: vendorMode === 'master' && selectedVendorId ? selectedVendorId : null,
        name: name.trim(),
        category: selectedGroup?.name || 'Other',
        description: description || null,
        vendor_name: vendorMode === 'master' ? selectedMasterVendor?.vendor_name || null : externalVendorName || null,
        pricing_type: pricingType,
        base_price: Number(basePrice) || 0,
        price_per_day: pricingType === 'recurring_daily' ? Number(pricePerDay) || 0 : null,
        number_of_days: targetDays.length,
        applicable_days: targetDays.map((d) => String(d.day_number)),
        quantity: pricingType === 'quantity_based' ? Number(quantity) || 1 : null,
        unit: pricingType === 'quantity_based' ? unit : null,
        total_price: calculatedFormTotal,
        notes: notes || null,
        day_assignments: dayAssignmentsPayload,
      };

      if (editingItem) {
        const res = await eventItemsService.update(editingItem.id, payload);
        if (res.success) {
          toast.success(`Service item "${name}" updated successfully.`);
          setModalOpen(false);
          fetchData();
        } else {
          toast.error(res.message || 'Failed to update item');
        }
      } else {
        const res = await eventItemsService.create({ ...payload, is_default_navratri: false });
        if (res.success) {
          toast.success(`Service item "${name}" added successfully.`);
          setModalOpen(false);
          fetchData();
        } else {
          toast.error(res.message || 'Failed to add item');
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save item'));
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      setIsDeleting(true);
      const res = await eventItemsService.delete(itemToDelete.id);
      if (res.success) {
        toast.success(`Item "${itemToDelete.name}" removed.`);
        setItemToDelete(null);
        fetchData();
      } else {
        toast.error(res.message || 'Failed to delete item');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete item'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick Create Service Group
  const handleCreateServiceGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      setIsCreatingGroup(true);
      const res = await serviceGroupsService.create({
        name: newGroupName.trim(),
        description: newGroupDesc.trim() || null,
        display_order: serviceGroups.length + 1,
      });
      if (res.success && res.data) {
        toast.success(`Service Group "${newGroupName}" created.`);
        setNewGroupName('');
        setNewGroupDesc('');
        setGroupModalOpen(false);
        await fetchData();
        setServiceGroupId(res.data.id);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create service group'));
    } finally {
      setIsCreatingGroup(false);
    }
  };

  // Helper: compute next default date
  const getNextDefaultDate = (days: EventDayItem[]) => {
    if (!days || days.length === 0) return new Date().toISOString().split('T')[0];
    const sorted = [...days].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastDate = new Date(sorted[0].date);
    lastDate.setDate(lastDate.getDate() + 1);
    return lastDate.toISOString().split('T')[0];
  };

  // Open Standalone Add Day Modal
  const openAddDayModal = () => {
    const nextDate = getNextDefaultDate(eventDays);
    setNewDayDate(nextDate);
    const nextNum = eventDays.length + 1;
    setNewDayDisplayName(`Day ${nextNum}`);
    setNewDayNotes('');
    setDayModalOpen(true);
  };

  // Create Custom Event Day
  const handleCreateEventDay = async (autoAssignToItemModal: boolean = false) => {
    if (!newDayDate) {
      toast.warning('Please select a date for the event day');
      return;
    }
    try {
      setIsCreatingDay(true);
      const res = await eventItemsService.createEventDay(eventId, {
        date: newDayDate,
        display_name: newDayDisplayName.trim() || undefined,
        notes: newDayNotes.trim() || null,
      });
      if (res.success && res.data) {
        const createdDay = res.data;
        const displayName = createdDay.displayName || createdDay.display_name || `Day ${createdDay.dayNumber || createdDay.day_number}`;
        toast.success(`Event day "${displayName}" added successfully!`);
        setDayModalOpen(false);
        setInlineAddDayOpen(false);
        setNewDayDate('');
        setNewDayDisplayName('');
        setNewDayNotes('');

        // Append to event days
        setEventDays((prev) => [...prev, createdDay]);

        // If in item modal, auto-select & initialize row
        if (autoAssignToItemModal || modalOpen) {
          setSelectedDayIds((prev) => [...prev, createdDay.id]);
          const currentRate = Number(basePrice) || 0;
          const currentQty = Number(quantity) || 1;
          const currentVendorId = vendorMode === 'master' ? selectedVendorId : '';
          const currentVendorName =
            vendorMode === 'master'
              ? masterVendors.find((v) => v.id === selectedVendorId)?.vendor_name
              : externalVendorName;

          setDayRows((prev) => ({
            ...prev,
            [createdDay.id]: {
              vendorId: currentVendorId,
              vendorName: currentVendorName || '',
              quantity: currentQty,
              rate: currentRate,
              price:
                pricingType === 'quantity_based'
                  ? currentQty * currentRate
                  : pricingType === 'recurring_daily'
                  ? Number(pricePerDay) || 0
                  : 0,
            },
          }));
        }

        // Refresh breakdowns
        const [dayBreakdownRes, vendorBreakdownRes] = await Promise.all([
          eventItemsService.getDayBreakdown(eventId).catch(() => null),
          eventItemsService.getVendorBreakdown(eventId).catch(() => null),
        ]);
        if (dayBreakdownRes?.success && dayBreakdownRes.data) setDayBreakdown(dayBreakdownRes.data);
        if (vendorBreakdownRes?.success && vendorBreakdownRes.data) setVendorBreakdown(vendorBreakdownRes.data);
      } else {
        toast.error(res.message || 'Failed to create event day');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to add event day'));
    } finally {
      setIsCreatingDay(false);
    }
  };

  // Delete Custom Event Day
  const handleDeleteEventDay = async () => {
    if (!dayToDelete) return;
    try {
      setIsDeletingDay(true);
      const res = await eventItemsService.deleteEventDay(eventId, dayToDelete.id);
      if (res.success) {
        toast.success(`Event day removed.`);
        setDayToDelete(null);
        await fetchData();
      } else {
        toast.error(res.message || 'Failed to delete event day');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete event day'));
    } finally {
      setIsDeletingDay(false);
    }
  };

  // Toggle Group Accordion
  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // Flat Table Columns
  const tableColumns: Column<EventServiceItem>[] = [
    {
      key: 'name',
      header: 'Service / Item Name',
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            {row.is_default_navratri && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Default Theme Item" />
            )}
            <span>{row.name}</span>
          </div>
          {row.description && <p className="text-[11px] text-slate-500 line-clamp-1">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'group',
      header: 'Service Group',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
          {row.service_group?.name || row.category}
        </span>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor / Agency',
      render: (row) => {
        const vendor = row.vendor?.vendor_name || row.vendor_name || row.vendor_contract?.vendor_name;
        if (!vendor) return <span className="text-slate-400 text-xs italic">Unassigned</span>;
        return (
          <div className="flex items-center gap-1 text-xs text-indigo-700 font-medium">
            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="truncate max-w-[140px]">{vendor}</span>
          </div>
        );
      },
    },
    {
      key: 'days',
      header: 'Assigned Days',
      render: (row) => {
        const count = row.day_assignments?.length || (Array.isArray(row.applicable_days) ? row.applicable_days.length : 1);
        const isAll = count === eventDays.length && count > 1;
        return (
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${isAll ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
            {isAll ? `All ${count} Days` : `${count} Day${count > 1 ? 's' : ''}`}
          </span>
        );
      },
    },
    {
      key: 'pricing_type',
      header: 'Pricing Model',
      render: (row) => {
        switch (row.pricing_type) {
          case 'fixed':
            return <span className="text-xs text-slate-700 font-medium">Fixed Price</span>;
          case 'day_wise':
            return <span className="text-xs text-purple-700 font-medium">Day-Wise</span>;
          case 'recurring_daily':
            return <span className="text-xs text-blue-700 font-medium">Daily Recurring</span>;
          case 'quantity_based':
            return <span className="text-xs text-emerald-700 font-medium">Quantity Based</span>;
          default:
            return <span className="text-xs text-slate-500">Standard</span>;
        }
      },
    },
    {
      key: 'total_price',
      header: 'Estimated Cost',
      align: 'right',
      render: (row) => (
        <div>
          <CurrencyDisplay amount={row.total_price} className="font-extrabold text-slate-900 text-sm" />
          {Number(row.total_price) === 0 && (
            <span className="text-[10px] text-amber-600 block">Pricing Pending</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard permission={Permissions.EVENT_UPDATE}>
            <button
              type="button"
              onClick={() => openEditModal(row)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Configure Item & Price"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
          {!row.is_default_navratri && (
            <PermissionGuard permission={Permissions.EVENT_UPDATE}>
              <button
                type="button"
                onClick={() => setItemToDelete(row)}
                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Delete Item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </PermissionGuard>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Top KPI Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Services / Items</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-slate-900">{summaryMetrics.totalItems}</span>
            <span className="text-[11px] text-slate-400">across {summaryMetrics.totalGroupsCount} groups</span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Estimated Budget</span>
            <Calculator className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1">
            <CurrencyDisplay
              amount={summaryMetrics.totalEstimatedCost}
              className="text-xl font-extrabold text-emerald-700"
            />
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Multi-Day Schedule</span>
            <CalendarDays className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-900">{summaryMetrics.activeDaysCount}</span>
            <span className="text-[11px] text-slate-400">Event Days</span>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contracted Vendors</span>
            <Building2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-purple-700">{summaryMetrics.contractedVendorsCount}</span>
            <span className="text-[11px] text-slate-400">Assigned Vendors</span>
          </div>
        </div>
      </div>

      {/* Main Container Card */}
      <Card
        title="Event Service & Item Planning"
        subtitle="Organize festival services by Service Groups (Catering, DJ, Decor, etc.) with day-wise vendor and pricing assignments."
        headerAction={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <PermissionGuard permission={Permissions.EVENT_UPDATE}>
              <Button
                variant="outline"
                size="sm"
                onClick={openAddDayModal}
                leftIcon={<CalendarDays className="w-3.5 h-3.5 text-indigo-600" />}
              >
                + Add Event Day
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGroupModalOpen(true)}
                leftIcon={<Tag className="w-3.5 h-3.5 text-slate-500" />}
              >
                + Group Master
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => openCreateModal()}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                + Add Service / Item
              </Button>
            </PermissionGuard>
          </div>
        }
      >
        {/* Navigation View Switcher & Filter Controls */}
        <div className="mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1 border-b border-slate-100 pb-3">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('groups')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'groups'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>By Service Group</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('days')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'days'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Day-Wise Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('vendors')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'vendors'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Vendor View</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Flat Table</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search items, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {viewMode === 'groups' && (
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="h-8 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Groups ({serviceGroups.length})</option>
                {serviceGroups.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* VIEW 1: GROUPED BY SERVICE GROUP */}
        {viewMode === 'groups' && (
          Object.entries(groupedItems).length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <Tag className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-700">No Service Groups or Items Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                No categories have been added yet. Super Admin can add category groups using "+ Group Master" or add service items directly.
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <PermissionGuard permission={Permissions.EVENT_UPDATE}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGroupModalOpen(true)}
                    leftIcon={<Tag className="w-3.5 h-3.5 text-slate-500" />}
                  >
                    + Group Master
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => openCreateModal()}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    + Add Service / Item
                  </Button>
                </PermissionGuard>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(groupedItems).map(([groupName, groupData]) => {
                if (groupData.items.length === 0 && selectedGroupFilter) return null;
                const isExpanded = expandedGroups[groupName] !== false;

                return (
                  <div
                    key={groupName}
                    className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs transition-all"
                  >
                    {/* Accordion Header */}
                    <div
                      onClick={() => toggleGroup(groupName)}
                      className="p-3.5 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between border-b border-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          className="p-1 rounded text-slate-500 hover:text-indigo-600"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-900">{groupName}</h4>
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                              {groupData.items.length} {groupData.items.length === 1 ? 'Service' : 'Services'}
                            </span>
                          </div>
                          {groupData.group?.description && (
                            <p className="text-[11px] text-slate-500 mt-0.5">{groupData.group.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <div className="text-right">
                          <span className="text-[10px] font-semibold text-slate-400 block uppercase">Group Total</span>
                          <CurrencyDisplay
                            amount={groupData.totalCost}
                            className="text-sm font-extrabold text-slate-900"
                          />
                        </div>

                        <PermissionGuard permission={Permissions.EVENT_UPDATE}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCreateModal(groupName)}
                            leftIcon={<Plus className="w-3 h-3" />}
                          >
                            Add Item
                          </Button>
                        </PermissionGuard>
                      </div>
                    </div>

                    {/* Accordion Content */}
                    {isExpanded && (
                      <div className="p-0">
                        {groupData.items.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-xs">
                            No items added to {groupName} yet. Click "+ Add Item" above to add one.
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {groupData.items.map((item) => {
                              const vendor = item.vendor?.vendor_name || item.vendor_name || item.vendor_contract?.vendor_name;
                              const assignedDaysCount =
                                item.day_assignments?.length ||
                                (Array.isArray(item.applicable_days) ? item.applicable_days.length : 1);
                              const isAllDays = assignedDaysCount === eventDays.length && assignedDaysCount > 1;

                              return (
                                <div
                                  key={item.id}
                                  className="p-3 sm:p-3.5 hover:bg-indigo-50/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                                      {item.is_default_navratri && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-semibold">
                                          Default Theme
                                        </span>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-slate-500">{item.description}</p>
                                    )}
                                    <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap pt-0.5">
                                      {/* Vendor */}
                                      <div className="flex items-center gap-1 text-indigo-700">
                                        <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                        <span className="font-medium">
                                          {vendor || <span className="text-slate-400 italic">No Vendor Assigned</span>}
                                        </span>
                                      </div>

                                      {/* Days */}
                                      <div className="flex items-center gap-1 text-slate-700">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="font-medium">
                                          {isAllDays ? `All ${assignedDaysCount} Days` : `${assignedDaysCount} Days Assigned`}
                                        </span>
                                      </div>

                                      {/* Pricing Type */}
                                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium">
                                        {item.pricing_type === 'fixed' && 'Fixed Price'}
                                        {item.pricing_type === 'day_wise' && 'Day-Wise Pricing'}
                                        {item.pricing_type === 'recurring_daily' && `Daily (₹${item.price_per_day || item.base_price}/day)`}
                                        {item.pricing_type === 'quantity_based' && `${item.quantity || 1} ${item.unit || 'Nos'} @ ₹${item.base_price}`}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Cost & Actions */}
                                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                    <div className="text-right">
                                      <CurrencyDisplay
                                        amount={item.total_price}
                                        className="text-base font-extrabold text-slate-900"
                                      />
                                      {Number(item.total_price) === 0 && (
                                        <span className="text-[10px] text-amber-600 block">Pending Pricing</span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <PermissionGuard permission={Permissions.EVENT_UPDATE}>
                                        <button
                                          type="button"
                                          onClick={() => openEditModal(item)}
                                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                          title="Edit Item"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                      </PermissionGuard>
                                      {!item.is_default_navratri && (
                                        <PermissionGuard permission={Permissions.EVENT_UPDATE}>
                                          <button
                                            type="button"
                                            onClick={() => setItemToDelete(item)}
                                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                                            title="Delete Item"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </PermissionGuard>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* VIEW 2: DAY-WISE PLANNING SCHEDULE */}
        {viewMode === 'days' && (
          <div className="space-y-4">
            {/* Days Horizontal Tab Bar */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedDayId('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedDayId === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All Event Days ({dayBreakdown?.days?.length || eventDays.length})
                </button>

                {dayBreakdown?.days?.map((day) => (
                  <button
                    key={day.dayId}
                    type="button"
                    onClick={() => setSelectedDayId(day.dayId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedDayId === day.dayId
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Day {day.dayNumber}</span>
                    <span className="text-[10px] ml-1.5 opacity-80">
                      ({new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })})
                    </span>
                  </button>
                ))}
              </div>

              <PermissionGuard permission={Permissions.EVENT_UPDATE}>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openAddDayModal}
                  leftIcon={<Plus className="w-3.5 h-3.5 text-indigo-600" />}
                  className="whitespace-nowrap shrink-0"
                >
                  Add Day
                </Button>
              </PermissionGuard>
            </div>

            {/* Days Content Cards */}
            {dayBreakdown?.days
              ?.filter((d) => selectedDayId === 'all' || d.dayId === selectedDayId)
              .map((day) => {
                const matchingDayItem = eventDays.find((ed) => ed.id === day.dayId);
                return (
                  <div key={day.dayId} className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-xs font-bold">
                            Day {day.dayNumber}
                          </span>
                          <h4 className="text-sm font-extrabold text-slate-900">
                            {day.displayName || `Day ${day.dayNumber} - ${new Date(day.date).toLocaleDateString('en-GB')}`}
                          </h4>
                          {day.services.length === 0 && matchingDayItem && (
                            <PermissionGuard permission={Permissions.EVENT_UPDATE}>
                              <button
                                type="button"
                                onClick={() => setDayToDelete(matchingDayItem)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                title="Delete Day"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </PermissionGuard>
                          )}
                        </div>
                        {day.notes && <p className="text-xs text-slate-500 mt-1">{day.notes}</p>}
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase block">Daily Cost</span>
                        <CurrencyDisplay
                          amount={day.totalCost}
                          className="text-base font-extrabold text-emerald-700"
                        />
                      </div>
                    </div>

                  {day.services.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">No services assigned for this day.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {day.services.map((srv, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                                {srv.serviceGroup}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{srv.serviceName}</span>
                            </div>
                            <CurrencyDisplay
                              amount={srv.price}
                              className="text-xs font-extrabold text-slate-900"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                            <div className="flex items-center gap-1 text-slate-700 font-medium">
                              <Building2 className="w-3 h-3 text-indigo-500" />
                              <span className="truncate max-w-[120px]">{srv.vendorName}</span>
                            </div>
                            <span>
                              {srv.pricingType === 'quantity_based'
                                ? `${srv.quantity} ${srv.unit || 'Nos'} @ ₹${srv.rate}`
                                : srv.pricingType}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 3: VENDOR COORDINATION VIEW */}
        {viewMode === 'vendors' && (
          <div className="space-y-3">
            {vendorBreakdown?.vendors?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                No vendors currently assigned to event services.
              </div>
            ) : (
              vendorBreakdown?.vendors?.map((v, idx) => (
                <div key={idx} className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-600" />
                        <h4 className="text-sm font-extrabold text-slate-900">{v.vendorName}</h4>
                        {v.isMasterVendor && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">
                            Vendor Master
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        {v.contactPerson && <span>Contact: {v.contactPerson}</span>}
                        {v.mobileNumber && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {v.mobileNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">Total Payout</span>
                      <CurrencyDisplay
                        amount={v.totalAmount}
                        className="text-base font-extrabold text-indigo-700"
                      />
                    </div>
                  </div>

                  {/* Services delivered by this vendor */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Assigned Services:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {v.assignments.map((assign, aIdx) => (
                        <div key={aIdx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900">
                            <span>{assign.serviceName}</span>
                            <CurrencyDisplay amount={assign.price} />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span className="text-indigo-600 font-semibold">{assign.serviceGroup}</span>
                            <span>{assign.dayName || (assign.dayNumber ? `Day ${assign.dayNumber}` : 'All Days')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* VIEW 4: FLAT TABLE */}
        {viewMode === 'table' && (
          <Table
            columns={tableColumns}
            data={items}
            isLoading={isLoading}
            emptyText="No event items found."
          />
        )}
      </Card>

      {/* ADD / EDIT ITEM MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `Configure: ${editingItem.name}` : 'Add Event Service / Item'}
        description="Select Service Group, assign Master or External Vendor, and configure multi-day pricing."
        size="lg"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          {/* Section 1: Service Group & Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Service Group <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setGroupModalOpen(true)}
                  className="text-[11px] text-indigo-600 hover:underline font-semibold"
                >
                  + New Group
                </button>
              </div>
              <Select
                value={serviceGroupId}
                onChange={(e) => setServiceGroupId(e.target.value)}
              >
                <option value="">
                  {serviceGroups.length === 0
                    ? 'No Groups Yet (Click "+ New Group" to create)'
                    : 'Select Service Group (Optional)'}
                </option>
                {serviceGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Item / Service Name"
              placeholder="e.g. Dinner, DJ System, Stage Mandap, Prasad"
              requiredIndicator
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Textarea
            label="Description / Technical Requirements"
            placeholder="Specifications, items included, sound channels, delivery timings..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Section 2: Vendor Selection */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Vendor / Agency Assignment</label>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="vendorMode"
                    checked={vendorMode === 'master'}
                    onChange={() => setVendorMode('master')}
                    className="text-indigo-600"
                  />
                  <span>Vendor Master</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="vendorMode"
                    checked={vendorMode === 'external'}
                    onChange={() => setVendorMode('external')}
                    className="text-indigo-600"
                  />
                  <span>External / Unlinked</span>
                </label>
              </div>
            </div>

            {vendorMode === 'master' ? (
              <div className="space-y-2">
                <Select
                  value={selectedVendorId}
                  onChange={(e) => {
                    setSelectedVendorId(e.target.value);
                    applyVendorToAllDays(e.target.value);
                  }}
                >
                  <option value="">-- Select Vendor from Vendor Master --</option>
                  {masterVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName || v.vendor_name} ({v.shortName || v.short_name || 'Vendor'}) - {v.mobileNo || v.mobile_no}
                    </option>
                  ))}
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Input
                  label="Vendor / Agency Name"
                  placeholder="e.g. Sound King Pro"
                  value={externalVendorName}
                  onChange={(e) => {
                    setExternalVendorName(e.target.value);
                    applyVendorToAllDays('', e.target.value);
                  }}
                  requiredIndicator
                />
                <Input
                  label="Contact Person"
                  placeholder="e.g. Rajesh Kumar"
                  value={externalContactPerson}
                  onChange={(e) => setExternalContactPerson(e.target.value)}
                />
                <Input
                  label="Contact Number"
                  placeholder="e.g. 9876543210"
                  value={externalPhone}
                  onChange={(e) => setExternalPhone(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Section 3: Pricing Model */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 block">Pricing Model</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPricingType('fixed')}
                className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                  pricingType === 'fixed'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Fixed Price
              </button>

              <button
                type="button"
                onClick={() => setPricingType('day_wise')}
                className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                  pricingType === 'day_wise'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Day-Wise Price
              </button>

              <button
                type="button"
                onClick={() => setPricingType('recurring_daily')}
                className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                  pricingType === 'recurring_daily'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Recurring Daily
              </button>

              <button
                type="button"
                onClick={() => setPricingType('quantity_based')}
                className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                  pricingType === 'quantity_based'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Quantity Based
              </button>
            </div>

            {/* Inputs based on pricing type */}
            {pricingType === 'fixed' && (
              <Input
                label="Total Fixed Contract Amount (₹)"
                type="number"
                placeholder="e.g. 50000"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                requiredIndicator
              />
            )}

            {pricingType === 'recurring_daily' && (
              <Input
                label="Daily Recurring Rate (₹ / Day)"
                type="number"
                placeholder="e.g. 10000"
                value={pricePerDay}
                onChange={(e) => {
                  setPricePerDay(e.target.value);
                  applyRateToAllDays(Number(e.target.value) || 0);
                }}
                requiredIndicator
              />
            )}

            {pricingType === 'quantity_based' && (
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Default Qty"
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    setQuantity(e.target.value);
                    applyRateToAllDays(Number(basePrice) || 0, Number(e.target.value) || 1);
                  }}
                  requiredIndicator
                />
                <Input
                  label="Unit"
                  placeholder="e.g. Plates, Chairs"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
                <Input
                  label="Rate / Unit (₹)"
                  type="number"
                  placeholder="e.g. 250"
                  value={basePrice}
                  onChange={(e) => {
                    setBasePrice(e.target.value);
                    applyRateToAllDays(Number(e.target.value) || 0, Number(quantity) || 1);
                  }}
                  requiredIndicator
                />
              </div>
            )}
          </div>

          {/* Section 4: Multi-Day Assignments */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-800">Event Days Assignment</label>
                <button
                  type="button"
                  onClick={() => {
                    const nextDate = getNextDefaultDate(eventDays);
                    setNewDayDate(nextDate);
                    setNewDayDisplayName(`Day ${eventDays.length + 1}`);
                    setInlineAddDayOpen((prev) => !prev);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-[11px] font-semibold transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Day</span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="dayAssignmentMode"
                    checked={dayAssignmentMode === 'all'}
                    onChange={() => {
                      setDayAssignmentMode('all');
                      setSelectedDayIds(eventDays.map((d) => d.id));
                    }}
                  />
                  <span>All Days ({eventDays.length})</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    name="dayAssignmentMode"
                    checked={dayAssignmentMode === 'custom'}
                    onChange={() => setDayAssignmentMode('custom')}
                  />
                  <span>Select Specific Days</span>
                </label>
              </div>
            </div>

            {/* Inline Quick Add Day Sub-Form */}
            {inlineAddDayOpen && (
              <div className="p-3 bg-white rounded-lg border border-indigo-200 shadow-2xs space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    Add Custom Event Day (Select Date & Name)
                  </span>
                  <button
                    type="button"
                    onClick={() => setInlineAddDayOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase mb-0.5 block">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={newDayDate}
                      onChange={(e) => setNewDayDate(e.target.value)}
                      className="w-full h-8 px-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase mb-0.5 block">
                      Day Label / Title
                    </label>
                    <input
                      type="text"
                      placeholder={`e.g. Day ${eventDays.length + 1} / Garba Night / Grand Finale`}
                      value={newDayDisplayName}
                      onChange={(e) => setNewDayDisplayName(e.target.value)}
                      className="w-full h-8 px-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setInlineAddDayOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    isLoading={isCreatingDay}
                    onClick={() => handleCreateEventDay(true)}
                    leftIcon={<Plus className="w-3 h-3" />}
                  >
                    Add Day
                  </Button>
                </div>
              </div>
            )}

            {/* Day Selection Checkbox Chips */}
            {dayAssignmentMode === 'custom' && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-lg border border-slate-200">
                {eventDays.map((day) => {
                  const isChecked = selectedDayIds.includes(day.id);
                  const dayNum = day.dayNumber || day.day_number;
                  const label = day.displayName || day.display_name || `Day ${dayNum}`;
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        setSelectedDayIds((prev) =>
                          isChecked ? prev.filter((id) => id !== day.id) : [...prev, day.id]
                        );
                      }}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                        isChecked
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {label} ({new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Day-Wise Configuration Grid */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-600 uppercase block">
                Day-Wise Breakdown & Vendor Details:
              </span>
              {eventDays
                .filter((d) => dayAssignmentMode === 'all' || selectedDayIds.includes(d.id))
                .map((day) => {
                  const row = dayRows[day.id] || {};
                  const dayNum = day.dayNumber || day.day_number;
                  const label = day.displayName || day.display_name || `Day ${dayNum}`;
                  return (
                    <div
                      key={day.id}
                      className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="font-bold text-slate-800 shrink-0 w-32">
                        <span className="truncate block max-w-[125px]" title={label}>{label}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          {new Date(day.date).toLocaleDateString('en-GB')}
                        </span>
                      </div>

                      {/* Day Vendor Override */}
                      <div className="flex-1 min-w-[140px]">
                        <select
                          value={row.vendorId || (vendorMode === 'master' ? selectedVendorId : '')}
                          onChange={(e) => {
                            const vId = e.target.value;
                            setDayRows((prev) => ({
                              ...prev,
                              [day.id]: {
                                ...prev[day.id],
                                vendorId: vId,
                                vendorName: masterVendors.find((v) => v.id === vId)?.vendor_name || '',
                              },
                            }));
                          }}
                          className="w-full h-7 px-2 text-xs border border-slate-200 rounded bg-slate-50"
                        >
                          <option value="">
                            {externalVendorName ? `External: ${externalVendorName}` : '-- Inherit Item Vendor --'}
                          </option>
                          {masterVendors.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.vendorName || v.vendor_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Day Rate / Price */}
                      {pricingType === 'quantity_based' ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            placeholder="Qty"
                            value={row.quantity !== undefined ? row.quantity : quantity}
                            onChange={(e) => {
                              const q = Number(e.target.value) || 0;
                              const r = row.rate !== undefined ? row.rate : Number(basePrice) || 0;
                              setDayRows((prev) => ({
                                ...prev,
                                [day.id]: {
                                  ...prev[day.id],
                                  quantity: q,
                                  price: q * r,
                                },
                              }));
                            }}
                            className="w-16 h-7 px-1.5 text-xs border border-slate-200 rounded text-center"
                          />
                          <span className="text-slate-400">×</span>
                          <input
                            type="number"
                            placeholder="Rate"
                            value={row.rate !== undefined ? row.rate : basePrice}
                            onChange={(e) => {
                              const r = Number(e.target.value) || 0;
                              const q = row.quantity !== undefined ? row.quantity : Number(quantity) || 1;
                              setDayRows((prev) => ({
                                ...prev,
                                [day.id]: {
                                  ...prev[day.id],
                                  rate: r,
                                  price: q * r,
                                },
                              }));
                            }}
                            className="w-20 h-7 px-1.5 text-xs border border-slate-200 rounded text-right"
                          />
                        </div>
                      ) : pricingType === 'day_wise' ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-slate-400">₹</span>
                          <input
                            type="number"
                            placeholder="Day Amount"
                            value={row.price !== undefined ? row.price : ''}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setDayRows((prev) => ({
                                ...prev,
                                [day.id]: {
                                  ...prev[day.id],
                                  price: val,
                                },
                              }));
                            }}
                            className="w-28 h-7 px-2 text-xs border border-slate-200 rounded text-right font-bold text-slate-800"
                          />
                        </div>
                      ) : null}

                      {/* Day Calculated Price */}
                      <div className="text-right shrink-0 min-w-[70px]">
                        <CurrencyDisplay
                          amount={
                            pricingType === 'quantity_based'
                              ? (row.quantity !== undefined ? Number(row.quantity) : Number(quantity) || 1) *
                                (row.rate !== undefined ? Number(row.rate) : Number(basePrice) || 0)
                              : pricingType === 'recurring_daily'
                              ? Number(pricePerDay) || 0
                              : pricingType === 'fixed'
                              ? (Number(basePrice) || 0) /
                                (dayAssignmentMode === 'all' ? eventDays.length : selectedDayIds.length || 1)
                              : row.price || 0
                          }
                          className="font-extrabold text-slate-900"
                        />
                      </div>

                      {/* Remove Day Row Action */}
                      <button
                        type="button"
                        onClick={() => {
                          if (dayAssignmentMode === 'all') {
                            setDayAssignmentMode('custom');
                            setSelectedDayIds(eventDays.filter((d) => d.id !== day.id).map((d) => d.id));
                          } else {
                            setSelectedDayIds((prev) => prev.filter((id) => id !== day.id));
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                        title="Remove this day assignment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* Calculated Item Grand Total Banner */}
            <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Calculated Item Total Amount:</span>
              <CurrencyDisplay amount={calculatedFormTotal} className="text-lg font-extrabold text-indigo-700" />
            </div>
          </div>

          <Textarea
            label="Internal Notes / Payment Terms (Optional)"
            placeholder="Payment milestones, special guarantees, vendor terms..."
            rows={1}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingItem ? 'Save Service Item' : 'Create Service Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* QUICK SERVICE GROUP CREATE MODAL */}
      <Modal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        title="Add Service Group Master"
        description="Create a new logical category for festival services."
      >
        <form onSubmit={handleCreateServiceGroup} className="space-y-3">
          <Input
            label="Group Name"
            placeholder="e.g. Transportation & Logistics, VIP Guest Management"
            requiredIndicator
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <Textarea
            label="Description (Optional)"
            placeholder="Scope of services under this group..."
            rows={2}
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
          />
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setGroupModalOpen(false)}
              disabled={isCreatingGroup}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingGroup}>
              Create Group
            </Button>
          </div>
        </form>
      </Modal>

      {/* STANDALONE ADD EVENT DAY MODAL */}
      <Modal
        isOpen={dayModalOpen}
        onClose={() => setDayModalOpen(false)}
        title="Add Event Day"
        description="Add a custom or multi-day festival day schedule with specific date and display title."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateEventDay(false);
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Event Day Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={newDayDate}
              onChange={(e) => setNewDayDate(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>
          <Input
            label="Day Title / Display Name"
            placeholder={`e.g. Day ${eventDays.length + 1} / Garba Night / Maha Aarti`}
            value={newDayDisplayName}
            onChange={(e) => setNewDayDisplayName(e.target.value)}
          />
          <Textarea
            label="Day Notes / Schedule (Optional)"
            placeholder="Special rituals, guest timings, or daily notes..."
            rows={2}
            value={newDayNotes}
            onChange={(e) => setNewDayNotes(e.target.value)}
          />
          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDayModalOpen(false)}
              disabled={isCreatingDay}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingDay} leftIcon={<Plus className="w-3.5 h-3.5" />}>
              Add Day
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION DIALOG FOR SERVICE ITEM */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        title="Delete Service Item"
        message={
          <span>
            Are you sure you want to remove <strong>{itemToDelete?.name}</strong> from this event?
          </span>
        }
        confirmLabel="Delete Item"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* DELETE CONFIRMATION DIALOG FOR EVENT DAY */}
      <ConfirmDialog
        isOpen={!!dayToDelete}
        onClose={() => setDayToDelete(null)}
        onConfirm={handleDeleteEventDay}
        title="Delete Event Day"
        message={
          <span>
            Are you sure you want to remove{' '}
            <strong>
              {dayToDelete?.displayName || dayToDelete?.display_name || `Day ${dayToDelete?.dayNumber || dayToDelete?.day_number}`}
            </strong>{' '}
            ({dayToDelete?.date ? new Date(dayToDelete.date).toLocaleDateString('en-GB') : ''}) from this event?
          </span>
        }
        confirmLabel="Delete Day"
        variant="danger"
        isLoading={isDeletingDay}
      />
    </div>
  );
};

export default EventItemsTab;
