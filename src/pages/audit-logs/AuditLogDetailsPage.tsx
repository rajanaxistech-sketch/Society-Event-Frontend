import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auditLogsService } from '../../api/auditLogsService';
import { AuditLogItem } from '../../types';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { formatDate } from '../../utils/formatters';
import { decodeId } from '../../utils/idObfuscator';
import {
  ArrowLeft,
  Terminal,
  Clock,
  User,
  Globe,
  Database,
  Tag,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Layers,
} from 'lucide-react';

export const AuditLogDetailsPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();

  const [log, setLog] = useState<AuditLogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedOld, setCopiedOld] = useState(false);
  const [copiedNew, setCopiedNew] = useState(false);

  const fetchLog = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await auditLogsService.getById(id);
      if (res.success && res.data) {
        setLog(res.data);
      } else {
        setError(res.message || 'Audit record not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load audit record');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLog();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Retrieving audit log entry..." />
      </div>
    );
  }

  if (error || !log) {
    return <ErrorState message={error || 'Audit log not found'} onRetry={fetchLog} />;
  }

  const oldValues =
    log.old_values ? (typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values) : null;
  const newValues =
    log.new_values ? (typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values) : null;
  const changedFields =
    log.changed_fields ? (typeof log.changed_fields === 'string' ? JSON.parse(log.changed_fields) : log.changed_fields) : null;

  // Extract changed keys map from either explicit changed_fields or computed from old/new values
  let diffRows: Array<{ field: string; oldVal: any; newVal: any }> = [];

  if (changedFields && typeof changedFields === 'object') {
    diffRows = Object.entries(changedFields).map(([field, diff]: [string, any]) => ({
      field,
      oldVal: diff?.old !== undefined ? diff.old : null,
      newVal: diff?.new !== undefined ? diff.new : null,
    }));
  } else if (oldValues && newValues && typeof oldValues === 'object' && typeof newValues === 'object') {
    const keys = Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)]));
    diffRows = keys
      .filter((k) => k !== 'updated_at' && k !== 'updatedAt')
      .map((k) => ({
        field: k,
        oldVal: oldValues[k] !== undefined ? oldValues[k] : null,
        newVal: newValues[k] !== undefined ? newValues[k] : null,
      }))
      .filter((r) => JSON.stringify(r.oldVal) !== JSON.stringify(r.newVal));
  }

  const handleCopy = (data: any, type: 'old' | 'new') => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    if (type === 'old') {
      setCopiedOld(true);
      setTimeout(() => setCopiedOld(false), 2000);
    } else {
      setCopiedNew(true);
      setTimeout(() => setCopiedNew(false), 2000);
    }
  };

  const getActionColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('CREATE') || act.includes('INSERT')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (act.includes('UPDATE') || act.includes('EDIT')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (act.includes('DELETE') || act.includes('REMOVE')) return 'bg-rose-50 text-rose-700 border-rose-200';
    if (act === 'LOGIN') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (act.includes('FAILED')) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const formatValue = (val: any) => {
    if (val === null || val === undefined) {
      return <span className="text-slate-400 italic font-mono text-[11px]">null / empty</span>;
    }
    if (typeof val === 'boolean') {
      return <span className="font-mono text-indigo-600 font-semibold">{val ? 'true' : 'false'}</span>;
    }
    if (typeof val === 'object') {
      return <pre className="font-mono text-[11px] text-slate-800 bg-slate-100 p-1 rounded max-h-24 overflow-auto">{JSON.stringify(val, null, 2)}</pre>;
    }
    return <span className="font-mono text-slate-800 text-[11px] break-all">{String(val)}</span>;
  };

  const isSuccess = !log.status || log.status.toLowerCase() === 'success';

  return (
    <div className="max-w-5xl mx-auto space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.AUDIT_LOGS)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Audit Event Details</h1>
              <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono border ${getActionColor(log.action)}`}>
                {log.action}
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  isSuccess ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {isSuccess ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-red-600" />}
                {isSuccess ? 'Success' : 'Failure'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Module: <span className="font-semibold text-slate-700 capitalize">{log.entity_type}</span> &bull; Recorded on {formatDate(log.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Forensic Metadata Grid */}
      <Card title="Event Context & Forensic Metadata">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* User / Performed By */}
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 flex items-start gap-2.5">
            <User className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Performed By</span>
              <span className="font-bold text-slate-900 block truncate">{log.user_name || log.user?.full_name || 'System / Guest'}</span>
              <span className="text-slate-500 text-[11px] truncate block">{log.user_email || log.user?.email || 'N/A'}</span>
            </div>
          </div>

          {/* Module & Target Record */}
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 flex items-start gap-2.5">
            <Database className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Target Record</span>
              <span className="font-bold text-slate-900 capitalize block">{log.entity_type}</span>
              <span className="text-slate-500 font-mono text-[11px] truncate block" title={log.entity_id || 'N/A'}>
                ID: {log.entity_id || 'N/A'}
              </span>
            </div>
          </div>

          {/* Client IP & Method */}
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Client Network</span>
              <span className="font-mono font-bold text-slate-900 block">{log.ip_address || '127.0.0.1'}</span>
              <span className="text-slate-500 text-[11px] block">
                {log.request_method || 'HTTP'} {log.request_url ? `(${log.request_url})` : ''}
              </span>
            </div>
          </div>

          {/* Timestamp */}
          <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-100 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase tracking-wider">Timestamp</span>
              <span className="font-mono font-bold text-slate-900 block">{formatDate(log.created_at)}</span>
              <span className="text-slate-500 font-mono text-[11px] block">
                {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {log.user_agent && (
          <div className="mt-3 pt-2.5 border-t border-slate-100 text-xs flex items-center gap-2">
            <span className="text-slate-400 text-[11px] shrink-0 font-medium">User Agent:</span>
            <span className="font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded text-[11px] truncate flex-1" title={log.user_agent}>
              {log.user_agent}
            </span>
          </div>
        )}
      </Card>

      {/* Field Diff Table for UPDATE Actions */}
      {diffRows.length > 0 && (
        <Card
          title={
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Changed Fields Comparison ({diffRows.length} {diffRows.length === 1 ? 'field' : 'fields'} modified)</span>
            </div>
          }
        >
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs divide-y divide-slate-200">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2 w-1/4">Field Name</th>
                  <th className="px-3 py-2 w-3/8 text-rose-700 bg-rose-50/50">Previous Value (Old)</th>
                  <th className="px-3 py-2 w-3/8 text-emerald-700 bg-emerald-50/50">Mutated Value (New)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {diffRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2 font-mono font-semibold text-slate-800 bg-slate-50/30">
                      {row.field}
                    </td>
                    <td className="px-3 py-2 bg-rose-50/20 text-rose-900">
                      {formatValue(row.oldVal)}
                    </td>
                    <td className="px-3 py-2 bg-emerald-50/20 text-emerald-900 font-medium">
                      {formatValue(row.newVal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Payload Inspection Cards (Old & New State) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900">
                <Terminal className="w-3.5 h-3.5 text-rose-500" />
                <span>Prior State (Old Values)</span>
              </div>
              {oldValues && (
                <button
                  type="button"
                  onClick={() => handleCopy(oldValues, 'old')}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                  title="Copy old values JSON"
                >
                  {copiedOld ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedOld ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          }
        >
          {oldValues ? (
            <pre className="bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-72 shadow-2xs">
              {JSON.stringify(oldValues, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-slate-400 italic py-4 text-center">No prior state recorded (Create or session event).</p>
          )}
        </Card>

        <Card
          title={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900">
                <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mutated State (New Values)</span>
              </div>
              {newValues && (
                <button
                  type="button"
                  onClick={() => handleCopy(newValues, 'new')}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors"
                  title="Copy new values JSON"
                >
                  {copiedNew ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedNew ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
          }
        >
          {newValues ? (
            <pre className="bg-slate-50 border border-slate-200 text-slate-800 p-3 rounded-lg text-[11px] font-mono overflow-x-auto max-h-72 shadow-2xs">
              {JSON.stringify(newValues, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-slate-400 italic py-4 text-center">No mutated state payload (Delete operation).</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuditLogDetailsPage;
