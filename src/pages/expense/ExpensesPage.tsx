import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { expensesService } from '../../api/expensesService';
import { expenseCategoriesService } from '../../api/expenseCategoriesService';
import { vendorsService } from '../../api/vendorsService';
import {
  ExpenseItem,
  ExpenseCategoryItem,
  VendorItem,
  ExpenseSummaryMetrics,
  PaginationMeta,
  ExpensePaymentMode,
} from '../../types';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ThemedSelect from '../../components/ui/ThemedSelect';
import Textarea from '../../components/ui/Textarea';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { useDebounce } from '../../hooks/useDebounce';
import { getFileUrl } from '../../utils/fileHelper';
import {
  Receipt,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Tag,
  Store,
  Calendar,
  Banknote,
  CreditCard,
  QrCode,
  FileText,
  Upload,
  Eye,
  X,
  ArrowLeft,
  SlidersHorizontal,
  Search,
  Building2,
  Paperclip,
  CheckCircle2,
  Wallet,
  ExternalLink,
  Download,
} from 'lucide-react';
import clsx from 'clsx';

const PAYMENT_MODES: Array<{
  value: string;
  name: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  iconColor: string;
}> = [
  {
    value: 'UPI',
    name: 'UPI / QR',
    subtitle: 'GPay, QR',
    icon: QrCode,
    activeClass: 'border-indigo-600 bg-indigo-50/90 text-indigo-950 ring-2 ring-indigo-500/20 shadow-2xs',
    iconColor: 'text-indigo-600 bg-indigo-100',
  },
  {
    value: 'CASH',
    name: 'Cash',
    subtitle: 'Physical',
    icon: Banknote,
    activeClass: 'border-emerald-600 bg-emerald-50/90 text-emerald-950 ring-2 ring-emerald-500/20 shadow-2xs',
    iconColor: 'text-emerald-600 bg-emerald-100',
  },
  {
    value: 'CHEQUE',
    name: 'Cheque',
    subtitle: 'DD / Chq',
    icon: CreditCard,
    activeClass: 'border-amber-600 bg-amber-50/90 text-amber-950 ring-2 ring-amber-500/20 shadow-2xs',
    iconColor: 'text-amber-600 bg-amber-100',
  },
  {
    value: 'BANK_TRANSFER',
    name: 'Transfer',
    subtitle: 'NEFT/IMPS',
    icon: Building2,
    activeClass: 'border-sky-600 bg-sky-50/90 text-sky-950 ring-2 ring-sky-500/20 shadow-2xs',
    iconColor: 'text-sky-600 bg-sky-100',
  },
];

