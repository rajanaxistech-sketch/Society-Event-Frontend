import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventsService } from '../../api/eventsService';
import { collectionsService } from '../../api/collectionsService';
import { EventCollectionsDashboardData, EventItem } from '../../types';
import KPICard from '../../components/common/KPICard';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Calendar,
  Wallet,
  Users,
  Utensils,
  Shirt,
  Sparkles,
  ArrowLeft,
  RefreshCw,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { encodeId, decodeId } from '../../utils/idObfuscator';

export const EventDashboardPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [collectionsDash, setCollectionsDash] = useState<EventCollectionsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [eventRes, collectionsDashRes] = await Promise.all([
        eventsService.getById(id),
        collectionsService.getDashboardByEvent(id).catch(() => null),
      ]);

      if (eventRes.success && eventRes.data) {
        setEvent(eventRes.data);
      }
      if (collectionsDashRes && collectionsDashRes.success && collectionsDashRes.data) {
        setCollectionsDash(collectionsDashRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load event dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading event dashboard..." />
      </div>
    );
  }

  if (error || !event) {
    return <ErrorState message={error || 'Event not found'} onRetry={fetchDashboard} />;
  }

  const counts = event._count || {};
  const config = event.event_configuration;

  const paymentBreakdown = collectionsDash?.breakdownByMethod || { qr: 0, cash: 0, cheque: 0 };
  const pieData = [
    { name: 'QR / Online', value: Number(paymentBreakdown.qr || 0), color: '#4F46E5' },
    { name: 'Cash', value: Number(paymentBreakdown.cash || 0), color: '#10B981' },
    { name: 'Cheque', value: Number(paymentBreakdown.cheque || 0), color: '#F59E0B' },
  ].filter((p) => p.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/events/${encodeId(id)}`)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Event
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{event.name}</h1>
              <StatusBadge status={event.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Date: <span className="font-semibold">{formatDate(event.start_date)}</span> &bull; Venue: {event.venue || 'Clubhouse'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboard}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/events/${encodeId(id)}`)}
          >
            Manage Modules
          </Button>
        </div>
      </div>

      {/* Module Overview Cards */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <KPICard
          title="Collections"
          value={counts.event_collections ?? 0}
          subtitle={config?.collection_enabled ? 'Module Enabled' : 'Disabled'}
          icon={<Wallet className="w-5 h-5" />}
          variant={config?.collection_enabled ? 'indigo' : 'default'}
        />
        <KPICard
          title="Sponsors"
          value={counts.sponsors ?? 0}
          subtitle={config?.sponsorship_enabled ? 'Module Enabled' : 'Disabled'}
          icon={<Users className="w-5 h-5" />}
          variant={config?.sponsorship_enabled ? 'emerald' : 'default'}
        />
        <KPICard
          title="Food Items"
          value={counts.food_items ?? 0}
          subtitle={config?.food_enabled ? 'Module Enabled' : 'Disabled'}
          icon={<Utensils className="w-5 h-5" />}
          variant="default"
        />
        <KPICard
          title="Dress Codes"
          value={counts.dress_codes ?? 0}
          subtitle={config?.dress_code_enabled ? 'Module Enabled' : 'Disabled'}
          icon={<Shirt className="w-5 h-5" />}
          variant="default"
        />
        <KPICard
          title="Activities"
          value={counts.event_activities ?? 0}
          subtitle={config?.activities_enabled ? 'Module Enabled' : 'Disabled'}
          icon={<Sparkles className="w-5 h-5" />}
          variant="teal"
        />
      </div>

      {/* Financial Collections Progress (if available) */}
      {collectionsDash && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Event Collection KPIs" subtitle="Unit payment status breakdown">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Units</span>
                  <p className="text-xl font-bold text-slate-900">{collectionsDash.totalFlats}</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <span className="text-[11px] text-emerald-700 font-semibold uppercase">Paid Units</span>
                  <p className="text-xl font-bold text-emerald-700">{collectionsDash.paidFlats}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="text-[11px] text-amber-800 font-semibold uppercase">Pending Units</span>
                  <p className="text-xl font-bold text-amber-800">{collectionsDash.pendingFlats}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                  <span className="text-[11px] text-indigo-700 font-semibold uppercase">Completion</span>
                  <p className="text-xl font-bold text-indigo-700">{Number(collectionsDash.collectionPercentage || 0).toFixed(1)}%</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected Total:</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(collectionsDash.totalExpectedCollection)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Collected So Far:</span>
                  <span className="font-semibold text-emerald-600">{formatCurrency(collectionsDash.totalCollected)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pending Amount:</span>
                  <span className="font-semibold text-rose-600">{formatCurrency(collectionsDash.totalPending)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Payment Method Breakdown" subtitle="Distribution across payment channels" className="lg:col-span-2">
            {pieData.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                      label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [formatCurrency(val), 'Amount']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <PieChartIcon className="w-8 h-8 mb-2 opacity-50" />
                No payment transactions recorded yet.
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default EventDashboardPage;
