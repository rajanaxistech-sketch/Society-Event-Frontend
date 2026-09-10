import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../api/dashboardService';
import { SystemDashboardData } from '../../types';
import KPICard from '../../components/common/KPICard';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { formatCurrency } from '../../utils/formatters';
import {
  Building2,
  Layers,
  Home,
  Users,
  Calendar,
  Sparkles,
  TrendingUp,
  DollarSign,
  PieChart as PieChartIcon,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from 'recharts';
import Button from '../../components/ui/Button';

// Formatting helper for currency axis ticks
const formatAxisCurrency = (val: number) => {
  if (val === 0) return '₹0';
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
  if (val >= 1000) return `₹${Math.round(val / 1000)}k`;
  return `₹${val}`;
};

// Custom interactive tooltip for grouped horizontal bars
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-3 shadow-lg text-xs min-w-[170px]">
        <p className="font-bold text-slate-900 mb-2 pb-1.5 border-b border-slate-100 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
          <span>{label}</span>
        </p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color || (entry.name === 'Collected' ? '#4F46E5' : '#F59E0B') }}
                />
                <span className="text-slate-600 font-medium">{entry.name}:</span>
              </div>
              <span className="font-semibold text-slate-900">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const SystemDashboardPage: React.FC = () => {
  const [data, setData] = useState<SystemDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardService.getSystemDashboard();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || 'Failed to retrieve dashboard data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading system dashboard metrics..." />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState message={error || 'No data found'} onRetry={fetchDashboard} />;
  }

  const { overview, financials } = data;

  const collectionPercent = Number(financials.collectionPercentage || 0);

  const financialComparisonData = [
    { name: 'Flats', Collected: financials.flatCollectionPaid, Pending: financials.flatCollectionPending },
    { name: 'Bungalows', Collected: financials.bungalowCollectionPaid, Pending: financials.bungalowCollectionPending },
  ];

  const maxCollectionValue = Math.max(
    Number(financials.flatCollectionPaid) || 0,
    Number(financials.flatCollectionPending) || 0,
    Number(financials.bungalowCollectionPaid) || 0,
    Number(financials.bungalowCollectionPending) || 0,
    1000
  );
  // Add a 25% buffer so direct value labels have ample breathing room without clipping
  const xAxisMax = Math.ceil((maxCollectionValue * 1.25) / 10000) * 10000 || 10000;

  const hasCollectionData = (
    (Number(financials.flatCollectionPaid) || 0) > 0 ||
    (Number(financials.flatCollectionPending) || 0) > 0 ||
    (Number(financials.bungalowCollectionPaid) || 0) > 0 ||
    (Number(financials.bungalowCollectionPending) || 0) > 0
  );

  return (
    <div className="space-y-3.5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">System Dashboard</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Global overview of registered societies, property structures, events, and collections.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDashboard}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Metrics
        </Button>
      </div>

      {/* 1. Overview KPIs (8 cards) */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>Operational Overview</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <KPICard
            title="Total Societies"
            value={overview.totalSocieties}
            icon={<Building2 className="w-5 h-5" />}
            variant="indigo"
          />
          <KPICard
            title="Total Blocks"
            value={overview.totalBlocks}
            icon={<Layers className="w-5 h-5" />}
            variant="default"
          />
          <KPICard
            title="Total Flats"
            value={overview.totalFlats}
            icon={<Home className="w-5 h-5" />}
            variant="default"
          />
          <KPICard
            title="Total Bungalows"
            value={overview.totalBungalows}
            icon={<Building2 className="w-5 h-5" />}
            variant="teal"
          />
          <KPICard
            title="Residential Units"
            value={overview.totalResidentialUnits}
            subtitle="Combined flats & bungalows"
            icon={<Home className="w-5 h-5" />}
            variant="teal"
          />
          <KPICard
            title="Total Residents"
            value={overview.totalResidents}
            subtitle="Registered persons"
            icon={<Users className="w-5 h-5" />}
            variant="teal"
          />
          <KPICard
            title="Total Events"
            value={overview.totalEvents}
            icon={<Calendar className="w-5 h-5" />}
            variant="purple"
          />
          <KPICard
            title="Active Events"
            value={overview.activeEvents}
            subtitle="Ongoing / published"
            icon={<Sparkles className="w-5 h-5" />}
            variant="purple"
          />
        </div>
      </div>

      {/* 2. Financial KPIs (6 cards) */}
      <div>
        <h3 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-2 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Financial Collections & Sponsorships</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          <KPICard
            title="Expected Collection"
            value={formatCurrency(financials.totalExpectedCollection)}
            subtitle="Total collection obligations"
            icon={<DollarSign className="w-5 h-5" />}
            variant="indigo"
          />
          <KPICard
            title="Total Collected"
            value={formatCurrency(financials.totalCollectionPaid)}
            subtitle="Recorded & cleared payments"
            icon={<TrendingUp className="w-5 h-5" />}
            variant="emerald"
          />
          <KPICard
            title="Pending Collection"
            value={formatCurrency(financials.totalCollectionPending)}
            subtitle="Unpaid obligations"
            icon={<DollarSign className="w-5 h-5" />}
            variant="rose"
          />
          <KPICard
            title="Flat Collected"
            value={formatCurrency(financials.flatCollectionPaid)}
            subtitle={`Pending: ${formatCurrency(financials.flatCollectionPending)}`}
            variant="indigo"
          />
          <KPICard
            title="Bungalow Collected"
            value={formatCurrency(financials.bungalowCollectionPaid)}
            subtitle={`Pending: ${formatCurrency(financials.bungalowCollectionPending)}`}
            variant="teal"
          />
          <KPICard
            title="Sponsorship Collected"
            value={formatCurrency(financials.totalSponsorshipCollected)}
            subtitle="Corporate & individual sponsors"
            variant="amber"
          />
        </div>
      </div>

      {/* 3. Progress Gauge & Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Collection Efficiency Gauge Card */}
        <Card title="Collection Completion Rate" subtitle="Percentage of total expected revenue realized">
          <div className="flex flex-col items-center justify-center py-3">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600 transition-all duration-1000 ease-out"
                  strokeDasharray={`${collectionPercent}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold text-slate-900">{collectionPercent.toFixed(1)}%</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Collected</span>
              </div>
            </div>

            <div className="w-full mt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Expected:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(financials.totalExpectedCollection)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Received:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(financials.totalCollectionPaid)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Remaining Pending:</span>
                <span className="font-semibold text-rose-600">{formatCurrency(financials.totalCollectionPending)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Breakdown by Property Structure (Horizontal Grouped Bar Chart) */}
        <Card
          title="Collections by Unit Type"
          subtitle="Comparison of collected vs pending revenue"
          headerAction={
            <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4F46E5] shadow-xs" />
                <span>Collected</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-xs" />
                <span>Pending</span>
              </div>
            </div>
          }
          className="lg:col-span-2"
        >
          {hasCollectionData ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={financialComparisonData}
                  margin={{ top: 12, right: 80, left: 10, bottom: 5 }}
                  barCategoryGap="28%"
                  barGap={6}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis
                    type="number"
                    domain={[0, xAxisMax]}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={formatAxisCurrency}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#1E293B', fontSize: 12, fontWeight: 600 }}
                    width={85}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar
                    dataKey="Collected"
                    name="Collected"
                    fill="#4F46E5"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  >
                    <LabelList
                      dataKey="Collected"
                      position="right"
                      formatter={(val: any) => formatCurrency(val)}
                      style={{ fill: '#334155', fontSize: '11px', fontWeight: 600 }}
                      offset={8}
                    />
                  </Bar>
                  <Bar
                    dataKey="Pending"
                    name="Pending"
                    fill="#F59E0B"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  >
                    <LabelList
                      dataKey="Pending"
                      position="right"
                      formatter={(val: any) => formatCurrency(val)}
                      style={{ fill: '#334155', fontSize: '11px', fontWeight: 600 }}
                      offset={8}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Building2 className="w-10 h-10 mb-2 text-slate-300 stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-600">No collection data available</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Collections will appear here once events are published and obligations generated.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SystemDashboardPage;

