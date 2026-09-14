import React, { useState, useEffect, useMemo } from 'react';
import {
  ContractItemModel,
  VendorItem,
  EventServiceGroupItem,
  ExpenseCategoryItem,
  EventDayItem,
  SocietyItem,
  EventItem,
  CreateContractInput,
  ContractLineItem,
} from '../../../types';
import { contractsService } from '../../../api/contractsService';
import { vendorsService } from '../../../api/vendorsService';
import { serviceGroupsService } from '../../../api/serviceGroupsService';
import { expenseCategoriesService } from '../../../api/expenseCategoriesService';
import { societiesService } from '../../../api/societiesService';
import { eventsService } from '../../../api/eventsService';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../hooks/useToast';
import { formatCurrency } from '../../../utils/formatters';
import { extractErrorMessage } from '../../../utils/errorExtractor';
import {
  Plus,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  Layers,
  Percent,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building2,
} from 'lucide-react';

interface ContractFormModalProps {
  eventId?: string;
  societyId?: string;
  contract?: ContractItemModel | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedContract: ContractItemModel) => void;
  eventDays?: EventDayItem[];
  defaultStartDate?: string;
  defaultEndDate?: string;
  isMultiDayEvent?: boolean;
}

interface ItemRow {
  id?: string;
  item_name: string;
  service_group_id?: string;
  expense_category_id?: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  description?: string;
  schedules?: {
    event_day_id?: string;
    day_date?: string;
    quantity: number;
    start_time?: string;
    end_time?: string;
    special_instructions?: string;
  }[];
}

