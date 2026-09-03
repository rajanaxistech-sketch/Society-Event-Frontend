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
import { ArrowLeft, Terminal, Shield, Clock, Monitor, User } from 'lucide-react';

export const AuditLogDetailsPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();

  const [log, setLog] = useState<AuditLogItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const oldValues = log.old_values ? (typeof log.old_values === 'string' ? JSON.parse(log.old_values) : log.old_values) : null;
  const newValues = log.new_values ? (typeof log.new_values === 'string' ? JSON.parse(log.new_values) : log.new_values) : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(AppRoutes.AUDIT_LOGS)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to Audit Trail
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Audit Event: <span className="font-mono text-indigo-600">{log.action}</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Target Entity: <span className="font-bold text-slate-700">{log.entity_type}</span> &bull; {formatDate(log.created_at)}
          </p>
        </div>
      </div>

      {/* Metadata Card */}
      <Card title="Event Context & Forensic Metadata">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-1">Actor User</span>
            <span className="font-bold text-slate-900 block">{log.user?.full_name || 'System'}</span>
            <span className="text-slate-500 text-[11px] truncate block">{log.user?.email || 'N/A'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-1">Entity ID</span>
            <span className="font-mono text-slate-900 font-semibold block truncate text-[11px]">{log.entity_id}</span>
            <span className="text-slate-500 text-[11px] block">{log.entity_type}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-1">Client IP</span>
            <span className="font-mono font-bold text-slate-900 block">{log.ip_address || '127.0.0.1'}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 font-semibold block text-[10px] uppercase mb-1">Timestamp</span>
            <span className="font-mono text-slate-900 font-semibold block">{formatDate(log.created_at)}</span>
          </div>
        </div>

        {log.user_agent && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-xs">
            <span className="text-slate-400 block mb-1">User Agent Header:</span>
            <span className="font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded block text-[11px]">
              {log.user_agent}
            </span>
          </div>
        )}
      </Card>

      {/* Payload Inspection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-rose-500" />
              <span>Prior State (Old Values)</span>
            </div>
          }
        >
          {oldValues ? (
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96">
              {JSON.stringify(oldValues, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-slate-400 italic">No previous state recorded (Creation / Insert).</p>
          )}
        </Card>

        <Card
          title={
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <span>Mutated State (New Values)</span>
            </div>
          }
        >
          {newValues ? (
            <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-96">
              {JSON.stringify(newValues, null, 2)}
            </pre>
          ) : (
            <p className="text-xs text-slate-400 italic">No new state payload.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuditLogDetailsPage;
