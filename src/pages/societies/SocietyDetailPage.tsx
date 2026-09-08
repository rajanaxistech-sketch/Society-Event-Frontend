import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { societiesService, SocietyHierarchyData } from '../../api/societiesService';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import { decodeId, encodeId } from '../../utils/idObfuscator';
import { formatDate } from '../../utils/formatters';
import {
  ArrowLeft,
  Building2,
  Layers,
  Users,
  UserPlus,
  UploadCloud,
  LayoutDashboard,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { SocietyOverviewTab } from './tabs/SocietyOverviewTab';
import { SocietyStructureExplorer } from './tabs/SocietyStructureExplorer';
import { SocietyResidentsTab } from './tabs/SocietyResidentsTab';
import { SocietyUsersTab } from './tabs/SocietyUsersTab';
import { SocietyImportTab } from './tabs/SocietyImportTab';

type TabType = 'overview' | 'structure' | 'residents' | 'users' | 'import';

const TABS: Array<{ id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'structure', label: 'Structure Explorer', icon: Layers },
  { id: 'residents', label: 'Residents & Owners', icon: Users },
  { id: 'users', label: 'Users & Admins', icon: UserPlus },
  { id: 'import', label: 'Owner Excel Import', icon: UploadCloud },
];

export const SocietyDetailPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();
  const { can } = usePermission();

  const tabParam = (searchParams.get('tab') as TabType) || 'overview';
  const [activeTab, setActiveTab] = useState<TabType>(
    ['overview', 'structure', 'residents', 'users', 'import'].includes(tabParam)
      ? tabParam
      : 'overview'
  );

  const [data, setData] = useState<SocietyHierarchyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync tab change with query params
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId }, { replace: true });
  };

  useEffect(() => {
    const currentTabInUrl = searchParams.get('tab') as TabType;
    if (
      currentTabInUrl &&
      ['overview', 'structure', 'residents', 'users', 'import'].includes(currentTabInUrl) &&
      currentTabInUrl !== activeTab
    ) {
      setActiveTab(currentTabInUrl);
    }
  }, [searchParams]);

  const fetchHierarchyData = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const hierarchy = await societiesService.getHierarchy(id);
      setData(hierarchy);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch society profile and structure');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchyData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading society hub & property matrix..." />
      </div>
    );
  }

  if (error || !data || !data.society) {
    return (
      <ErrorState
        message={error || 'Society not found'}
        onRetry={fetchHierarchyData}
      />
    );
  }

  const { society } = data;

  return (
    <div className="space-y-3.5 pb-6">
      {/* Top Banner & Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.SOCIETIES)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Societies
          </Button>

          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
              {society.name?.charAt(0) || 'S'}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                  {society.name}
                </h1>
                <StatusBadge status={society.status} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Code: <strong className="text-slate-700">{society.code || 'N/A'}</strong> &bull; Registered on {formatDate(society.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Links */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/societies/${encodeId(id)}/dashboard`)}
            leftIcon={<LayoutDashboard className="w-3.5 h-3.5" />}
          >
            Dashboard
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/societies/${encodeId(id)}/edit`)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit Society
          </Button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'overview' && (
          <SocietyOverviewTab
            data={data}
            onSwitchTab={(t) => handleTabChange(t as TabType)}
          />
        )}

        {activeTab === 'structure' && (
          <SocietyStructureExplorer
            data={data}
            onRefresh={fetchHierarchyData}
          />
        )}

        {activeTab === 'residents' && (
          <SocietyResidentsTab
            data={data}
            onRefresh={fetchHierarchyData}
          />
        )}

        {activeTab === 'users' && <SocietyUsersTab data={data} />}

        {activeTab === 'import' && (
          <SocietyImportTab
            data={data}
            onRefresh={fetchHierarchyData}
          />
        )}
      </div>
    </div>
  );
};

export default SocietyDetailPage;
