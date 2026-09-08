import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardService } from '../../api/dashboardService';
import { societiesService } from '../../api/societiesService';
import { SocietyItem } from '../../types';
import KPICard from '../../components/common/KPICard';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/ui/Button';
import { Building2, Layers, Home, Users, Calendar, ArrowLeft, RefreshCw } from 'lucide-react';
import { AppRoutes } from '../../constants/routes';
import { encodeId, decodeId } from '../../utils/idObfuscator';

export const SocietyDashboardPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const [society, setSociety] = useState<SocietyItem | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [societyRes, dashRes] = await Promise.all([
        societiesService.getById(id),
        dashboardService.getSocietyDashboard(id).catch(() => dashboardService.getSocietyDashboardAlt(id)),
      ]);

      if (societyRes.success && societyRes.data) {
        setSociety(societyRes.data);
      }
      if (dashRes.success && dashRes.data) {
        setDashboardData(dashRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load society dashboard');
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
        <Spinner size="lg" label="Loading society metrics..." />
      </div>
    );
  }

  if (error || !society) {
    return <ErrorState message={error || 'Society not found'} onRetry={fetchData} />;
  }

  const counts = society._count || dashboardData?.counts || {};

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.SOCIETIES)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {society.name} — Dashboard
            </h1>
            <p className="text-[11px] text-slate-500">
              Society Code: <span className="font-semibold">{society.code || 'N/A'}</span> &bull; {society.city || 'Location N/A'}, {society.state || ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            leftIcon={<RefreshCw className="w-3 h-3" />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/societies/${encodeId(id)}`)}
          >
            Manage Society
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        <KPICard
          title="Total Blocks"
          value={counts.blocks ?? dashboardData?.blocksCount ?? 0}
          icon={<Layers className="w-4 h-4" />}
          variant="indigo"
        />
        <KPICard
          title="Total Flats"
          value={counts.flats ?? dashboardData?.flatsCount ?? 0}
          icon={<Home className="w-4 h-4" />}
          variant="indigo"
        />
        <KPICard
          title="Total Bungalows"
          value={counts.bungalows ?? dashboardData?.bungalowsCount ?? 0}
          icon={<Building2 className="w-4 h-4" />}
          variant="teal"
        />
        <KPICard
          title="Events Held"
          value={counts.events ?? dashboardData?.eventsCount ?? 0}
          icon={<Calendar className="w-4 h-4" />}
          variant="purple"
        />
      </div>

      {/* Society Details Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
        <Card title="Society Contact & Structure Details">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Contact Person:</span>
              <span className="font-semibold text-slate-900">{society.contact_name || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Phone:</span>
              <span className="font-semibold text-slate-900">{society.contact_phone || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Email:</span>
              <span className="font-semibold text-slate-900">{society.contact_email || '—'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Address:</span>
              <span className="font-semibold text-slate-900 text-right">
                {[society.address_line1, society.address_line2, society.city, society.state, society.postal_code].filter(Boolean).join(', ') || '—'}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Quick Property Actions">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => navigate(AppRoutes.BLOCKS)}
              className="p-2.5 border border-[#E2E8F0] rounded-xl hover:bg-[#EEF2FF] hover:border-indigo-200 text-left transition-all duration-200 flex flex-col justify-between shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#6366F1] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-[#1E293B]">View Blocks</p>
                <p className="text-[10px] text-slate-500">Manage towers & wings</p>
              </div>
            </button>
            <button
              onClick={() => navigate(AppRoutes.FLATS)}
              className="p-2.5 border border-[#E2E8F0] rounded-xl hover:bg-[#EEF2FF] hover:border-indigo-200 text-left transition-all duration-200 flex flex-col justify-between shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-[#6366F1] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Home className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-[#1E293B]">View Flats</p>
                <p className="text-[10px] text-slate-500">Unit resident mappings</p>
              </div>
            </button>
            <button
              onClick={() => navigate(AppRoutes.BUNGALOWS)}
              className="p-2.5 border border-[#E2E8F0] rounded-xl hover:bg-teal-50 hover:border-teal-200 text-left transition-all duration-200 flex flex-col justify-between shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#14B8A6] flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Building2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-[#1E293B]">View Bungalows</p>
                <p className="text-[10px] text-slate-500">Independent villa units</p>
              </div>
            </button>
            <button
              onClick={() => navigate(AppRoutes.RESIDENTS)}
              className="p-2.5 border border-[#E2E8F0] rounded-xl hover:bg-emerald-50 hover:border-emerald-200 text-left transition-all duration-200 flex flex-col justify-between shadow-2xs group"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                <Users className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-semibold text-[#1E293B]">View Residents</p>
                <p className="text-[10px] text-slate-500">Directory & primary owners</p>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SocietyDashboardPage;