export const ContractFormModal: React.FC<ContractFormModalProps> = ({
  eventId,
  societyId,
  contract,
  isOpen,
  onClose,
  onSuccess,
  eventDays = [],
  defaultStartDate,
  defaultEndDate,
  isMultiDayEvent = false,
}) => {
  const toast = useToast();
  const isEdit = !!contract;

  // Standalone Society & Event selection
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState<string>(societyId || '');
  const [selectedEventId, setSelectedEventId] = useState<string>(eventId || '');
  const [selectedEventDays, setSelectedEventDays] = useState<EventDayItem[]>(eventDays || []);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Masters
  const [vendors, setVendors] = useState<VendorItem[]>([]);
  const [serviceGroups, setServiceGroups] = useState<EventServiceGroupItem[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryItem[]>([]);
  const [isLoadingMasters, setIsLoadingMasters] = useState(false);

  // Form State
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Section 1: Basic & Vendor
  const [vendorId, setVendorId] = useState<string>('');
  const [serviceGroupId, setServiceGroupId] = useState<string>('');
  const [expenseCategoryId, setExpenseCategoryId] = useState<string>('');
  const [contractNumber, setContractNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [contractType, setContractType] = useState<string>('fixed_rate');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [isMultiDay, setIsMultiDay] = useState<boolean>(false);

  // Section 2: Items
  const [items, setItems] = useState<ItemRow[]>([
    {
      item_name: '',
      quantity: 1,
      unit: 'Nos',
      unit_price: 0,
      total_amount: 0,
      description: '',
    },
  ]);

  // Section 3: Commercials
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [taxApplicable, setTaxApplicable] = useState<boolean>(false);
  const [taxPercentage, setTaxPercentage] = useState<string>('18');
  const [advanceAmount, setAdvanceAmount] = useState<string>('0');
  const [paymentTerms, setPaymentTerms] = useState<string>('');

  // Fetch masters and societies
  useEffect(() => {
    if (isOpen) {
      setIsLoadingMasters(true);
      Promise.all([
        vendorsService.getAll({ limit: 100 }),
        serviceGroupsService.getAll({ limit: 100 }),
        expenseCategoriesService.getAll({ limit: 100 }),
        societiesService.getAll({ limit: 100 }),
      ])
        .then(([vRes, sgRes, ecRes, socRes]) => {
          if (vRes.success && vRes.data) {
            const vList = Array.isArray(vRes.data) ? vRes.data : (vRes.data as any).data || [];
            setVendors(vList);
          }
          if (sgRes.success && sgRes.data) {
            const sgList = Array.isArray(sgRes.data) ? sgRes.data : (sgRes.data as any).data || [];
            setServiceGroups(sgList);
          }
          if (ecRes.success && ecRes.data) {
            const ecList = Array.isArray(ecRes.data) ? ecRes.data : (ecRes.data as any).data || [];
            setExpenseCategories(ecList);
          }
          if (socRes.success && socRes.data) {
            setSocieties(socRes.data);
          }
        })
        .finally(() => setIsLoadingMasters(false));
    }
  }, [isOpen]);

  // Fetch events when selectedSocietyId changes
  useEffect(() => {
    if (isOpen && selectedSocietyId) {
      setIsLoadingEvents(true);
      eventsService
        .getAll({ societyId: selectedSocietyId, limit: 100 })
        .then((res) => {
          if (res.success && res.data) {
            setEvents(res.data);
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingEvents(false));
    } else if (!selectedSocietyId) {
      setEvents([]);
    }
  }, [isOpen, selectedSocietyId]);

  // Initialize or reset form on open/contract change
  useEffect(() => {
    if (isOpen) {
      setActiveStep(1);
      if (contract) {
        setVendorId(contract.vendor_id || '');
        setServiceGroupId(contract.service_group_id || '');
        setExpenseCategoryId(contract.expense_category_id || '');
        setContractNumber(contract.contract_number || '');
        setTitle(contract.title || '');
        setContractType(contract.contract_type || 'fixed_rate');
        setStartDate(contract.start_date ? contract.start_date.split('T')[0] : '');
        setEndDate(contract.end_date ? contract.end_date.split('T')[0] : '');
        setStartTime(contract.start_time || '');
        setEndTime(contract.end_time || '');
        setIsMultiDay(contract.is_multi_day || false);

        if (contract.items && contract.items.length > 0) {
          setItems(
            contract.items.map((i) => ({
              id: i.id,
              item_name: i.item_name,
              service_group_id: i.service_group_id || undefined,
              expense_category_id: i.expense_category_id || undefined,
              quantity: Number(i.quantity) || 1,
              unit: i.unit || 'Nos',
              unit_price: Number(i.unit_price) || 0,
              total_amount: Number(i.total_amount) || 0,
              description: i.description || '',
              schedules: i.schedules?.map((s) => ({
                event_day_id: s.event_day_id || undefined,
                day_date: s.day_date ? s.day_date.split('T')[0] : undefined,
                quantity: Number(s.quantity) || 1,
                start_time: s.start_time || undefined,
                end_time: s.end_time || undefined,
                special_instructions: s.special_instructions || undefined,
              })),
            }))
          );
        } else {
          setItems([
            {
              item_name: contract.title || 'Contract Services',
              quantity: 1,
              unit: 'Lump Sum',
              unit_price: Number(contract.sub_total_amount) || 0,
              total_amount: Number(contract.sub_total_amount) || 0,
              description: '',
            },
          ]);
        }

        setDiscountAmount(String(contract.discount_amount || 0));
        setTaxApplicable(contract.tax_applicable || false);
        setTaxPercentage(String(contract.tax_percentage || 18));
        setAdvanceAmount(String(contract.advance_amount || 0));
        setPaymentTerms(contract.payment_terms || '');
      } else {
        // Defaults for new contract
        setVendorId('');
        setServiceGroupId('');
        setExpenseCategoryId('');
        setContractNumber('');
        setTitle('');
        setContractType('fixed_rate');
        setStartDate(defaultStartDate ? defaultStartDate.split('T')[0] : '');
        setEndDate(defaultEndDate ? defaultEndDate.split('T')[0] : '');
        setStartTime('');
        setEndTime('');
        setIsMultiDay(isMultiDayEvent);
        setItems([
          {
            item_name: '',
            quantity: 1,
            unit: 'Nos',
            unit_price: 0,
            total_amount: 0,
            description: '',
          },
        ]);
        setDiscountAmount('0');
        setTaxApplicable(false);
        setTaxPercentage('18');
        setAdvanceAmount('0');
        setPaymentTerms('50% Advance on signing, 50% on completion.');
      }
    }
  }, [isOpen, contract, defaultStartDate, defaultEndDate, isMultiDayEvent]);

  // Handle item changes
  const handleItemChange = (index: number, field: keyof ItemRow, value: any) => {
    const updated = [...items];
    const target = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      const q = Number(field === 'quantity' ? value : target.quantity) || 0;
      const p = Number(field === 'unit_price' ? value : target.unit_price) || 0;
      target.total_amount = Number((q * p).toFixed(2));
    }

    updated[index] = target;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        item_name: '',
        service_group_id: serviceGroupId || undefined,
        expense_category_id: expenseCategoryId || undefined,
        quantity: 1,
        unit: 'Nos',
        unit_price: 0,
        total_amount: 0,
        description: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      toast.error('Contract must have at least one line item');
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
  };

  // Calculations
  const calculatedSubTotal = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.total_amount) || 0), 0);
  }, [items]);

  const discNum = Math.max(0, Number(discountAmount) || 0);
  const taxRateNum = taxApplicable ? Math.max(0, Number(taxPercentage) || 0) : 0;
  const taxableBase = Math.max(0, calculatedSubTotal - discNum);
  const calculatedTax = taxApplicable ? Number(((taxableBase * taxRateNum) / 100).toFixed(2)) : 0;
  const calculatedTotal = Number((taxableBase + calculatedTax).toFixed(2));
  const advanceNum = Math.max(0, Number(advanceAmount) || 0);

  // Submit Handler
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const effectiveEventId = selectedEventId || eventId;
    if (!effectiveEventId) {
      toast.error('Please select an event for this contract');
      setActiveStep(1);
      return;
    }

    if (!vendorId) {
      toast.error('Please select a vendor/contractor');
      setActiveStep(1);
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a contract title');
      setActiveStep(1);
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Please specify start and end dates');
      setActiveStep(1);
      return;
    }

    // Validate line items
    const validItems = items.filter((i) => i.item_name.trim().length > 0);
    if (validItems.length === 0) {
      toast.error('Please provide at least one valid line item with a name');
      setActiveStep(2);
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateContractInput = {
        society_id: selectedSocietyId || undefined,
        event_id: effectiveEventId,
        vendor_id: vendorId,
        service_group_id: serviceGroupId || undefined,
        expense_category_id: expenseCategoryId || undefined,
        contract_number: contractNumber || undefined,
        title: title.trim(),
        contract_type: contractType,
        start_date: startDate,
        end_date: endDate,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
        is_multi_day: isMultiDay,
        sub_total_amount: calculatedSubTotal,
        discount_amount: discNum,
        tax_applicable: taxApplicable,
        tax_percentage: taxRateNum,
        tax_amount: calculatedTax,
        total_amount: calculatedTotal,
        advance_amount: advanceNum,
        payment_terms: paymentTerms || undefined,
        items: validItems.map((i) => ({
          id: i.id,
          item_name: i.item_name,
          service_group_id: i.service_group_id || serviceGroupId || undefined,
          expense_category_id: i.expense_category_id || expenseCategoryId || undefined,
          quantity: Number(i.quantity) || 1,
          unit: i.unit || 'Nos',
          unit_price: Number(i.unit_price) || 0,
          total_amount: Number(i.total_amount) || 0,
          description: i.description || undefined,
          schedules: i.schedules,
        })) as any,
      };

      let res;
      if (isEdit && contract) {
        res = await contractsService.update(contract.id, payload);
      } else {
        res = await contractsService.create(payload);
      }

      if (res.success && res.data) {
        toast.success(
          isEdit
            ? `Contract ${res.data.contract_number} updated successfully!`
            : `Contract ${res.data.contract_number} created successfully!`
        );
        onSuccess(res.data);
        onClose();
      } else {
        toast.error(res.message || 'Failed to save contract');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save contract'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Vendor & Scope', icon: <FileText className="w-4 h-4" /> },
    { num: 2, title: 'Deliverables & Line Items', icon: <Layers className="w-4 h-4" /> },
    { num: 3, title: 'Commercials & Taxes', icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edit Contract — ${contract.contract_number}` : 'Create Event Contract / Work Order'}
      description="Comprehensive contract with automated deliverables, schedules, commercials, and terms"
      size="xl"
    >
      <div className="space-y-5">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          {steps.map((s, idx) => (
            <button
              key={s.num}
              type="button"
              onClick={() => setActiveStep(s.num)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors ${
                activeStep === s.num
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === s.num ? 'bg-white text-indigo-700' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {s.num}
              </span>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Step 1: Basic & Vendor Information */}
        {activeStep === 1 && (
          <div className="space-y-4">
            {/* Society & Event Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <Select
                  label="Society"
                  required
                  disabled={isEdit || (!!societyId && societies.length <= 1)}
                  value={selectedSocietyId}
                  onChange={(e) => {
                    setSelectedSocietyId(e.target.value);
                    setSelectedEventId('');
                  }}
                  options={[
                    { value: '', label: '-- Select Society --' },
                    ...societies.map((s) => ({
                      value: s.id,
                      label: `${s.name} ${s.code ? `(${s.code})` : ''}`,
                    })),
                  ]}
                />
              </div>
              <div>
                <Select
                  label="Event"
                  required
                  disabled={isEdit || (!!eventId && !isEdit)}
                  value={selectedEventId}
                  onChange={(e) => {
                    const evId = e.target.value;
                    setSelectedEventId(evId);
                    const ev = events.find((item) => item.id === evId);
                    if (ev) {
                      if (ev.start_date) setStartDate(ev.start_date.split('T')[0]);
                      if (ev.end_date) setEndDate(ev.end_date.split('T')[0]);
                      setIsMultiDay(Boolean(ev.is_navratri || (ev.event_days && ev.event_days.length > 1)));
                      if (ev.event_days) setSelectedEventDays(ev.event_days);
                    }
                  }}
                  options={[
                    {
                      value: '',
                      label: isLoadingEvents
                        ? 'Loading events...'
                        : selectedSocietyId
                        ? '-- Select Event --'
                        : '-- Select Society First --',
                    },
                    ...events.map((ev) => ({
                      value: ev.id,
                      label: `${ev.name} (${ev.event_year || ''})`,
                    })),
                  ]}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Vendor Select */}
              <div>
                <Select
                  label="Vendor / Contractor"
                  required
                  value={vendorId}
                  onChange={(e) => {
                    setVendorId(e.target.value);
                    const selected = vendors.find((v) => v.id === e.target.value);
                    if (selected && !title) {
                      setTitle(`${selected.vendor_name} Services`);
                    }
                  }}
                  options={[
                    { value: '', label: '-- Select Vendor / Contractor --' },
                    ...vendors.map((v) => {
                      const vName = v.vendor_name || v.vendorName || 'Vendor';
                      const vPhone = v.mobile_no || v.mobileNo;
                      return {
                        value: v.id,
                        label: `${vName} ${vPhone ? `(${vPhone})` : ''}`.trim(),
                      };
                    }),
                  ]}
                />
              </div>

              {/* Contract Type */}
              <div>
                <Select
                  label="Contract Type"
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  options={[
                    { value: 'fixed_rate', label: 'Fixed Rate / Lump Sum' },
                    { value: 'time_and_materials', label: 'Time & Materials / Day Rate' },
                    { value: 'rate_contract', label: 'Item Rate Contract' },
                  ]}
                />
              </div>
            </div>

            {/* Title */}
            <Input
              label="Contract / Work Order Title"
              placeholder="e.g. Sound, Stage, Lighting Setup & DJ Service"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Service Group */}
              <Select
                label="Primary Service Group (Optional)"
                value={serviceGroupId}
                onChange={(e) => setServiceGroupId(e.target.value)}
                options={[
                  { value: '', label: '-- None / Multiple Services --' },
                  ...serviceGroups.map((g) => ({
                    value: g.id,
                    label: g.name,
                  })),
                ]}
              />

              {/* Expense Category */}
              <Select
                label="Expense Category (Optional)"
                value={expenseCategoryId}
                onChange={(e) => setExpenseCategoryId(e.target.value)}
                options={[
                  { value: '', label: '-- None / Multiple Categories --' },
                  ...expenseCategories.map((c) => ({
                    value: c.id,
                    label: c.name,
                  })),
                ]}
              />
            </div>

            {/* Dates & Times */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <Input
                label="Start Date"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            {/* Multi-day toggle */}
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <input
                type="checkbox"
                id="isMultiDayCheck"
                checked={isMultiDay}
                onChange={(e) => setIsMultiDay(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="isMultiDayCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                Multi-Day Contract (Enables day-wise deliverable schedules & milestone tracking)
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Deliverables & Line Items */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Line Items & Deliverables</h4>
                <p className="text-xs text-slate-500">Break down services into itemized deliverables with rates</p>
              </div>
              <Button size="sm" variant="outline" onClick={handleAddItem} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Item
              </Button>
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 transition-shadow hover:shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      Item #{index + 1}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                    <div className="sm:col-span-5">
                      <Input
                        label="Item Description / Service Name"
                        placeholder="e.g. Stage Sound System 5000W"
                        required
                        value={item.item_name}
                        onChange={(e) => handleItemChange(index, 'item_name', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label="Quantity"
                        type="number"
                        min="0.01"
                        step="any"
                        required
                        value={String(item.quantity)}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label="Unit"
                        placeholder="Nos, Sets, Days"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <Input
                        label="Unit Price (₹)"
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={String(item.unit_price)}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                    <span className="text-slate-500">
                      Line Total: <strong className="text-slate-800">{formatCurrency(item.total_amount)}</strong>
                    </span>
                    <Input
                      placeholder="Optional remarks or specifications for this item..."
                      value={item.description || ''}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="text-xs py-1"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal Preview */}
            <div className="flex justify-end p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs">
              <span className="text-indigo-900 font-medium">
                Deliverables Subtotal: <strong className="text-sm font-bold text-indigo-700">{formatCurrency(calculatedSubTotal)}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Step 3: Commercials & Taxes */}
        {activeStep === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Input
                  label="Discount Amount (₹)"
                  type="number"
                  min="0"
                  step="any"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  placeholder="0.00"
                />

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="taxApplicableCheck"
                      checked={taxApplicable}
                      onChange={(e) => setTaxApplicable(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="taxApplicableCheck" className="text-xs font-semibold text-slate-800 cursor-pointer">
                      GST / Tax Applicable
                    </label>
                  </div>

                  {taxApplicable && (
                    <Input
                      label="Tax Percentage (%)"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={taxPercentage}
                      onChange={(e) => setTaxPercentage(e.target.value)}
                      placeholder="18"
                    />
                  )}
                </div>

                <Input
                  label="Agreed Advance Amount (₹)"
                  type="number"
                  min="0"
                  step="any"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Live Commercial Breakdown Summary */}
              <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Calculated Commercial Summary
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal (Items):</span>
                      <span className="font-semibold">{formatCurrency(calculatedSubTotal)}</span>
                    </div>
                    {discNum > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount:</span>
                        <span className="font-semibold">- {formatCurrency(discNum)}</span>
                      </div>
                    )}
                    {taxApplicable && (
                      <div className="flex justify-between text-slate-300">
                        <span>GST / Tax ({taxRateNum}%):</span>
                        <span className="font-semibold">+ {formatCurrency(calculatedTax)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-700 flex justify-between text-base font-bold text-white">
                      <span>Total Contract Value:</span>
                      <span className="text-indigo-400">{formatCurrency(calculatedTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pt-1 text-[11px]">
                      <span>Agreed Advance:</span>
                      <span>{formatCurrency(advanceNum)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Projected Final Balance:</span>
                      <span>{formatCurrency(Math.max(0, calculatedTotal - advanceNum))}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 bg-slate-800/80 p-2 rounded-lg">
                  Values are automatically verified server-side with high-precision decimal arithmetic.
                </div>
              </div>
            </div>

            <Textarea
              label="Payment Terms & Milestones"
              placeholder="e.g. 50% advance on agreement signing, 50% upon final verification and handoff."
              rows={2}
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </div>
        )}

        {/* Navigation & Submit Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {activeStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(activeStep - 1)}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>

            {activeStep < 3 ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setActiveStep(activeStep + 1)}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={() => handleSubmit()}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                {isEdit ? 'Save Changes' : 'Create Contract'} ({formatCurrency(calculatedTotal)})
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
