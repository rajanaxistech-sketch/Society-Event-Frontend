import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { sombhaWelfareService } from '../../api/sombhaWelfareService';
import { SombhaWelfareItem, SombhaWelfareSummary } from '../../types';
import { RecordSombhaWelfareModal } from './RecordSombhaWelfareModal';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  HeartHandshake,
  Plus,
  Search,
  Banknote,
  QrCode,
  CreditCard,
  Building2,
  Users,
  IndianRupee,
  Edit2,
  Trash2,
  ArrowLeft,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { AppRoutes } from '../../constants/routes';

export const SombhaWelfarePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedSocietyId } = useAuth();

  const [items, setItems] = useState<SombhaWelfareItem[]>([]);
  const [summary, setSummary] = useState<SombhaWelfareSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SombhaWelfareItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async (silent = false) => {
    try {
      if (silent) setIsRefreshing(true);
      else setIsLoading(true);

      const [listRes, summaryRes] = await Promise.all([
        sombhaWelfareService.getAll({
          societyId: selectedSocietyId || undefined,
          modeOfPayment: selectedMode !== 'ALL' ? selectedMode : undefined,
          search: search.trim() || undefined,
          limit: 100,
        }),
        sombhaWelfareService.getSummary({
          societyId: selectedSocietyId || undefined,
        }),
      ]);

      if (listRes.success && listRes.data) {
        setItems(listRes.data);
      }
      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load Sombha Welfare data'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedSocietyId, selectedMode]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      await sombhaWelfareService.delete(id);
      toast.success('Contribution removed successfully');
      setDeleteId(null);
      fetchData(true);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete contribution'));
    } finally {
      setIsDeleting(false);
    }
  };

  const getPaymentModeBadge = (mode: string) => {
    const m = (mode || 'CASH').toUpperCase();
    switch (m) {
      case 'UPI':
      case 'QR':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/80">
            <QrCode className="w-2.5 h-2.5 text-indigo-500" />
            UPI
          </span>
        );
      case 'CHEQUE':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100/80">
            <CreditCard className="w-2.5 h-2.5 text-amber-500" />
            Cheque
          </span>
        );
      case 'TRANSFER':
      case 'BANK_TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100/80">
            <Building2 className="w-2.5 h-2.5 text-sky-500" />
            Transfer
          </span>
        );
      case 'CASH':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/80">
            <Banknote className="w-2.5 h-2.5 text-emerald-500" />
            Cash
          </span>
        );
    }
  };

  const totalCollected = summary?.totalAmount ?? items.reduce((acc, i) => acc + (i.amount || 0), 0);
  const totalContributors = summary?.totalContributors ?? items.length;

  // Filter modes chips with counts
  const filterChips = useMemo(() => {
    const modes = [
      { key: 'ALL', label: 'All', count: totalContributors },
      { key: 'CASH', label: 'Cash', count: summary?.modeCounts?.['CASH']?.count || 0 },
      { key: 'UPI', label: 'UPI', count: summary?.modeCounts?.['UPI']?.count || 0 },
      { key: 'CHEQUE', label: 'Cheque', count: summary?.modeCounts?.['CHEQUE']?.count || 0 },
      { key: 'BANK_TRANSFER', label: 'Transfer', count: summary?.modeCounts?.['BANK_TRANSFER']?.count || 0 },
    ];
    return modes;
  }, [summary, totalContributors]);

  return (
    <div className="space-y-3 animate-in fade-in duration-150 pb-8 pt-0.5 max-w-4xl mx-auto px-0.5">
      {/* 1. Sleek Compact Header */}
      <div className="flex items-center justify-between gap-2 px-1">
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
            <div className="flex items-center gap-1.5">
              <h1 className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight truncate">
                Sombha Welfare
              </h1>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[9.5px] font-bold border border-emerald-100 shrink-0">
                Staff Fund
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium truncate">
              Support staff welfare collection
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isRefreshing && 'animate-spin text-emerald-600')} />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* 2. Unified Minimalist Hero Metric Card */}
      <div className="bg-gradient-to-r from-emerald-50/70 via-white to-teal-50/40 rounded-2xl border border-emerald-100/90 p-3 shadow-2xs">
        <div className="flex items-center justify-between gap-3">
          {/* Main Total Inflow */}
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-emerald-800/80 uppercase tracking-wider block">
              Total Fund Collected
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                ₹{totalCollected.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                <Users className="w-3 h-3 text-emerald-600" />
                {totalContributors} contributor{totalContributors === 1 ? '' : 's'}
              </span>
              <span>•</span>
              <span>
                Avg ₹{totalContributors > 0 ? Math.round(totalCollected / totalContributors).toLocaleString('en-IN') : 0}
              </span>
            </div>
          </div>

          {/* Mode Chips Mini Stack */}
          <div className="text-right shrink-0">
            <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Payment Split
            </span>
            <div className="flex items-center justify-end gap-1 flex-wrap max-w-[170px]">
              {summary?.modeCounts && Object.keys(summary.modeCounts).length > 0 ? (
                Object.entries(summary.modeCounts).map(([mode, data]) => (
                  <span
                    key={mode}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-emerald-200/80 text-[10px] font-semibold text-slate-800 shadow-2xs"
                  >
                    <span className="text-emerald-700 font-bold font-mono">₹{data.amount.toLocaleString('en-IN')}</span>
                    <span className="text-slate-400 text-[9px]">({mode})</span>
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-slate-400 italic">No payments yet</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sleek Search & Minimalist Filter Chips */}
      <div className="space-y-1.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Person, Flat, or Collector..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="w-4 h-4 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Minimalist Mode Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {filterChips.map((chip) => {
            const isSelected = selectedMode === chip.key;
            return (
              <button
                key={chip.key}
                type="button"
                onClick={() => setSelectedMode(chip.key)}
                className={clsx(
                  'px-2.5 py-1 rounded-full text-[10.5px] font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1',
                  isSelected
                    ? 'bg-slate-900 text-white font-bold shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                <span>{chip.label}</span>
                <span
                  className={clsx(
                    'text-[9px] px-1 py-0.2 rounded-full font-bold',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Minimalist Items List */}
      {isLoading ? (
        <div className="py-14 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/90 shadow-2xs">
          <Spinner size="sm" />
          <p className="text-[11px] text-slate-400 font-medium mt-2">Loading contributions...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <HeartHandshake className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">No contributions found</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs mx-auto">
            {search || selectedMode !== 'ALL'
              ? 'Try adjusting your search or mode filter.'
              : 'Record the first contribution for Sombha Welfare.'}
          </p>
          <div className="mt-3">
            <button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs hover:bg-emerald-700 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Contribution
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-200/80 px-3 py-2.5 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all duration-150"
            >
              {/* Row 1: Person + Flat + Amount + Mode */}
              <div className="flex items-center justify-between gap-2">
                {/* Left: Avatar + Person Name + Flat Badge */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0">
                    {item.personName?.charAt(0) || item.person_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {item.personName || item.person_name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold font-mono text-[9.5px] border border-slate-200/60 shrink-0">
                      {item.block ? `${item.block}-` : ''}
                      {item.flatNumber || item.flat_number}
                    </span>
                  </div>
                </div>

                {/* Right: Amount + Mode Badge */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="font-extrabold font-mono text-[13px] text-emerald-700">
                    ₹{(item.amount || 0).toLocaleString('en-IN')}
                  </span>
                  {getPaymentModeBadge(item.modeOfPayment || item.mode_of_payment || 'CASH')}
                </div>
              </div>

              {/* Row 2: Sub-info (Remarks / Collector) + Compact Actions */}
              <div className="flex items-center justify-between gap-2 mt-1 pt-1 border-t border-slate-100/70 text-[10.5px]">
                {/* Remarks or Collector Info */}
                <div className="flex items-center gap-1.5 text-slate-400 min-w-0 truncate">
                  {item.remarks ? (
                    <span className="truncate italic text-slate-500" title={item.remarks}>
                      "{item.remarks}"
                    </span>
                  ) : (
                    <span className="italic text-slate-300">No remarks</span>
                  )}
                  {(item.collectorName || item.collector_name) && (
                    <span className="shrink-0 text-slate-400">
                      • by <span className="text-slate-600 font-medium">{item.collectorName || item.collector_name}</span>
                    </span>
                  )}
                  {(item.transactionReference || item.transaction_reference) && (
                    <span className="shrink-0 font-mono text-slate-400">
                      • Ref: {item.transactionReference || item.transaction_reference}
                    </span>
                  )}
                </div>

                {/* Compact Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setIsModalOpen(true);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                    title="Edit"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(item.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record / Edit Modal */}
      <RecordSombhaWelfareModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSuccess={() => fetchData(true)}
        initialData={editingItem}
        societyId={selectedSocietyId || undefined}
      />

      {/* Delete Confirmation Alert Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-sm w-full p-4 shadow-xl border border-slate-200 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900">Delete Contribution?</h3>
            <p className="text-[11px] text-slate-500 leading-normal">
              Are you sure you want to remove this welfare contribution? This will also update the Collection Summary and Expense reports.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="rounded-lg text-xs py-1 px-2.5"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(deleteId)}
                isLoading={isDeleting}
                className="rounded-lg text-xs font-bold py-1 px-2.5"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SombhaWelfarePage;
