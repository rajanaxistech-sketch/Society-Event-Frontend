import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { collectionsService } from '../../api/collectionsService';
import { eventsService } from '../../api/eventsService';
import { EventCollectionOverallSummary, EventItem, PaymentModeSummaryItem } from '../../types';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import Spinner from '../../components/ui/Spinner';
import {
  ArrowLeft,
  RefreshCw,
  Building2,
  Megaphone,
  Coins,
  Wallet,
  Smartphone,
  Banknote,
  FileCheck,
  Landmark,
  CreditCard,
  ArrowRightLeft,
} from 'lucide-react';

export const CollectionSummaryPage: React.FC = () => {
  const { id: paramEventId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { selectedSocietyId } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState<EventCollectionOverallSummary | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Resolve active event ID
  useEffect(() => {
    const rawId = paramEventId ? decodeId(paramEventId) || paramEventId : searchParams.get('eventId') || '';
    if (rawId) {
      setSelectedEventId(rawId);
    }
  }, [paramEventId, searchParams]);

  // Load events list for current society
  useEffect(() => {
    if (!selectedSocietyId) return;

    eventsService
      .getAll({ societyId: selectedSocietyId, limit: 20, sortBy: 'start_date', sortOrder: 'desc' })
      .then((res) => {
        if (res?.success && res.data && res.data.length > 0) {
          setEvents(res.data);
          if (!selectedEventId) {
            setSelectedEventId(res.data[0].id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load events', err);
      });
  }, [selectedSocietyId]);

  // Load collection summary
  const fetchSummary = async (eventId: string, isManualRefresh = false) => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      const res = await collectionsService.getSummaryByEvent(eventId);
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      console.error('Failed to load collection summary', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchSummary(selectedEventId);
    }
  }, [selectedEventId]);

  const formatAmount = (val?: number) => {
    const num = Number(val || 0);
    return num.toLocaleString('en-IN');
  };

  const formatTowerDisplayName = (name?: string, index?: number): string => {
    if (!name || !name.trim()) {
      return index !== undefined ? `Tower ${String.fromCharCode(65 + index)}` : 'Tower';
    }
    const trimmed = name.trim();
    const match = trimmed.match(/^(?:tower|block|wing|building)[-_\s]*(.*)$/i);
    if (match) {
      const suffix = match[1]?.trim();
      return suffix ? `Tower ${suffix}` : trimmed;
    }
    return `Tower ${trimmed}`;
  };

  const getActiveModesList = (counts?: { upi?: number; cash?: number; cheque?: number; transfer?: number }, amounts?: { upi?: number; cash?: number; cheque?: number; transfer?: number }) => {
    if (!counts) return [];
    const list: { code: string; name: string; flatCount: number; amount: number; dotBg: string; textBadge: string; bgBadge: string }[] = [];
    if ((counts.upi || 0) > 0) {
      list.push({
        code: 'UPI',
        name: 'UPI',
        flatCount: counts.upi || 0,
        amount: amounts?.upi || 0,
        dotBg: 'bg-indigo-500',
        textBadge: 'text-indigo-700',
        bgBadge: 'bg-indigo-50/80',
      });
    }
    if ((counts.cash || 0) > 0) {
      list.push({
        code: 'CASH',
        name: 'Cash',
        flatCount: counts.cash || 0,
        amount: amounts?.cash || 0,
        dotBg: 'bg-emerald-500',
        textBadge: 'text-emerald-700',
        bgBadge: 'bg-emerald-50/80',
      });
    }
    if ((counts.transfer || 0) > 0) {
      list.push({
        code: 'TRANSFER',
        name: 'Transfer',
        flatCount: counts.transfer || 0,
        amount: amounts?.transfer || 0,
        dotBg: 'bg-sky-500',
        textBadge: 'text-sky-700',
        bgBadge: 'bg-sky-50/80',
      });
    }
    if ((counts.cheque || 0) > 0) {
      list.push({
        code: 'CHEQUE',
        name: 'Cheque',
        flatCount: counts.cheque || 0,
        amount: amounts?.cheque || 0,
        dotBg: 'bg-amber-500',
        textBadge: 'text-amber-700',
        bgBadge: 'bg-amber-50/80',
      });
    }
    return list;
  };

  const getPaymentModeStyle = (code: string) => {
    const c = (code || '').toUpperCase();
    if (c === 'UPI' || c === 'QR') {
      return {
        icon: Smartphone,
        iconBg: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        iconBorder: 'border-indigo-100',
        barBg: 'bg-indigo-600',
        badgeBg: 'bg-indigo-50',
        badgeText: 'text-indigo-700',
        amountColor: 'text-indigo-600',
      };
    }
    if (c === 'CASH') {
      return {
        icon: Banknote,
        iconBg: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        iconBorder: 'border-emerald-100',
        barBg: 'bg-emerald-500',
        badgeBg: 'bg-emerald-50',
        badgeText: 'text-emerald-700',
        amountColor: 'text-emerald-600',
      };
    }
    if (c === 'CHEQUE') {
      return {
        icon: FileCheck,
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-600',
        iconBorder: 'border-amber-100',
        barBg: 'bg-amber-500',
        badgeBg: 'bg-amber-50',
        badgeText: 'text-amber-700',
        amountColor: 'text-amber-600',
      };
    }
    if (
      c === 'TRANSFER' ||
      c === 'BANK_TRANSFER' ||
      c === 'ONLINE' ||
      c === 'NEFT' ||
      c === 'RTGS' ||
      c === 'IMPS'
    ) {
      return {
        icon: ArrowRightLeft,
        iconBg: 'bg-sky-50',
        iconColor: 'text-sky-600',
        iconBorder: 'border-sky-100',
        barBg: 'bg-sky-500',
        badgeBg: 'bg-sky-50',
        badgeText: 'text-sky-700',
        amountColor: 'text-sky-600',
      };
    }
    return {
      icon: CreditCard,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      iconBorder: 'border-purple-100',
      barBg: 'bg-purple-500',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-700',
      amountColor: 'text-purple-600',
    };
  };

  const handleEventChange = (newEventId: string) => {
    setSelectedEventId(newEventId);
    navigate(`/events/${encodeId(newEventId)}/collection-summary`, { replace: true });
  };

  if (isLoading && !summary) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <Spinner size="md" label="Loading collection summary..." />
      </div>
    );
  }

  const grandTotal = summary?.grandTotal;
  const flatSubtotal = summary?.flatCollectionsSubtotal;
  const adSummary = summary?.advertisementCollections;
  const blocks = summary?.blocks || [];
  const paymentModes: PaymentModeSummaryItem[] = summary?.paymentModes || [];

  const overallCollected = grandTotal?.totalCollected || 0;
  const overallTarget = grandTotal?.totalTarget || 0;
  const overallPercent = grandTotal?.collectionPercentage || 0;

  return (
    <div className="space-y-2.5 animate-in fade-in duration-150 pb-2">
      {/* 1. Clean Top Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Go back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight truncate">
              Collection Summary
            </h1>
            <p className="text-[10.5px] text-slate-400 font-medium truncate">
              {summary?.eventName || 'Event Financial Overview'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {events.length > 1 && (
            <select
              value={selectedEventId}
              onChange={(e) => handleEventChange(e.target.value)}
              className="text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg py-1 px-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer max-w-[130px] truncate shadow-2xs"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => fetchSummary(selectedEventId, true)}
            disabled={isRefreshing}
            className="w-7 h-7 rounded-lg bg-white border border-slate-200/90 hover:bg-slate-50 text-slate-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. CARD 1: Flat Collections (Block / Tower-Wise) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Table Header */}
        <div className="bg-slate-50/90 px-3.5 py-2 border-b border-slate-200/70 grid grid-cols-12 text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
          <div className="col-span-4">Block / Tower</div>
          <div className="col-span-3 text-center">Flats (Tot/Paid)</div>
          <div className="col-span-5 text-right">Amount (Tot/Paid)</div>
        </div>

        {/* Block Rows */}
        <div className="divide-y divide-slate-100 text-xs">
          {blocks.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs font-medium">
              No blocks found.
            </div>
          ) : (
            blocks.map((block, idx) => {
              const towerDisplayName = formatTowerDisplayName(block.blockName, idx);
              const activeModes = getActiveModesList(block.paymentCounts, block.paymentAmounts);
              return (
                <div
                  key={block.blockId || idx}
                  className="px-3.5 py-2 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="grid grid-cols-12 items-center">
                    {/* Tower Name */}
                    <div className="col-span-4 flex items-center min-w-0">
                      <span className="font-bold text-slate-800 truncate text-[12px]">
                        {towerDisplayName}
                      </span>
                    </div>

                    {/* Flats Ratio (e.g. 40/17) */}
                    <div className="col-span-3 text-center">
                      <span className="font-bold text-slate-800 text-[12px]">
                        {block.totalFlats}/{block.paidFlats}
                      </span>
                    </div>

                    {/* Amount Ratio (e.g. 40000/2000) */}
                    <div className="col-span-5 text-right font-mono">
                      <span className="font-bold text-slate-500 text-[11px]">
                        {formatAmount(block.totalExpectedAmount)}
                      </span>
                      <span className="text-slate-300 font-light text-[10px] mx-1">/</span>
                      <span className={`font-black text-[12px] ${block.totalCollectedAmount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {formatAmount(block.totalCollectedAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Minimal active payment tags only when paid flats exist */}
                  {activeModes.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 pt-0.5">
                      {activeModes.map((m) => (
                        <span
                          key={m.code}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${m.bgBadge} ${m.textBadge}`}
                          title={`${m.name}: ${m.flatCount} flats (₹${formatAmount(m.amount)})`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${m.dotBg}`} />
                          <span>{m.name}:</span>
                          <span className="font-black">{m.flatCount}</span>
                          {m.amount > 0 && (
                            <span className="text-[9px] font-mono opacity-75 font-normal">
                              (₹{formatAmount(m.amount)})
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Flat Collections Subtotal Row */}
          {flatSubtotal && (() => {
            const subtotalActiveModes = getActiveModesList(flatSubtotal.paymentCounts, flatSubtotal.paymentAmounts);
            return (
              <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-200/80">
                <div className="grid grid-cols-12 items-center">
                  <div className="col-span-4 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="font-bold text-slate-800 text-[11.5px]">
                      Flats Subtotal
                    </span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="font-extrabold text-slate-900 text-[12px]">
                      {flatSubtotal.totalFlats}/{flatSubtotal.paidFlats}
                    </span>
                  </div>
                  <div className="col-span-5 text-right font-mono">
                    <span className="font-bold text-slate-500 text-[11px]">
                      {formatAmount(flatSubtotal.totalExpectedAmount)}
                    </span>
                    <span className="text-slate-300 font-light text-[10px] mx-1">/</span>
                    <span className={`font-black text-[12px] ${flatSubtotal.totalCollectedAmount > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {formatAmount(flatSubtotal.totalCollectedAmount)}
                    </span>
                  </div>
                </div>

                {/* Minimal Subtotal Active Modes */}
                {subtotalActiveModes.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 pt-0.5">
                    {subtotalActiveModes.map((m) => (
                      <span
                        key={m.code}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${m.bgBadge} ${m.textBadge}`}
                        title={`Flats ${m.name}: ${m.flatCount} flats (₹${formatAmount(m.amount)})`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${m.dotBg}`} />
                        <span>{m.name}:</span>
                        <span className="font-black">{m.flatCount}</span>
                        {m.amount > 0 && (
                          <span className="text-[9px] font-mono opacity-75 font-normal">
                            (₹{formatAmount(m.amount)})
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 3. CARD 2: Advertisement Collection (Separated White Card) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3">
        <div className="grid grid-cols-12 items-center">
          <div className="col-span-4 flex items-center gap-2 min-w-0">
            <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Megaphone className="w-3 h-3" />
            </span>
            <span className="font-bold text-slate-800 text-[12px] truncate">
              Advertising
            </span>
          </div>

          <div className="col-span-3 text-center">
            <span className="font-bold text-slate-800 text-[12px]">
              {adSummary?.totalAds ?? 0}/{adSummary?.paidAds ?? 0}
            </span>
          </div>

          <div className="col-span-5 text-right font-mono">
            <span className="font-bold text-slate-500 text-[11px]">
              {formatAmount(adSummary?.totalExpectedAmount)}
            </span>
            <span className="text-slate-300 font-light text-[10px] mx-1">/</span>
            <span className={`font-black text-[12px] ${(adSummary?.totalCollectedAmount || 0) > 0 ? 'text-indigo-600' : 'text-slate-800'}`}>
              {formatAmount(adSummary?.totalCollectedAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. CARD 3: Overall Total Collection of Both (Flats + Ads) */}
      <div className="bg-white rounded-2xl border border-emerald-200/90 shadow-2xs p-3.5 bg-gradient-to-r from-emerald-50/40 via-white to-indigo-50/30">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Coins className="w-3 h-3" />
            </div>
            <span className="font-black text-[13px] text-slate-900 tracking-tight">
              Overall Total Collection
            </span>
          </div>
          <span className="text-[10.5px] font-black text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2 py-0.5 rounded-full">
            {overallPercent}% Recovered
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <span className="text-[11px] font-medium text-slate-500">
            Flats + Advertising Total
          </span>
          <div className="flex items-baseline gap-1 font-mono text-right">
            <span className="font-bold text-slate-500 text-xs">
              ₹{formatAmount(overallTarget)}
            </span>
            <span className="text-slate-300 font-light text-xs mx-0.5">/</span>
            <span className="font-black text-emerald-600 text-base">
              ₹{formatAmount(overallCollected)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. CARD 4: Payment Modes Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50/90 px-3.5 py-2.5 border-b border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <Wallet className="w-3 h-3" />
            </span>
            <div>
              <span className="font-bold text-slate-800 text-[12px] block leading-tight">
                Collection by Payment Mode
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Split across UPI, Cash, Cheque, Transfer & more
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
            ₹{formatAmount(overallCollected)}
          </span>
        </div>

        {/* Multi-segment visual proportional bar */}
        {overallCollected > 0 && paymentModes.some((m) => m.totalAmount > 0) && (
          <div className="px-3.5 pt-3 pb-1">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {paymentModes
                .filter((m) => m.totalAmount > 0)
                .map((m, idx) => {
                  const modeStyle = getPaymentModeStyle(m.code);
                  return (
                    <div
                      key={m.code || idx}
                      style={{ width: `${Math.max(m.percentage, 2)}%` }}
                      className={`${modeStyle.barBg} h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                      title={`${m.name}: ₹${formatAmount(m.totalAmount)} (${m.percentage}%)`}
                    />
                  );
                })}
            </div>
          </div>
        )}

        {/* Payment Modes List */}
        <div className="divide-y divide-slate-100 text-xs">
          {paymentModes.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-xs font-medium">
              No payment mode data available.
            </div>
          ) : (
            paymentModes.map((mode, idx) => {
              const style = getPaymentModeStyle(mode.code);
              const ModeIcon = style.icon;
              const hasAmount = mode.totalAmount > 0;

              return (
                <div
                  key={mode.code || idx}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Left: Mode Icon + Name + Subtitle */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg} ${style.iconColor} border ${style.iconBorder}`}
                    >
                      <ModeIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 text-[12px] truncate">
                          {mode.name}
                        </span>
                        {mode.transactionCount > 0 && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({mode.transactionCount} {mode.transactionCount === 1 ? 'txn' : 'txns'})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 truncate">
                        <span>Flats: ₹{formatAmount(mode.flatAmount)}</span>
                        <span>•</span>
                        <span>Ads: ₹{formatAmount(mode.adAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Share % Badge */}
                  <div className="text-right shrink-0">
                    <div className="font-mono">
                      <span
                        className={`font-black text-[13px] ${
                          hasAmount ? style.amountColor : 'text-slate-700'
                        }`}
                      >
                        ₹{formatAmount(mode.totalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-md ${
                          hasAmount
                            ? `${style.badgeBg} ${style.badgeText}`
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {mode.percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionSummaryPage;