export const ExpensesPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedSocietyId } = useAuth();
  const { can, isSuperAdmin } = usePermission();

  // Expenses State
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState<ExpenseSummaryMetrics>({
    totalCount: 0,
    totalAmount: 0,
    cashAmount: 0,
    chequeAmount: 0,
    upiAmount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState('expense_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const hasActiveFilters = Boolean(categoryFilter || vendorFilter || modeFilter || startDateFilter || endDateFilter);
  const activeFilterCount = [categoryFilter, vendorFilter, modeFilter, startDateFilter, endDateFilter].filter(Boolean).length;

  // Master options
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [vendors, setVendors] = useState<VendorItem[]>([]);

  // Modal Form State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    expenseCategoryId: '',
    vendorId: '',
    amount: '',
    modeOfPayment: 'CASH' as ExpensePaymentMode,
    transactionReference: '',
    chequeNumber: '',
    bankName: '',
    chequeDate: '',
    remarks: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Attachment Full View Modal State
  const [viewingAttachment, setViewingAttachment] = useState<{ url: string; title: string } | null>(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<ExpenseItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Categories & Vendors for Dropdowns
  const loadMasterData = async () => {
    try {
      const [catRes, venRes] = await Promise.all([
        expenseCategoriesService.getAll({
          limit: 200,
          societyId: selectedSocietyId || undefined,
          status: 'active',
          sortBy: 'display_order',
          sortOrder: 'asc',
        }).catch(() => null),
        vendorsService.getAll({
          limit: 200,
          status: 'active',
        }).catch(() => null),
      ]);

      if (catRes?.success && catRes.data) {
        setCategories(catRes.data);
      }
      if (venRes?.success && venRes.data) {
        setVendors(venRes.data);
      }
    } catch (err) {
      console.error('Failed to load master data for expenses', err);
    }
  };

  useEffect(() => {
    loadMasterData();
  }, [selectedSocietyId]);

  // Load Expenses & Summary
  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const [listRes, sumRes] = await Promise.all([
        expensesService.getAll({
          page: meta.page,
          limit: meta.limit,
          search: debouncedSearch || undefined,
          societyId: selectedSocietyId || undefined,
          expenseCategoryId: categoryFilter || undefined,
          vendorId: vendorFilter || undefined,
          modeOfPayment: modeFilter || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
          sortBy,
          sortOrder,
        }),
        expensesService.getSummary({
          societyId: selectedSocietyId || undefined,
          expenseCategoryId: categoryFilter || undefined,
          vendorId: vendorFilter || undefined,
          startDate: startDateFilter || undefined,
          endDate: endDateFilter || undefined,
        }).catch(() => null),
      ]);

      if (listRes.success && listRes.data) {
        setExpenses(listRes.data);
        if (listRes.meta) {
          setMeta(listRes.meta);
        }
      }
      if (sumRes?.success && sumRes.data) {
        setSummary(sumRes.data);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load expense records'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [
    meta.page,
    meta.limit,
    debouncedSearch,
    categoryFilter,
    vendorFilter,
    modeFilter,
    startDateFilter,
    endDateFilter,
    sortBy,
    sortOrder,
    selectedSocietyId,
  ]);

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setCurrentId(null);
    setFormData({
      expenseDate: new Date().toISOString().split('T')[0],
      expenseCategoryId: categories.length > 0 ? categories[0].id : '',
      vendorId: vendors.length > 0 ? vendors[0].id : '',
      amount: '',
      modeOfPayment: 'CASH',
      transactionReference: '',
      chequeNumber: '',
      bankName: '',
      chequeDate: '',
      remarks: '',
    });
    setSelectedFile(null);
    setExistingAttachmentUrl(null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (exp: ExpenseItem) => {
    setIsEditing(true);
    setCurrentId(exp.id);
    setFormData({
      expenseDate: exp.expenseDate || (exp.expense_date ? exp.expense_date.split('T')[0] : new Date().toISOString().split('T')[0]),
      expenseCategoryId: exp.expenseCategoryId || exp.expense_category_id || '',
      vendorId: exp.vendorId || exp.vendor_id || '',
      amount: exp.amount ? exp.amount.toString() : '',
      modeOfPayment: (exp.modeOfPayment || exp.mode_of_payment || 'CASH').toUpperCase() as ExpensePaymentMode,
      transactionReference: exp.transactionReference || exp.transaction_reference || '',
      chequeNumber: exp.chequeNumber || exp.cheque_number || '',
      bankName: exp.bankName || exp.bank_name || '',
      chequeDate: exp.chequeDate ? exp.chequeDate.split('T')[0] : (exp.cheque_date ? exp.cheque_date.split('T')[0] : ''),
      remarks: exp.remarks || '',
    });
    setSelectedFile(null);
    setExistingAttachmentUrl(exp.attachmentUrl || exp.attachment_url || null);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.expenseCategoryId) {
      errors.expenseCategoryId = 'Please select an expense category';
    }
    if (!formData.vendorId) {
      errors.vendorId = 'Please select a vendor';
    }
    const numAmount = Number(formData.amount);
    if (!formData.amount || isNaN(numAmount) || numAmount <= 0) {
      errors.amount = 'Amount must be a valid positive number greater than 0';
    }
    if (!formData.expenseDate) {
      errors.expenseDate = 'Expense date is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        toast.error('File size cannot exceed 25MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const payload = new FormData();
      payload.append('societyId', selectedSocietyId || '');
      payload.append('expenseCategoryId', formData.expenseCategoryId);
      payload.append('vendorId', formData.vendorId);
      payload.append('expenseDate', formData.expenseDate);
      payload.append('amount', formData.amount);
      payload.append('modeOfPayment', formData.modeOfPayment);
      if (formData.transactionReference.trim()) {
        payload.append('transactionReference', formData.transactionReference.trim());
      }
      if (formData.chequeNumber.trim()) {
        payload.append('chequeNumber', formData.chequeNumber.trim());
      }
      if (formData.bankName.trim()) {
        payload.append('bankName', formData.bankName.trim());
      }
      if (formData.chequeDate) {
        payload.append('chequeDate', formData.chequeDate);
      }
      if (formData.remarks.trim()) {
        payload.append('remarks', formData.remarks.trim());
      }

      if (selectedFile) {
        payload.append('attachment', selectedFile);
      }

      if (isEditing && currentId) {
        const res = await expensesService.update(currentId, payload);
        if (res.success) {
          toast.success('Expense record updated successfully');
          setIsModalOpen(false);
          await fetchExpenses();
        }
      } else {
        const res = await expensesService.create(payload);
        if (res.success) {
          toast.success('Expense record created successfully');
          setIsModalOpen(false);
          await fetchExpenses();
        }
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save expense record'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      const res = await expensesService.delete(deleteTarget.id);
      if (res.success) {
        toast.success('Expense record deleted successfully');
        setDeleteTarget(null);
        await fetchExpenses();
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete expense record'));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getPaymentModeBadge = (mode: string) => {
    const upper = (mode || 'CASH').toUpperCase();
    if (upper === 'CASH') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Banknote className="w-3 h-3" />
          Cash
        </span>
      );
    }
    if (upper === 'CHEQUE') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <CreditCard className="w-3 h-3" />
          Cheque
        </span>
      );
    }
    if (upper === 'BANK_TRANSFER' || upper === 'TRANSFER' || upper === 'NEFT' || upper === 'IMPS' || upper === 'ONLINE') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
          <Building2 className="w-3 h-3" />
          Transfer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        <QrCode className="w-3 h-3" />
        UPI / QR
      </span>
    );
  };

  const columns: Column<ExpenseItem>[] = [
    {
      key: 'expense_date',
      header: 'Expense Date',
      sortable: true,
      render: (exp) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 font-bold">
            <Calendar className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <span className="font-semibold text-xs sm:text-sm text-slate-900 block">
              {exp.expenseDate || exp.expense_date || 'N/A'}
            </span>
            <span className="text-[10px] text-slate-400">
              Recorded {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : ''}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category & Details',
      render: (exp) => {
        const cat = exp.expenseCategory;
        const color = cat?.colorCode || cat?.color_code || '#6366F1';
        return (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-bold text-xs sm:text-sm text-slate-900">
                {cat?.name || 'Uncategorized'}
              </span>
            </div>
            {exp.remarks ? (
              <p className="text-[11px] text-slate-500 truncate max-w-xs">{exp.remarks}</p>
            ) : (
              <span className="text-[10px] text-slate-400 italic">No remarks</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'vendor',
      header: 'Vendor Details',
      render: (exp) => {
        const ven = exp.vendor;
        return (
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                {ven?.vendorName || ven?.vendor_name || 'Vendor'}
              </span>
            </div>
            {ven?.companyName && (
              <span className="text-[11px] text-slate-500 truncate">{ven.companyName}</span>
            )}
            {ven?.mobileNo && (
              <span className="text-[10px] text-slate-400 font-mono">{ven.mobileNo}</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'amount',
      header: 'Amount & Mode',
      sortable: true,
      render: (exp) => (
        <div className="flex flex-col gap-1">
          <span className="font-extrabold text-sm text-rose-600 tracking-tight">
            {formatCurrency(exp.amount)}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {getPaymentModeBadge(exp.modeOfPayment || exp.mode_of_payment || 'CASH')}
            {exp.chequeNumber && (
              <span className="text-[10px] font-mono text-slate-500">
                #{exp.chequeNumber}
              </span>
            )}
            {exp.transactionReference && (
              <span className="text-[10px] font-mono text-slate-500">
                Ref: {exp.transactionReference}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'attachment',
      header: 'Attachment',
      align: 'center',
      render: (exp) => {
        const attUrl = exp.attachmentUrl || exp.attachment_url;
        if (!attUrl) {
          return <span className="text-[11px] text-slate-400 italic">None</span>;
        }
        const isImg = /\.(jpg|jpeg|png|webp|heic)$/i.test(attUrl);
        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setViewingAttachment({
                url: attUrl,
                title: `${exp.expenseCategory?.name || 'Expense'} Receipt - ${formatCurrency(exp.amount)}`,
              })
            }
            className="h-7 px-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border border-indigo-100"
            leftIcon={isImg ? <Eye className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
          >
            {isImg ? 'View Image' : 'View Document'}
          </Button>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (exp) => {
        const canManage = isSuperAdmin || can(Permissions.EXPENSE_UPDATE) || can(Permissions.EXPENSE_MANAGE);
        const canDelete = isSuperAdmin || can(Permissions.EXPENSE_DELETE) || can(Permissions.EXPENSE_MANAGE);

        return (
          <div className="flex items-center justify-end gap-1.5">
            {canManage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                onClick={() => handleOpenEditModal(exp)}
                title="Edit Expense"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                onClick={() => setDeleteTarget(exp)}
                title="Delete Expense"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const canCreate = isSuperAdmin || can(Permissions.EXPENSE_CREATE) || can(Permissions.EXPENSE_MANAGE);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Ultra-Compact & Clean Top Header */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate(AppRoutes.EXPENSE)}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 transition-colors"
            title="Back to Expense Menu"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-base font-bold text-slate-900 tracking-tight truncate">Expenses</h1>
            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full border border-rose-100 shrink-0">
              {meta.total}
            </span>
          </div>
        </div>

        {/* Compact Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={fetchExpenses}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors shadow-2xs"
            title="Refresh Expenses"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-rose-600' : ''}`} />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Ultra-Compact Single-Row Summary Ribbon (Total + 4 Payment Modes) */}
      <div className="grid grid-cols-5 gap-1 sm:gap-1.5 bg-white p-2 sm:p-2.5 rounded-xl border border-slate-200/90 shadow-2xs text-center divide-x divide-slate-100">
        <div className="px-0.5 sm:px-1">
          <p className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">Total</p>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate mt-0.5">
            {formatCurrency(summary.totalAmount)}
          </p>
        </div>
        <div className="px-0.5 sm:px-1">
          <p className="text-[9.5px] sm:text-[10px] font-bold text-indigo-600 uppercase tracking-tight truncate">UPI / QR</p>
          <p className="text-xs sm:text-sm font-extrabold text-indigo-700 truncate mt-0.5">
            {formatCurrency(summary.upiAmount)}
          </p>
        </div>
        <div className="px-0.5 sm:px-1">
          <p className="text-[9.5px] sm:text-[10px] font-bold text-emerald-600 uppercase tracking-tight truncate">Cash</p>
          <p className="text-xs sm:text-sm font-extrabold text-emerald-700 truncate mt-0.5">
            {formatCurrency(summary.cashAmount)}
          </p>
        </div>
        <div className="px-0.5 sm:px-1">
          <p className="text-[9.5px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-tight truncate">Cheque</p>
          <p className="text-xs sm:text-sm font-extrabold text-amber-700 truncate mt-0.5">
            {formatCurrency(summary.chequeAmount)}
          </p>
        </div>
        <div className="px-0.5 sm:px-1">
          <p className="text-[9.5px] sm:text-[10px] font-bold text-sky-600 uppercase tracking-tight truncate">Transfer</p>
          <p className="text-xs sm:text-sm font-extrabold text-sky-700 truncate mt-0.5">
            {formatCurrency(summary.transferAmount || 0)}
          </p>
        </div>
      </div>

      {/* Minimalist Search & Filter Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              placeholder="Search vendor, category, remarks..."
              className="w-full pl-8 pr-7 py-1.5 text-xs text-slate-800 bg-slate-50/70 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 focus:border-rose-500 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setMeta((prev) => ({ ...prev, page: 1 }));
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Quick Payment Mode Select */}
          <div className="w-auto min-w-[110px] sm:min-w-[125px] shrink-0">
            <ThemedSelect
              value={modeFilter}
              onChange={(val) => {
                setModeFilter(val);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              options={[
                { value: '', label: 'All Modes' },
                { value: 'UPI', label: 'UPI / QR', badge: 'UPI' },
                { value: 'CASH', label: 'Cash', badge: 'CASH' },
                { value: 'CHEQUE', label: 'Cheque', badge: 'CHQ' },
                { value: 'BANK_TRANSFER', label: 'Bank Transfer', badge: 'NEFT' },
              ]}
              placeholder="All Modes"
              variant="rose"
              size="sm"
              align="right"
              menuWidth="w-44"
              searchable={false}
            />
          </div>

          {/* Expandable Advanced Filter Toggle */}
          <button
            type="button"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            className={clsx(
              'h-8 px-2.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all shrink-0',
              hasActiveFilters || isFiltersOpen
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            )}
            title="Toggle Filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Filter Drawer */}
        {isFiltersOpen && (
          <div className="bg-white p-3 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {/* Category Filter */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-tight block mb-1">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setMeta((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Filter */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-tight block mb-1">
                  Vendor
                </label>
                <select
                  value={vendorFilter}
                  onChange={(e) => {
                    setVendorFilter(e.target.value);
                    setMeta((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">All Vendors</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendorName || (v as any).vendor_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* From Date */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-tight block mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDateFilter}
                  onChange={(e) => {
                    setStartDateFilter(e.target.value);
                    setMeta((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* To Date */}
              <div>
                <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-tight block mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => {
                    setEndDateFilter(e.target.value);
                    setMeta((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryFilter('');
                    setVendorFilter('');
                    setModeFilter('');
                    setStartDateFilter('');
                    setEndDateFilter('');
                    setMeta((prev) => ({ ...prev, page: 1 }));
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Table / Mobile Cards */}
      <Card noPadding className="border-slate-200/80 shadow-2xs overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block">
          <Table
            columns={columns}
            data={expenses}
            isLoading={isLoading}
            emptyText="No expense records found. Click 'Add Expense' above to create one."
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={(key) => {
              if (sortBy === key) {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
              } else {
                setSortBy(key);
                setSortOrder('desc');
              }
            }}
          />
        </div>

        {/* Mobile Responsive Minimalist List View */}
        <div className="md:hidden divide-y divide-slate-100 bg-white">
          {isLoading ? (
            <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-5 h-5 text-rose-500 animate-spin mb-2" />
              <p className="text-xs font-medium text-slate-600">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-10 px-4 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 mb-2.5">
                <Receipt className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">No expense entries found</p>
              <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
                Tap "Add Expense" above to record an expenditure.
              </p>
            </div>
          ) : (
            expenses.map((exp) => {
              const cat = exp.expenseCategory;
              const ven = exp.vendor;
              const color = cat?.colorCode || cat?.color_code || '#6366F1';
              const attUrl = exp.attachmentUrl || exp.attachment_url;
              const canManage = isSuperAdmin || can(Permissions.EXPENSE_UPDATE) || can(Permissions.EXPENSE_MANAGE);
              const canDelete = isSuperAdmin || can(Permissions.EXPENSE_DELETE) || can(Permissions.EXPENSE_MANAGE);

              return (
                <div
                  key={exp.id}
                  className="p-2.5 sm:p-3 transition-colors hover:bg-slate-50/80 flex items-center justify-between gap-2"
                >
                  {/* Left Column: Category Indicator Dot + Category + Vendor + Date */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-slate-100 shadow-2xs"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate leading-tight">
                        {cat?.name || 'Uncategorized'}
                      </h3>

                      <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 truncate mt-0.5 leading-tight">
                        <span className="font-semibold text-slate-700 truncate max-w-[120px]">
                          {ven?.vendorName || ven?.vendor_name || 'Vendor'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-400 shrink-0">
                          {exp.expenseDate || exp.expense_date}
                        </span>
                        {(exp.chequeNumber || exp.transactionReference) && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[80px]">
                              {exp.chequeNumber ? `#${exp.chequeNumber}` : exp.transactionReference}
                            </span>
                          </>
                        )}
                      </div>

                      {exp.remarks && (
                        <p className="text-[10px] text-slate-400 truncate max-w-[210px] mt-0.5 italic">
                          {exp.remarks}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Amount, Payment Mode Badge & Actions */}
                  <div className="flex flex-col items-end justify-center gap-1 shrink-0">
                    <span className="font-extrabold text-xs sm:text-sm text-rose-600 tracking-tight leading-tight">
                      {formatCurrency(exp.amount)}
                    </span>

                    <div className="flex items-center gap-1">
                      {getPaymentModeBadge(exp.modeOfPayment || exp.mode_of_payment || 'CASH')}

                      {attUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setViewingAttachment({
                              url: attUrl,
                              title: `${cat?.name || 'Expense'} Receipt - ${formatCurrency(exp.amount)}`,
                            })
                          }
                          className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded transition-colors"
                          title="View Receipt Document"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(exp)}
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit Expense"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(exp)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
          <Pagination meta={meta} onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))} />
        </div>
      </Card>

      {/* Add / Edit Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isLoading={isSubmitting}
        title={
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <span>{isEditing ? 'Edit Expense Record' : 'Record New Society Expense'}</span>
          </div>
        }
        description="Enter expense details, select vendor and category, choose payment mode, and attach receipts."
      >
        <form onSubmit={handleSubmitForm} className="space-y-3.5">
          {/* Date & Category Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Expense Date"
              type="date"
              value={formData.expenseDate}
              onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
              error={formErrors.expenseDate}
              required
            />

            <ThemedSelect
              label="Expense Category"
              value={formData.expenseCategoryId}
              onChange={(val) => {
                setFormData({ ...formData, expenseCategoryId: val });
                if (formErrors.expenseCategoryId) {
                  setFormErrors((prev) => ({ ...prev, expenseCategoryId: '' }));
                }
              }}
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
                subLabel: c.description || undefined,
                badge: c.code || undefined,
                color: c.colorCode || c.color_code || '#6366F1',
              }))}
              placeholder="Select an active category..."
              searchPlaceholder="Search category..."
              error={formErrors.expenseCategoryId}
              required
            />
          </div>

          {/* Vendor & Amount Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ThemedSelect
              label="Vendor"
              value={formData.vendorId}
              onChange={(val) => {
                setFormData({ ...formData, vendorId: val });
                if (formErrors.vendorId) {
                  setFormErrors((prev) => ({ ...prev, vendorId: '' }));
                }
              }}
              options={vendors.map((v) => ({
                value: v.id,
                label: v.vendorName || (v as any).vendor_name,
                subLabel: v.companyName || v.mobileNo || (v as any).mobile_no || undefined,
                badge: v.shortName || (v as any).short_name || undefined,
                icon: <Store className="w-3.5 h-3.5" />,
              }))}
              placeholder="Select vendor..."
              searchPlaceholder="Search vendor by name, company, phone..."
              error={formErrors.vendorId}
              required
            />

            <Input
              label="Expense Amount (₹)"
              type="number"
              step="any"
              placeholder="e.g. 15000"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              error={formErrors.amount}
              required
            />
          </div>

          {/* Mode of Payment (All 4 Modes same to same as Flat Collections / Advertisements) */}
          <div>
            <label className="text-xs font-bold text-slate-800 block mb-1.5">
              Mode of Payment <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {PAYMENT_MODES.map((item) => {
                const isSelected =
                  formData.modeOfPayment === item.value ||
                  (item.value === 'UPI' && formData.modeOfPayment === 'QR') ||
                  (item.value === 'BANK_TRANSFER' && formData.modeOfPayment === 'TRANSFER');
                const Icon = item.icon;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, modeOfPayment: item.value as ExpensePaymentMode })}
                    className={clsx(
                      'relative flex flex-col items-start p-1.5 sm:p-2 rounded-xl border text-left transition-all cursor-pointer',
                      isSelected
                        ? item.activeClass
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div
                        className={clsx(
                          'w-6 h-6 rounded-lg flex items-center justify-center',
                          isSelected ? item.iconColor : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 ring-2 ring-rose-300 animate-pulse" />
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs font-bold leading-tight block truncate w-full">
                      {item.name}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-500 block truncate w-full mt-0.5">
                      {item.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Cheque Fields */}
          {formData.modeOfPayment === 'CHEQUE' && (
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 space-y-2.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>Cheque / Demand Draft Payment Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Input
                  label="Cheque Number"
                  placeholder="e.g. 004821"
                  value={formData.chequeNumber}
                  onChange={(e) => setFormData({ ...formData, chequeNumber: e.target.value })}
                />
                <Input
                  label="Bank Name"
                  placeholder="e.g. HDFC Bank"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
                <Input
                  label="Cheque Date"
                  type="date"
                  value={formData.chequeDate}
                  onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Conditional UPI Reference */}
          {(formData.modeOfPayment === 'UPI' || formData.modeOfPayment === 'QR') && (
            <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>UPI / QR Payment Transaction Details</span>
              </div>
              <Input
                label="UPI Transaction ID / UTR Number"
                placeholder="e.g. 329482190842 or UPI / GPay Ref"
                value={formData.transactionReference}
                onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
              />
            </div>
          )}

          {/* Conditional Bank Transfer / NEFT / IMPS Reference */}
          {(formData.modeOfPayment === 'BANK_TRANSFER' || formData.modeOfPayment === 'TRANSFER' || formData.modeOfPayment === 'ONLINE') && (
            <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-100 space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                <Building2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Bank Transfer / NEFT / IMPS Payment Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Input
                  label="Transaction Reference / UTR Number"
                  placeholder="e.g. NEFT/IMPS/2026/09/99214"
                  value={formData.transactionReference}
                  onChange={(e) => setFormData({ ...formData, transactionReference: e.target.value })}
                />
                <Input
                  label="Remitting / Beneficiary Bank Name"
                  placeholder="e.g. ICICI / HDFC Bank"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Image / Attachment Upload */}
          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">
              Expense Receipt / Invoice / Supporting Document
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center justify-between p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span className="text-xs font-semibold text-indigo-900 truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="h-6 w-6 p-0 text-slate-400 hover:text-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            ) : existingAttachmentUrl ? (
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700 truncate">
                    Attached Document
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setViewingAttachment({
                        url: existingAttachmentUrl,
                        title: 'Attached Receipt',
                      })
                    }
                    className="text-xs text-indigo-600 font-bold hover:underline ml-1"
                  >
                    View
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs"
                >
                  Replace
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 hover:border-indigo-400 p-3 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50/50 cursor-pointer"
              >
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-semibold">Click to upload receipt or bill</span>
                <span className="text-[10px] text-slate-400">
                  Supported formats: JPG, PNG, WebP, PDF (Max 25MB)
                </span>
              </button>
            )}
          </div>

          {/* Remarks Textarea */}
          <Textarea
            label="Remarks / Notes (Optional)"
            placeholder="Provide additional details regarding this expenditure..."
            rows={2}
            value={formData.remarks}
            onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
          />

          {/* Actions Footer */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isEditing ? 'Save Changes' : 'Save Expense'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Attachment Full View Modal */}
      {viewingAttachment && (() => {
        const fullUrl = getFileUrl(viewingAttachment.url);
        const isPdf = /\.pdf($|\?)/i.test(viewingAttachment.url);
        const isImg = /\.(jpg|jpeg|png|webp|heic|gif)($|\?)/i.test(viewingAttachment.url);

        return (
          <Modal
            isOpen={true}
            onClose={() => setViewingAttachment(null)}
            title={viewingAttachment.title}
            size="xl"
            footer={
              <div className="flex items-center justify-between w-full gap-2">
                <span className="text-xs text-slate-500 font-medium truncate hidden sm:inline">
                  {isPdf ? 'PDF Receipt Document' : isImg ? 'Image Receipt' : 'Attached Document'}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-2xs transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab</span>
                  </a>
                  <a
                    href={fullUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                </div>
              </div>
            }
          >
            <div className="w-full flex flex-col items-center justify-center p-0">
              {isImg ? (
                <div className="w-full max-h-[65vh] overflow-auto rounded-xl border border-slate-200 p-2 bg-slate-50 flex items-center justify-center overscroll-contain">
                  <img
                    src={fullUrl}
                    alt="Receipt Attachment"
                    className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-2xs"
                  />
                </div>
              ) : isPdf ? (
                <div className="w-full h-[58vh] sm:h-[68vh] min-h-[350px] rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative shadow-2xs overscroll-contain">
                  <iframe
                    src={`${fullUrl}#toolbar=1&navpanes=0&scrollbar=1`}
                    title={viewingAttachment.title}
                    className="w-full h-full border-0 rounded-xl"
                    style={{
                      width: '100%',
                      height: '100%',
                      WebkitOverflowScrolling: 'touch',
                    }}
                  />
                </div>
              ) : (
                <div className="py-10 text-center space-y-3 w-full">
                  <FileText className="w-14 h-14 text-indigo-500 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">Document Attachment</p>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    This file format cannot be previewed directly. Use the buttons below to open or download it.
                  </p>
                </div>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Expense Record"
        message={`Are you sure you want to delete the expense of ${deleteTarget ? formatCurrency(deleteTarget.amount) : ''} for ${deleteTarget?.expenseCategory?.name || 'this category'}? This action cannot be undone.`}
        confirmLabel="Delete Expense"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ExpensesPage;
