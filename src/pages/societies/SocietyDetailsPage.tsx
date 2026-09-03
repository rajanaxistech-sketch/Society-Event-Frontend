import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { societiesService } from '../../api/societiesService';
import { SocietyItem, SocietyStructureConfig } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import {
  ArrowLeft,
  Building2,
  Edit2,
  Sliders,
  Layers,
  Home,
  Users,
  Calendar,
  LayoutDashboard,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const SocietyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [society, setSociety] = useState<SocietyItem | null>(null);
  const [structure, setStructure] = useState<SocietyStructureConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [socRes, structRes] = await Promise.all([
        societiesService.getById(id),
        societiesService.getStructure(id).catch(() => null),
      ]);

      if (socRes.success && socRes.data) {
        setSociety(socRes.data);
      } else {
        setError(socRes.message || 'Society not found');
      }

      if (structRes && structRes.success && structRes.data) {
        setStructure(structRes.data);
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching society details');
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
        <Spinner size="lg" label="Loading society profile..." />
      </div>
    );
  }

  if (error || !society) {
    return <ErrorState message={error || 'Society not found'} onRetry={fetchData} />;
  }

  const counts = society._count || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.SOCIETIES)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Societies
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{society.name}</h1>
              <StatusBadge status={society.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Code: <span className="font-semibold text-slate-700">{society.code || 'N/A'}</span> &bull; Registered on {formatDate(society.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/societies/${id}/dashboard`)}
            leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
          >
            Dashboard
          </Button>
          <PermissionGuard permission={Permissions.SOCIETY_STRUCTURE_CONFIG}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/societies/${id}/structure`)}
              leftIcon={<Sliders className="w-3.5 h-3.5" />}
            >
              Structure Config
            </Button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.SOCIETY_UPDATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/societies/${id}/edit`)}
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            >
              Edit Society
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Structure Status Alert */}
      {structure && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Property Hierarchy Configuration</h4>
              <p className="text-xs text-slate-500">
                Flats Hierarchy: {structure.flat_enabled ? 'Enabled (Block → Floor → Flat)' : 'Disabled'} &bull; Bungalows: {structure.bungalow_enabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {structure.setup_completed ? 'Setup Completed' : 'Setup In Progress'}
            </span>
          </div>
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Society Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Society Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Society Name</span>
                <span className="font-semibold text-slate-900 text-sm">{society.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Society Code</span>
                <span className="font-semibold text-slate-900 text-sm">{society.code || '—'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block mb-0.5">Full Address</span>
                <span className="text-slate-800">
                  {[society.address_line1, society.address_line2, society.city, society.state, society.postal_code]
                    .filter(Boolean)
                    .join(', ') || 'No address specified.'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">City</span>
                <span className="text-slate-800">{society.city || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">State</span>
                <span className="text-slate-800">{society.state || '—'}</span>
              </div>
            </div>
          </Card>

          <Card title="Primary Contact Details">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Contact Name</span>
                <span className="font-semibold text-slate-900">{society.contact_name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Phone Number</span>
                <span className="font-semibold text-slate-900">{society.contact_phone || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Email Address</span>
                <span className="font-semibold text-slate-900">{society.contact_email || '—'}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Quick Links to Units */}
        <div className="space-y-6">
          <Card title="Property Units">
            <div className="space-y-3">
              <button
                onClick={() => navigate(AppRoutes.BLOCKS)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span className="font-medium text-slate-800">Blocks</span>
                </div>
                <span className="font-bold text-slate-900">{counts.blocks ?? 0}</span>
              </button>

              <button
                onClick={() => navigate(AppRoutes.BUNGALOWS)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span className="font-medium text-slate-800">Bungalows</span>
                </div>
                <span className="font-bold text-slate-900">{counts.bungalows ?? 0}</span>
              </button>

              <button
                onClick={() => navigate(AppRoutes.EVENTS)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-xs text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-slate-800">Events</span>
                </div>
                <span className="font-bold text-slate-900">{counts.events ?? 0}</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SocietyDetailsPage;
