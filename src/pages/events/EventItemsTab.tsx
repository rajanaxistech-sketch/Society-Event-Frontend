import React, { useEffect, useState, useMemo } from 'react';
import { eventItemsService } from '../../api/eventItemsService';
import { eventVendorsService } from '../../api/eventVendorsService';
import { EventServiceItem, EventContractItem, PricingType } from '../../types';
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
  DollarSign,
  Calendar,
  Layers,
  CheckCircle2,
  RefreshCw,
  Calculator,
  Tag,
  Building2,
} from 'lucide-react';

interface EventItemsTabProps {
  eventId: string;
  isNavratri?: boolean;
}

const CATEGORY_OPTIONS = [
  'Sound & Audio',
  'Stage & Fabrication',
  'Decoration & Floral',
  'Electrical & Lighting',
  'Entertainment & Anchoring',
  'Live Performance',
  'Food & Catering',
  'Beverages & Refreshments',
  'Security',
  'Generator & Power',
  'Photography & Videography',
  'Medical Support',
  'Sanitation & Cleaning',
  'Volunteers & Operations',
  'Printing & Banners',
  'Transportation & Logistics',
  'Other Custom Requirement',
];

const NAVRATRI_DAYS = Array.from({ length: 9 }, (_, i) => ({
  dayNum: i + 1,
  label: `Day ${i + 1} (Norta ${i + 1})`,
}));

