import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { reportsService } from '../../api/reportsService';
import { eventsService } from '../../api/eventsService';
import { expenseCategoriesService } from '../../api/expenseCategoriesService';
import {
  CollectionExpenseSummaryData,
  EventItem,
  ExpenseCategoryItem,
} from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportHelper';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { AppRoutes } from '../../constants/routes';
import Spinner from '../../components/ui/Spinner';
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  TrendingDown,
  Scale,
  Building2,
  Megaphone,
  Receipt,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import clsx from 'clsx';

type QuickDateFilter = 'this_month' | 'last_month' | 'this_year' | 'all_time' | 'custom';
type ActiveTab = 'overview' | 'collections' | 'expenses' | 'transactions';

export const CollectionExpenseSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedSocietyId } = useAuth();
  const toast = useToast();

  // State
  const [data, setData] = useState<CollectionExpenseSummaryData | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [categories, setCategories] = useState<ExpenseCategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Active view tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Filters
  const [quickDate, setQuickDate] = useState<QuickDateFilter>('this_month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedEventId, setSelectedEventId] = useState<string>(searchParams.get('eventId') || '');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Transaction Ledger state
  const [txnSearch, setTxnSearch] = useState<string>('');
  const [txnTypeFilter, setTxnTypeFilter] = useState<'ALL' | 'income' | 'expense'>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  // Quick Date presets
  const applyQuickDateRange = (type: QuickDateFilter) => {
    setQuickDate(type);
    const now = new Date();

    if (type === 'this_month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (type === 'last_month') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (type === 'this_year') {
      const year = now.getFullYear();
      const firstDay = new Date(year, 0, 1);
      const lastDay = new Date(year, 11, 31);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (type === 'all_time') {
      setStartDate('');
      setEndDate('');
    }
  };

  useEffect(() => {
    applyQuickDateRange('this_month');
  }, []);

  // Load event & category metadata
  useEffect(() => {
    if (!selectedSocietyId) return;

    eventsService
      .getAll({ societyId: selectedSocietyId, limit: 100, sortBy: 'start_date', sortOrder: 'desc' })
      .then((res) => {
        if (res?.success && res.data) setEvents(res.data);
      })
      .catch((err) => console.error('Failed to load events:', err));

    expenseCategoriesService
      .getAll({ societyId: selectedSocietyId, limit: 100 })
      .then((res) => {
        if (res?.success && res.data) setCategories(res.data);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, [selectedSocietyId]);

  // Fetch report data
  const fetchReport = async (manual = false) => {
    if (!selectedSocietyId) return;

    try {
      if (manual) setIsRefreshing(true);
      else setIsLoading(true);

      const params: any = {
        societyId: selectedSocietyId,
        page: 1,
        limit: 1000,
      };

      if (selectedEventId) params.eventId = selectedEventId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedSource && selectedSource !== 'ALL') params.source = selectedSource;
      if (selectedCategory && selectedCategory !== 'ALL') params.expenseCategory = selectedCategory;

      const res = await reportsService.getCollectionExpenseSummary(params);
      if (res?.success && res.data) {
        setData(res.data);
        setCurrentPage(1);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch financial summary'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedSocietyId) {
      fetchReport();
    }
  }, [selectedSocietyId, selectedEventId, startDate, endDate, selectedSource, selectedCategory]);

  // Client-side transactions filtering
  const filteredTransactions = useMemo(() => {
    if (!data?.transactions) return [];

    return data.transactions.filter((t) => {
      if (txnTypeFilter === 'income' && t.type !== 'income') return false;
      if (txnTypeFilter === 'expense' && t.type !== 'expense') return false;

      if (txnSearch.trim()) {
        const q = txnSearch.toLowerCase().trim();
        return (
          (t.party || '').toLowerCase().includes(q) ||
          (t.reference || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.sourceCategory || '').toLowerCase().includes(q) ||
          (t.paymentMode || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data?.transactions, txnSearch, txnTypeFilter]);

  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;

  // Export CSV
  const handleExportCsv = () => {
    if (!data) return;
    try {
      setIsExporting(true);
      const rows = filteredTransactions.map((t) => ({
        Date: t.date,
        Type: t.type.toUpperCase(),
        'Category / Source': t.sourceCategory,
        'Party / Unit': t.party,
        Reference: t.reference,
        Mode: t.paymentMode,
        Status: t.paymentStatus,
        'Income Received (₹)': t.incomeAmount > 0 ? t.incomeAmount : '',
        'Expense Paid (₹)': t.expenseAmount > 0 ? t.expenseAmount : '',
        Remarks: t.description || '',
      }));

      const dateStr = startDate && endDate ? `${startDate}_${endDate}` : 'all';
      exportToCsv(rows, `Financial_Summary_${dateStr}`);
      toast.success('Report exported');
    } catch {
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const formatCompactK = (val: number) => {
    if (!val) return '₹0';
    if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (Math.abs(val) >= 1000) return `₹${Math.round(val / 1000)}k`;
    return `₹${val}`;
  };

  const summary = data?.summary;
  const isSurplus = (summary?.netSurplusDeficit || 0) > 0;
  const isDeficit = (summary?.netSurplusDeficit || 0) < 0;

  const activeEventName = events.find((e) => e.id === selectedEventId)?.name;

  return (
    <div className="space-y-2.5 pb-4 animate-in fade-in duration-150">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate(AppRoutes.DASHBOARD)}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Back to Admin Home"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight truncate flex items-center gap-1.5">
              Collection & Expense Summary
            </h1>
            <p className="text-[10.5px] text-slate-400 font-medium truncate">
              {activeEventName || 'Consolidated Society Financials'}
            </p>
          </div>
        </div>

        {/* Compact Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={clsx(
              'w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shadow-2xs',
              showAdvancedFilters || selectedEventId || selectedSource !== 'ALL' || selectedCategory !== 'ALL'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50'
            )}
            title="Filter by Event, Source or Category"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting || isLoading || !data}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => fetchReport(true)}
            disabled={isRefreshing || isLoading}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', (isRefreshing || isLoading) && 'animate-spin text-indigo-600')} />
          </button>
        </div>
      </div>

      {/* 2. Sleek Date Quick Filters Bar */}
      <div className="bg-slate-100/90 p-1 rounded-xl flex items-center gap-1 overflow-x-auto no-scrollbar">
        {(
          [
            { key: 'this_month', label: 'This Month' },
            { key: 'last_month', label: 'Last Month' },
            { key: 'this_year', label: 'This Year' },
            { key: 'all_time', label: 'All Time' },
            { key: 'custom', label: 'Custom' },
          ] as const
        ).map((item) => {
          const isActive = quickDate === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => applyQuickDateRange(item.key)}
              className={clsx(
                'flex-1 min-w-[62px] py-1 px-2 rounded-lg text-[11px] font-bold text-center transition-all cursor-pointer whitespace-nowrap',
                isActive
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Custom Date Pickers Drawer */}
      {quickDate === 'custom' && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 grid grid-cols-2 gap-2 shadow-2xs animate-in fade-in duration-100">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Start Date</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 block mb-0.5">End Date</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Advanced Filter Tray */}
      {showAdvancedFilters && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-2.5 space-y-2 shadow-2xs animate-in fade-in duration-100 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Filters</span>
            {(selectedEventId || selectedSource !== 'ALL' || selectedCategory !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedEventId('');
                  setSelectedSource('ALL');
                  setSelectedCategory('ALL');
                }}
                className="text-[10.5px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Event</span>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 truncate"
              >
                <option value="">All Events</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Source</span>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 truncate"
              >
                <option value="ALL">All Sources</option>
                <option value="FLAT">Flats Only</option>
                <option value="ADVERTISING">Ads Only</option>
                <option value="EXPENSE">Expenses Only</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] font-medium text-slate-400 block mb-0.5">Category</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full text-[11px] p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 truncate"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !data && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 flex flex-col items-center justify-center gap-2 shadow-2xs">
          <Spinner size="md" />
          <p className="text-[11px] text-slate-400 font-medium">Calculating summary...</p>
        </div>
      )}

      {data && (
        <>
          {/* 3. HERO GRAND SUMMARY CARD (Minimalist Unified Architecture) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {/* Top Net Surplus / Deficit Ribbon */}
            <div
              className={clsx(
                'px-3.5 py-3 border-b flex items-center justify-between gap-2',
                isSurplus && 'bg-emerald-50/50 border-emerald-100',
                isDeficit && 'bg-rose-50/50 border-rose-100',
                !isSurplus && !isDeficit && 'bg-slate-50 border-slate-100'
              )}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                  Net Surplus / Deficit
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className={clsx(
                      'text-xl sm:text-2xl font-black tracking-tight leading-tight',
                      isSurplus && 'text-emerald-700',
                      isDeficit && 'text-rose-700',
                      !isSurplus && !isDeficit && 'text-slate-800'
                    )}
                  >
                    {isSurplus ? '+' : isDeficit ? '-' : ''}
                    {formatCurrency(Math.abs(summary?.netSurplusDeficit || 0))}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold tracking-wide uppercase',
                    isSurplus && 'bg-emerald-600 text-white',
                    isDeficit && 'bg-rose-600 text-white',
                    !isSurplus && !isDeficit && 'bg-slate-700 text-white'
                  )}
                >
                  {isSurplus ? <TrendingUp className="w-3 h-3" /> : isDeficit ? <TrendingDown className="w-3 h-3" /> : <Scale className="w-3 h-3" />}
                  {summary?.financialStatusLabel}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                  {summary?.collectionRate}% Recovery
                </span>
              </div>
            </div>

            {/* Bottom 3-Metric Stream Row */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 p-2.5 text-center">
              {/* Flat Collections */}
              <div className="px-1.5 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Flat Inflow
                </span>
                <span className="text-xs font-black text-slate-800 block mt-0.5">
                  {formatCompactK(summary?.flatCollectionsReceived || 0)}
                </span>
                <span className="text-[9.5px] text-amber-600 font-semibold block truncate">
                  Pend: {formatCompactK(summary?.flatCollectionsPending || 0)}
                </span>
              </div>

              {/* Advertising Collections */}
              <div className="px-1.5 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ad Inflow
                </span>
                <span className="text-xs font-black text-slate-800 block mt-0.5">
                  {formatCompactK(summary?.advertisingCollectionsReceived || 0)}
                </span>
                <span className="text-[9.5px] text-amber-600 font-semibold block truncate">
                  Pend: {formatCompactK(summary?.advertisingCollectionsPending || 0)}
                </span>
              </div>

              {/* Expenses Paid */}
              <div className="px-1.5 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Spent
                </span>
                <span className="text-xs font-black text-rose-600 block mt-0.5">
                  {formatCompactK(summary?.totalExpensesPaid || 0)}
                </span>
                <span className="text-[9.5px] text-slate-400 font-semibold block truncate">
                  Liab: {formatCompactK(summary?.totalExpensesPending || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Compact Mini Cash-Flow Bar Chart */}
          {data.financialTrend && data.financialTrend.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-2xs">
              <div className="flex items-center justify-between mb-1 px-1">
                <span className="text-[11px] font-bold text-slate-800">Monthly Cash Flow</span>
                <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Inflow
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Outflow
                  </span>
                </div>
              </div>

              <div className="h-32 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.financialTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#F1F5F9" />
                    <XAxis dataKey="month" tick={{ fontSize: 9.5, fill: '#94A3B8' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                    <YAxis tickFormatter={formatCompactK} tick={{ fontSize: 9, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        border: '1px solid #E2E8F0',
                        fontSize: '11px',
                        padding: '6px 10px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                    />
                    <Bar dataKey="collections" fill="#10B981" radius={[3, 3, 0, 0]} maxBarSize={20} />
                    <Bar dataKey="expenses" fill="#F43F5E" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 5. Minimalist View Switcher */}
          <div className="bg-slate-100/90 p-0.5 rounded-xl flex items-center text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={clsx(
                'flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center text-[11px]',
                activeTab === 'overview' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Summary
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('collections')}
              className={clsx(
                'flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center text-[11px]',
                activeTab === 'collections' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Collections ({data.collectionBreakdown.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={clsx(
                'flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center text-[11px]',
                activeTab === 'expenses' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Expenses ({data.expenseBreakdown.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={clsx(
                'flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center text-[11px]',
                activeTab === 'transactions' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Ledger
            </button>
          </div>

          {/* TAB 1: OVERVIEW COMPACT PROGRESS BARS */}
          {activeTab === 'overview' && (
            <div className="space-y-2.5 animate-in fade-in duration-100">
              {/* Collections Inflow Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="bg-slate-50/90 px-3 py-1.5 border-b border-slate-200/70 grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-5">Collection Source</div>
                  <div className="col-span-3 text-center">Txns</div>
                  <div className="col-span-4 text-right">Received (₹)</div>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {data.collectionBreakdown.map((item, idx) => (
                    <div key={idx} className="px-3 py-2 hover:bg-slate-50/50 transition-colors">
                      <div className="grid grid-cols-12 items-center">
                        <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                          {item.sourceKey === 'flat' ? (
                            <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          ) : (
                            <Megaphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          )}
                          <span className="font-bold text-slate-800 truncate text-[11.5px]">{item.source}</span>
                        </div>
                        <div className="col-span-3 text-center font-bold text-slate-500 text-[11px]">
                          {item.transactionCount}
                        </div>
                        <div className="col-span-4 text-right">
                          <span className="font-black text-emerald-600 text-[12px]">
                            {formatCurrency(item.amountReceived)}
                          </span>
                        </div>
                      </div>
                      {/* Sub-bar */}
                      <div className="mt-1 flex items-center justify-between text-[9.5px] text-slate-400">
                        <span>{item.contributionPercentage}% share</span>
                        <span>Pending: {formatCurrency(item.pendingAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Expense Outflow Table Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
                <div className="bg-slate-50/90 px-3 py-1.5 border-b border-slate-200/70 grid grid-cols-12 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="col-span-5">Expense Category</div>
                  <div className="col-span-3 text-center">Vouchers</div>
                  <div className="col-span-4 text-right">Paid (₹)</div>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  {data.expenseBreakdown.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs">No expenses recorded</div>
                  ) : (
                    data.expenseBreakdown.map((item, idx) => (
                      <div key={idx} className="px-3 py-2 hover:bg-slate-50/50 transition-colors">
                        <div className="grid grid-cols-12 items-center">
                          <div className="col-span-5 flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: item.colorCode || '#F43F5E' }}
                            />
                            <span className="font-bold text-slate-800 truncate text-[11.5px]">{item.categoryName}</span>
                          </div>
                          <div className="col-span-3 text-center font-bold text-slate-500 text-[11px]">
                            {item.transactionCount}
                          </div>
                          <div className="col-span-4 text-right">
                            <span className="font-black text-rose-600 text-[12px]">
                              {formatCurrency(item.amountPaid)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[9.5px] text-slate-400">
                          <span>{item.contributionPercentage}% share</span>
                          {item.pendingAmount > 0 && (
                            <span className="text-amber-600 font-semibold">
                              Liab: {formatCurrency(item.pendingAmount)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DETAILED COLLECTIONS */}
          {activeTab === 'collections' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden animate-in fade-in duration-100">
              <div className="bg-slate-50/90 px-3.5 py-2 border-b border-slate-200/70 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Consolidated Inflow Breakdown
              </div>
              <div className="divide-y divide-slate-100">
                {data.collectionBreakdown.map((item, idx) => (
                  <div key={idx} className="p-3.5 hover:bg-slate-50/40 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          {item.sourceKey === 'flat' ? <Building2 className="w-3.5 h-3.5" /> : <Megaphone className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{item.source}</h4>
                          <span className="text-[10px] text-slate-400">{item.transactionCount} payments</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-emerald-600 block">{formatCurrency(item.amountReceived)}</span>
                        <span className="text-[10px] text-slate-400">{item.contributionPercentage}% share</span>
                      </div>
                    </div>

                    {/* Progress Ratio */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${item.totalExpected > 0 ? Math.min(100, (item.amountReceived / item.totalExpected) * 100) : 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>Pending: <strong className="text-amber-600">{formatCurrency(item.pendingAmount)}</strong></span>
                      <span>Target: {formatCurrency(item.totalExpected)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DETAILED EXPENSES */}
          {activeTab === 'expenses' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden animate-in fade-in duration-100">
              <div className="bg-slate-50/90 px-3.5 py-2 border-b border-slate-200/70 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                Expense Categories Ledger
              </div>
              <div className="divide-y divide-slate-100">
                {data.expenseBreakdown.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs">No expense items found</div>
                ) : (
                  data.expenseBreakdown.map((item, idx) => (
                    <div key={idx} className="p-3.5 hover:bg-slate-50/40 transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.colorCode || '#F43F5E' }}
                          />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">{item.categoryName}</h4>
                            <span className="text-[10px] text-slate-400">{item.transactionCount} vouchers</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-rose-600 block">{formatCurrency(item.amountPaid)}</span>
                          <span className="text-[10px] text-slate-400">{item.contributionPercentage}% share</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="bg-rose-500 h-full rounded-full"
                          style={{ width: `${Math.min(100, item.contributionPercentage)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                        <span>Unpaid Liab: <strong className="text-rose-600">{formatCurrency(item.pendingAmount)}</strong></span>
                        <span>Budget: {formatCurrency(item.totalAmount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: COMPACT TRANSACTIONS LEDGER */}
          {activeTab === 'transactions' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden animate-in fade-in duration-100">
              {/* Ledger Search & Filter Sub-bar */}
              <div className="p-2.5 border-b border-slate-100 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search ledger..."
                    value={txnSearch}
                    onChange={(e) => {
                      setTxnSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold shrink-0">
                  {(
                    [
                      { key: 'ALL', label: 'All' },
                      { key: 'income', label: 'In' },
                      { key: 'expense', label: 'Out' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => {
                        setTxnTypeFilter(f.key);
                        setCurrentPage(1);
                      }}
                      className={clsx(
                        'px-2 py-0.5 rounded transition-all cursor-pointer',
                        txnTypeFilter === f.key ? 'bg-white text-indigo-700 shadow-2xs font-extrabold' : 'text-slate-500'
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimalist Row-by-Row Table */}
              <div className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">No records found</div>
                ) : (
                  paginatedTransactions.map((t) => {
                    const isIncome = t.type === 'income';
                    return (
                      <div key={t.id} className="px-3.5 py-2 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400">{t.date}</span>
                              <span className="text-[10px] px-1 rounded bg-slate-100 text-slate-600 font-semibold">
                                {t.paymentMode}
                              </span>
                            </div>
                            <h5 className="text-[11.5px] font-bold text-slate-800 truncate mt-0.5">
                              {t.party}
                            </h5>
                            <p className="text-[10px] text-slate-400 truncate">
                              {t.sourceCategory}
                              {t.reference && t.reference !== '-' ? ` • ${t.reference}` : ''}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={clsx(
                                'text-[12.5px] font-black block',
                                isIncome ? 'text-emerald-600' : 'text-rose-600'
                              )}
                            >
                              {isIncome ? `+${formatCurrency(t.incomeAmount)}` : `-${formatCurrency(t.expenseAmount)}`}
                            </span>
                            <span className="text-[9.5px] font-semibold text-slate-400 uppercase">
                              {t.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Mini Pagination Footer */}
              {totalPages > 1 && (
                <div className="px-3 py-2 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[10.5px]">
                  <span className="text-slate-400">
                    {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredTransactions.length)} of {filteredTransactions.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-1.5 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      Prev
                    </button>
                    <span className="font-bold text-slate-700 px-1">{currentPage}/{totalPages}</span>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-1.5 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CollectionExpenseSummaryPage;
