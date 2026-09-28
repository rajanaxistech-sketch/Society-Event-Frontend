import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditLogsService } from '../../api/auditLogsService';
import { AuditLogItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import Button from '../../components/ui/Button';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId } from '../../utils/idObfuscator';
import {
  Eye,
  RefreshCw,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Calendar,
  Filter,
} from 'lucide-react';

export const AuditLogListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 15, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setMeta((prev) => ({ ...prev, page: 1 }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const res = await auditLogsService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: debouncedSearch || undefined,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
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
  }, [meta.page, meta.limit, debouncedSearch, actionFilter, entityFilter, statusFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setActionFilter('');
    setEntityFilter('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setMeta((prev) => ({ ...prev, page: 1 }));
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    let bg = 'bg-slate-100 text-slate-800 border-slate-200';
    if (act.includes('CREATE') || act.includes('INSERT')) {
      bg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else if (act.includes('UPDATE') || act.includes('EDIT') || act.includes('PATCH')) {
      bg = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (act.includes('DELETE') || act.includes('REMOVE')) {
      bg = 'bg-rose-50 text-rose-700 border-rose-200';
    } else if (act === 'LOGIN') {
      bg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    } else if (act === 'LOGOUT') {
      bg = 'bg-slate-100 text-slate-700 border-slate-200';
    } else if (act.includes('FAILED') || act.includes('ERROR')) {
      bg = 'bg-red-50 text-red-700 border-red-200';
    } else if (act.includes('REVERSE')) {
      bg = 'bg-amber-50 text-amber-700 border-amber-200';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-wider border ${bg}`}>
        {act}
      </span>
    );
  };

  const columns: Column<AuditLogItem>[] = [
    {
      key: 'created_at',
      header: 'Timestamp',
      render: (row) => (
        <div className="flex flex-col text-xs font-mono">
          <span className="text-slate-900 font-medium">{formatDate(row.created_at)}</span>
          <span className="text-[10px] text-slate-400">
            {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => getActionBadge(row.action),
    },
    {
      key: 'entity',
      header: 'Module / Entity',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-900 capitalize block">{row.entity_type}</span>
          {row.entity_id && (
            <span className="text-[10px] text-slate-500 font-mono block truncate max-w-[140px]" title={row.entity_id}>
              ID: {row.entity_id}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'user',
      header: 'Performed By',
      render: (row) => {
        const name = row.user_name || row.user?.full_name || 'System / Guest';
        const email = row.user_email || row.user?.email || '';
        return (
          <div className="text-xs">
            <span className="text-slate-900 font-medium block">{name}</span>
            {email && <span className="text-slate-400 text-[11px] block truncate max-w-[180px]">{email}</span>}
          </div>
        );
      },
    },
    {
      key: 'ip_address',
      header: 'Client IP',
      render: (row) => (
        <span className="text-xs font-mono text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
          {row.ip_address || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => {
        const isSuccess = !row.status || row.status.toLowerCase() === 'success';
        return (
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}
          >
            {isSuccess ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
            {isSuccess ? 'Success' : 'Failure'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'View',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/audit-logs/${encodeId(row.id)}`)}
          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          title="Inspect Audit Record & Diffs"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Audit & Access Logs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized, immutable audit trail tracking all record creations, mutations, deletions, and access events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={
          <div className="flex flex-wrap items-center gap-2 w-full">
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user, entity, action, IP, ID..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-slate-400"
              />
            </div>

            {/* Entity Filter */}
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Entities</option>
              <option value="Society">Society</option>
              <option value="Event">Event</option>
              <option value="EventCollection">Collection</option>
              <option value="Payment">Payment</option>
              <option value="Contract">Contract</option>
              <option value="Vendor">Vendor</option>
              <option value="Person">Person / Resident</option>
              <option value="User">User</option>
              <option value="Role">Role</option>
              <option value="Advertisement">Advertisement</option>
              <option value="Circular">Circular</option>
              <option value="Auth">Auth Session</option>
            </select>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="REVERSE">REVERSE</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>

            {/* Date Range Filters */}
            <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-0.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setMeta((prev) => ({ ...prev, page: 1 }));
                }}
                className="text-xs border-0 bg-transparent focus:outline-none text-slate-700 py-1"
                title="From Date"
              />
              <span className="text-slate-300 text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setMeta((prev) => ({ ...prev, page: 1 }));
                }}
                className="text-xs border-0 bg-transparent focus:outline-none text-slate-700 py-1"
                title="To Date"
              />
            </div>

            {/* Reset Button */}
            {(searchTerm || actionFilter || entityFilter || statusFilter || startDate || endDate) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        }
      />

      {/* Main Table */}
      <Table
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyText="No audit records found matching the specified criteria."
        onRowClick={(row) => navigate(`/audit-logs/${encodeId(row.id)}`)}
      />

      {/* Pagination */}
      <Pagination
        meta={meta}
        onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
      />
    </div>
  );
};

export default AuditLogListPage;
