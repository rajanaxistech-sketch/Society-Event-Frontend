import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditLogsService } from '../../api/auditLogsService';
import { AuditLogItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { Eye, ShieldAlert, RefreshCw, Activity, Terminal } from 'lucide-react';

export const AuditLogListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await auditLogsService.getAll({
        page: meta.page,
        limit: meta.limit,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
      });

      if (res.success && res.data) {
        setLogs(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch audit log trail'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [meta.page, meta.limit, actionFilter, entityFilter]);

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('create') || act.includes('insert')) return 'bg-emerald-100 text-emerald-800';
    if (act.includes('update') || act.includes('edit') || act.includes('patch')) return 'bg-blue-100 text-blue-800';
    if (act.includes('delete') || act.includes('remove') || act.includes('reverse')) return 'bg-rose-100 text-rose-800';
    return 'bg-slate-100 text-slate-800';
  };

  const columns: Column<AuditLogItem>[] = [
    {
      key: 'action',
      header: 'Event Action',
      render: (row) => (
        <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase font-mono ${getActionColor(row.action)}`}>
          {row.action}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Entity / Target',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs capitalize">{row.entity_type}</span>
          <span className="text-[10px] text-slate-400 font-mono">ID: {row.entity_id?.slice(0, 12)}...</span>
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Actor / User',
      render: (row) => (
        <div className="text-xs">
          <span className="text-slate-900 font-medium block">{row.user?.full_name || 'System Actor'}</span>
          <span className="text-slate-400">{row.user?.email || row.ip_address || ''}</span>
        </div>
      ),
    },
    {
      key: 'ip_address',
      header: 'IP Address',
      render: (row) => <span className="text-xs font-mono text-slate-600">{row.ip_address || '—'}</span>,
    },
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (row) => <span className="text-xs text-slate-500 font-mono">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/audit-logs/${row.id}`)}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="Inspect Payload Diff"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable forensics ledger recording system operations, logins, mutations, and reversals.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Log Trail
        </Button>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Entities</option>
              <option value="Society">Society</option>
              <option value="Event">Event</option>
              <option value="Payment">Payment</option>
              <option value="Collection">Collection</option>
              <option value="Resident">Resident</option>
              <option value="User">User</option>
              <option value="Auth">Auth Session</option>
            </select>

            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="REVERSE">REVERSE</option>
              <option value="LOGIN">LOGIN</option>
            </select>
          </div>
        }
      />

      <Table
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyText="No security audit events recorded matching criteria."
        onRowClick={(row) => navigate(`/audit-logs/${row.id}`)}
      />

      <Pagination
        meta={meta}
        onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
      />
    </div>
  );
};

export default AuditLogListPage;