export const EventItemsTab: React.FC<EventItemsTabProps> = ({ eventId, isNavratri }) => {
  const toast = useToast();
  const { can } = usePermission();

  const [items, setItems] = useState<EventServiceItem[]>([]);
  const [vendors, setVendors] = useState<EventContractItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');

  // Add / Edit Item Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventServiceItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [vendorContractId, setVendorContractId] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [description, setDescription] = useState('');
  const [pricingType, setPricingType] = useState<PricingType>('fixed');
  const [basePrice, setBasePrice] = useState('0');
  const [pricePerDay, setPricePerDay] = useState('0');
  const [numberOfDays, setNumberOfDays] = useState('9');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('Nos');
  const [dayWisePrices, setDayWisePrices] = useState<Record<string, number>>({});
  const [selectedDays, setSelectedDays] = useState<string[]>(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
  const [notes, setNotes] = useState('');

  // Delete modal
  const [itemToDelete, setItemToDelete] = useState<EventServiceItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [itemsRes, vendorsRes] = await Promise.all([
        eventItemsService.listByEvent(eventId, { limit: 100 }),
        eventVendorsService.listByEvent(eventId, { limit: 100 }),
      ]);

      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data);
      }
      if (vendorsRes.success && vendorsRes.data) {
        setVendors(vendorsRes.data);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load event items'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  // Dynamic calculated total in form
  const calculatedFormTotal = useMemo(() => {
    switch (pricingType) {
      case 'fixed':
        return Number(basePrice) || 0;
      case 'day_wise': {
        return Object.values(dayWisePrices).reduce((sum, val) => sum + (Number(val) || 0), 0);
      }
      case 'recurring_daily':
        return (Number(pricePerDay) || 0) * (Number(numberOfDays) || 1);
      case 'quantity_based':
        return (Number(quantity) || 1) * (Number(basePrice) || 0);
      default:
        return Number(basePrice) || 0;
    }
  }, [pricingType, basePrice, dayWisePrices, pricePerDay, numberOfDays, quantity]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalItems = items.length;
    const totalEstimatedCost = items.reduce((acc, i) => acc + Number(i.total_price || 0), 0);
    const defaultNavratriItems = items.filter((i) => i.is_default_navratri).length;
    const customItems = items.filter((i) => !i.is_default_navratri).length;

    return {
      totalItems,
      totalEstimatedCost,
      defaultNavratriItems,
      customItems,
    };
  }, [items]);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCategory(CATEGORY_OPTIONS[0]);
    setVendorContractId('');
    setVendorName('');
    setDescription('');
    setPricingType('fixed');
    setBasePrice('0');
    setPricePerDay('0');
    setNumberOfDays('9');
    setQuantity('1');
    setUnit('Nos');
    setDayWisePrices({});
    setSelectedDays(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (item: EventServiceItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setVendorContractId(item.vendor_contract_id || '');
    setVendorName(item.vendor_name || '');
    setDescription(item.description || '');
    setPricingType(item.pricing_type || 'fixed');
    setBasePrice(String(item.base_price ?? item.total_price ?? 0));
    setPricePerDay(String(item.price_per_day ?? 0));
    setNumberOfDays(String(item.number_of_days ?? 9));
    setQuantity(String(item.quantity ?? 1));
    setUnit(item.unit || 'Nos');
    setDayWisePrices(item.day_wise_prices || {});
    setSelectedDays(
      item.applicable_days && Array.isArray(item.applicable_days)
        ? (item.applicable_days as string[])
        : ['1', '2', '3', '4', '5', '6', '7', '8', '9']
    );
    setNotes(item.notes || '');
    setModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Please enter an item or service name');
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        event_id: eventId,
        vendor_contract_id: vendorContractId || null,
        name: name.trim(),
        category,
        description: description || null,
        vendor_name: vendorName || (vendors.find((v) => v.id === vendorContractId)?.vendor_name ?? null),
        pricing_type: pricingType,
        base_price: Number(basePrice) || 0,
        price_per_day: pricingType === 'recurring_daily' ? Number(pricePerDay) || 0 : null,
        number_of_days: pricingType === 'recurring_daily' ? Number(numberOfDays) || 1 : null,
        applicable_days: pricingType === 'day_wise' ? selectedDays : null,
        day_wise_prices: pricingType === 'day_wise' ? dayWisePrices : null,
        quantity: pricingType === 'quantity_based' ? Number(quantity) || 1 : null,
        unit: pricingType === 'quantity_based' ? unit : null,
        total_price: calculatedFormTotal,
        notes: notes || null,
      };

      if (editingItem) {
        const res = await eventItemsService.update(editingItem.id, payload);
        if (res.success) {
          toast.success(`Item "${name}" updated successfully.`);
          setModalOpen(false);
          fetchData();
        } else {
          toast.error(res.message || 'Failed to update item');
        }
      } else {
        const res = await eventItemsService.create({ ...payload, is_default_navratri: false });
        if (res.success) {
          toast.success(`Custom item "${name}" added successfully.`);
          setModalOpen(false);
          fetchData();
        } else {
          toast.error(res.message || 'Failed to add item');
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save event item'));
    } finally {
      setIsSaving(false);
    }
  };

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

  const filteredItems = useMemo(() => {
    if (!categoryFilter) return items;
    return items.filter((i) => i.category === categoryFilter);
  }, [items, categoryFilter]);

  const columns: Column<EventServiceItem>[] = [
    {
      key: 'name',
      header: 'Item / Service Name',
      render: (row) => (
        <div>
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            {row.is_default_navratri && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Default Navratri Item" />
            )}
            <span>{row.name}</span>
          </div>
          {row.description && <p className="text-[11px] text-slate-500 line-clamp-1">{row.description}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-semibold">
          {row.category}
        </span>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor / Agency',
      render: (row) => {
        const vendor = row.vendor_contract?.vendor_name || row.vendor_name;
        if (!vendor) return <span className="text-slate-400 text-xs italic">Unassigned</span>;
        return (
          <div className="flex items-center gap-1 text-xs text-indigo-700 font-medium">
            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>{vendor}</span>
          </div>
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
            return <span className="text-xs text-purple-700 font-medium">Day-Wise ({Object.keys(row.day_wise_prices || {}).length} Days)</span>;
          case 'recurring_daily':
            return <span className="text-xs text-blue-700 font-medium">Daily ({row.number_of_days || 9} Days)</span>;
          case 'quantity_based':
            return <span className="text-xs text-emerald-700 font-medium">{row.quantity || 1} {row.unit || 'Units'}</span>;
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
                title="Delete Custom Item"
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
    <div className="space-y-3.5">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Items</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900">{summaryMetrics.totalItems}</span>
            <span className="text-[10px] text-slate-400">
              ({summaryMetrics.defaultNavratriItems} Default, {summaryMetrics.customItems} Custom)
            </span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Event Cost</span>
            <Calculator className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-1">
            <CurrencyDisplay
              amount={summaryMetrics.totalEstimatedCost}
              className="text-lg sm:text-xl font-extrabold text-emerald-700"
            />
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contracted Vendors</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900">{vendors.length}</span>
            <span className="text-[10px] text-slate-400 ml-2">Agencies</span>
          </div>
        </div>

        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pricing Completed</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg sm:text-xl font-extrabold text-slate-900">
              {items.filter((i) => Number(i.total_price) > 0).length} / {items.length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card
        title="Event Items & Service Breakdown"
        subtitle="Manage required festival services, sound, stage, catering, decoration, and custom operational items."
        headerAction={
          <div className="flex items-center gap-1.5 flex-wrap">
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
                variant="primary"
                size="sm"
                onClick={openCreateModal}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                + Add Custom Item
              </Button>
            </PermissionGuard>
          </div>
        }
      >
        {/* Category Filter */}
        <div className="mb-3 flex items-center gap-2 flex-wrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Categories ({items.length})</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <Table
          columns={columns}
          data={filteredItems}
          isLoading={isLoading}
          emptyText="No event items registered for this event."
        />
      </Card>

      {/* Add / Edit Item Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `Configure: ${editingItem.name}` : 'Add Custom Event Item / Service'}
        description="Configure pricing model, amounts, days, and assign vendors."
      >
        <form onSubmit={handleSaveItem} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              label="Item / Service Name"
              placeholder="e.g. Traditional Dhol Troupe, Generator 125KVA"
              requiredIndicator
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Select
              label="Category"
              requiredIndicator
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select
              label="Linked Vendor / Contractor (Optional)"
              value={vendorContractId}
              onChange={(e) => {
                setVendorContractId(e.target.value);
                const selected = vendors.find((v) => v.id === e.target.value);
                if (selected) setVendorName(selected.vendor_name);
              }}
            >
              <option value="">-- Select Vendor Contract --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.vendor_name} ({v.contract_type} - {formatCurrency(v.contract_amount)})
                </option>
              ))}
            </Select>

            <Input
              label="Vendor / Agency Name (if unlinked)"
              placeholder="e.g. Shree Sound & Lights"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
          </div>

          <Textarea
            label="Description / Scope of Work"
            placeholder="Technical specs, setup requirements, delivery timings..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Pricing Model Selector */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="text-xs font-bold text-slate-800 block">Select Pricing Model</label>
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

            {/* Dynamic Inputs based on Pricing Model */}
            {pricingType === 'fixed' && (
              <Input
                label="Total Fixed Price (₹)"
                type="number"
                placeholder="e.g. 50000"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                requiredIndicator
              />
            )}

            {pricingType === 'recurring_daily' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Daily Rate (₹ / Day)"
                  type="number"
                  placeholder="e.g. 10000"
                  value={pricePerDay}
                  onChange={(e) => setPricePerDay(e.target.value)}
                  requiredIndicator
                />
                <Input
                  label="Number of Days"
                  type="number"
                  placeholder="e.g. 9"
                  value={numberOfDays}
                  onChange={(e) => setNumberOfDays(e.target.value)}
                  requiredIndicator
                />
              </div>
            )}

            {pricingType === 'quantity_based' && (
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Quantity"
                  type="number"
                  placeholder="e.g. 100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  requiredIndicator
                />
                <Input
                  label="Unit"
                  placeholder="e.g. Chairs, Packets"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                />
                <Input
                  label="Unit Price (₹)"
                  type="number"
                  placeholder="e.g. 50"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  requiredIndicator
                />
              </div>
            )}

            {pricingType === 'day_wise' && (
              <div className="space-y-2.5">
                <span className="text-[11px] text-slate-600 font-semibold block">
                  Enter specific amount per day (Navratri Day 1 to Day 9):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {NAVRATRI_DAYS.map((d) => (
                    <div key={d.dayNum} className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-700 block mb-1">{d.label}</span>
                      <Input
                        type="number"
                        placeholder="₹ 0"
                        value={dayWisePrices[String(d.dayNum)] !== undefined ? String(dayWisePrices[String(d.dayNum)]) : ''}
                        onChange={(e) => {
                          const val = Number(e.target.value) || 0;
                          setDayWisePrices((prev) => ({
                            ...prev,
                            [String(d.dayNum)]: val,
                          }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Calculated Total Bar */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600">Calculated Item Total:</span>
              <CurrencyDisplay amount={calculatedFormTotal} className="text-base font-extrabold text-indigo-700" />
            </div>
          </div>

          <Textarea
            label="Internal Notes / Payment Terms (Optional)"
            placeholder="Advance required, payment milestone notes..."
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
              {editingItem ? 'Save Item Configuration' : 'Create Custom Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
        title="Delete Event Item"
        message={
          <span>
            Are you sure you want to remove <strong>{itemToDelete?.name}</strong> from this event?
          </span>
        }
        confirmLabel="Delete Item"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventItemsTab;
