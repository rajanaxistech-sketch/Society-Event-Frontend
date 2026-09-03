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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import Button from '../../components/ui/Button';

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

  const pieData = [
    { name: 'Collected', value: financials.totalCollectionPaid, color: '#10B981' },
    { name: 'Pending', value: financials.totalCollectionPending, color: '#F59E0B' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
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
        <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3 flex items-center gap-1.5">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <span>Operational Overview</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            variant="default"
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
            variant="emerald"
          />
          <KPICard
            title="Total Events"
            value={overview.totalEvents}
            icon={<Calendar className="w-5 h-5" />}
            variant="default"
          />
          <KPICard
            title="Active Events"
            value={overview.activeEvents}
            subtitle="Ongoing / published"
            icon={<Sparkles className="w-5 h-5" />}
            variant="amber"
          />
        </div>
      </div>

      {/* 2. Financial KPIs (9 cards) */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Financial Collections & Sponsorships</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            variant="default"
          />
          <KPICard
            title="Bungalow Collected"
            value={formatCurrency(financials.bungalowCollectionPaid)}
            subtitle={`Pending: ${formatCurrency(financials.bungalowCollectionPending)}`}
            variant="default"
          />
          <KPICard
            title="Sponsorship Collected"
            value={formatCurrency(financials.totalSponsorshipCollected)}
            subtitle="Corporate & individual sponsors"
            variant="teal"
          />
        </div>
      </div>

      {/* 3. Progress Gauge & Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collection Efficiency Gauge Card */}
        <Card title="Collection Completion Rate" subtitle="Percentage of total expected revenue realized">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
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
                <span className="text-3xl font-extrabold text-slate-900">{collectionPercent.toFixed(1)}%</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Collected</span>
              </div>
            </div>

            <div className="w-full mt-6 space-y-2 text-xs">
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

        {/* Breakdown by Property Structure (Bar Chart) */}
        <Card title="Collections by Unit Type" subtitle="Comparison of Flat vs Bungalow revenue" className="lg:col-span-2">
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={financialComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), '']}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                />
                <Legend />
                <Bar dataKey="Collected" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SystemDashboardPage;
