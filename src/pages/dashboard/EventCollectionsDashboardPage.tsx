import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collectionsService } from '../../api/collectionsService';
import { EventCollectionsDashboardData } from '../../types';
import Card from '../../components/ui/Card';
import KPICard from '../../components/common/KPICard';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/ui/Button';
import { formatCurrency } from '../../utils/formatters';
import { ArrowLeft, RefreshCw, Wallet, CheckCircle, AlertCircle, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { encodeId, decodeId } from '../../utils/idObfuscator';

export const EventCollectionsDashboardPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const [data, setData] = useState<EventCollectionsDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await collectionsService.getDashboardByEvent(id);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to load event collections dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching collections dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading event collection metrics..." />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'No dashboard data available'} onRetry={fetchData} />;
  }

  const breakdown = data.breakdownByMethod || { qr: 0, cash: 0, cheque: 0 };
  const chartData = [
    { name: 'QR / UPI', value: Number(breakdown.qr || 0), color: '#4F46E5' },
    { name: 'Cash', value: Number(breakdown.cash || 0), color: '#10B981' },
    { name: 'Cheque', value: Number(breakdown.cheque || 0), color: '#F59E0B' },
  ].filter((item) => item.value > 0);

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
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Event Collections Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive financial recovery, flat compliance, and payment channel distribution.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/events/${encodeId(id)}/collections`)}
          >
            View All Obligations
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KPICard
          title="Total Target Units"
          value={data.totalFlats}
          icon={<Wallet className="w-5 h-5" />}
          variant="default"
        />
        <KPICard
          title="Fully Paid Units"
          value={data.paidFlats}
          icon={<CheckCircle className="w-5 h-5" />}
          variant="emerald"
        />
        <KPICard
          title="Pending / Overdue Units"
          value={data.pendingFlats}
          icon={<AlertCircle className="w-5 h-5" />}
          variant="amber"
        />
        <KPICard
          title="Collection Rate"
          value={`${Number(data.collectionPercentage || 0).toFixed(1)}%`}
          icon={<PieChartIcon className="w-5 h-5" />}
          variant="indigo"
        />
      </div>

      {/* Financial Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Financial Overview">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Expected Total:</span>
              <span className="font-bold text-slate-900 text-sm">
                {formatCurrency(data.totalExpectedCollection)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Total Collected:</span>
              <span className="font-bold text-emerald-600 text-sm">
                {formatCurrency(data.totalCollected)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Total Pending:</span>
              <span className="font-bold text-rose-600 text-sm">
                {formatCurrency(data.totalPending)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Partially Paid Amount:</span>
              <span className="font-semibold text-amber-700">
                {formatCurrency(data.partiallyPaidAmount)}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Payment Method Distribution" subtitle="Cash vs QR vs Cheque collection" className="lg:col-span-2">
          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={4}
                    label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {chartData.map((entry, index) => (
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
              No payment distribution data available.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EventCollectionsDashboardPage;
