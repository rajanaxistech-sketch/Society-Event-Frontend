import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { importsService } from '../../api/importsService';
import { ImportJobItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
} from 'lucide-react';

export const ImportPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [job, setJob] = useState<ImportJobItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitConfirmOpen, setCommitConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJob = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await importsService.getById(id);
      if (res.success && res.data) {
        setJob(res.data);
      } else {
        setError(res.message || 'Import job not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load import job');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleCommit = async () => {
    if (!id) return;
    try {
      setIsCommitting(true);
      const res = await importsService.commit(id);
      if (res.success) {
        toast.success('Import job committed successfully to database.');
        setCommitConfirmOpen(false);
        fetchJob();
      } else {
        toast.error(res.message || 'Failed to commit import job');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to commit import records'));
    } finally {
      setIsCommitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading import preview..." />
      </div>
    );
  }

  if (error || !job) {
    return <ErrorState message={error || 'Import job not found'} onRetry={fetchJob} />;
  }

  const isCompleted = job.status === 'completed';
  const isPending = job.status === 'pending' || job.status === 'validated';
  const rawRows: any[] = Array.isArray(job.raw_data) ? job.raw_data : [];
  const errorsList: any[] = Array.isArray(job.error_details) ? job.error_details : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.IMPORTS)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Imports
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{job.file_name}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Target: <span className="font-semibold uppercase text-slate-700">{job.entity_type}</span> &bull; Uploaded {formatDate(job.created_at)}
            </p>
          </div>
        </div>

        {isPending && (
          <PermissionGuard permission={Permissions.IMPORT_COMMIT}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCommitConfirmOpen(true)}
              leftIcon={<Play className="w-4 h-4" />}
            >
              Commit Data to Database
            </Button>
          </PermissionGuard>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Parsed Rows
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{job.total_rows ?? rawRows.length}</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Valid / Inserted Rows
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{job.success_rows ?? 0}</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Validation Errors / Failed
          </span>
          <span className={`text-2xl font-bold mt-1 block ${(job.failed_rows ?? 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {job.failed_rows ?? errorsList.length}
          </span>
        </div>
      </div>

      {/* Errors Box if any */}
      {errorsList.length > 0 && (
        <Card title="Validation Errors & Warnings">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2 text-xs text-red-800">
            {errorsList.map((errItem: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>
                  Row {errItem.row || idx + 1}: {errItem.message || JSON.stringify(errItem)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Parsed Raw Rows Table */}
      {rawRows.length > 0 && (
        <Card title="Parsed Records Preview">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  {Object.keys(rawRows[0] || {}).map((header) => (
                    <th key={header} className="px-3 py-2.5 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rawRows.slice(0, 25).map((row: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                    {Object.values(row).map((val: any, i: number) => (
                      <td key={i} className="px-3 py-2 text-slate-800 font-medium">
                        {String(val ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Commit Dialog */}
      <ConfirmDialog
        isOpen={commitConfirmOpen}
        onClose={() => setCommitConfirmOpen(false)}
        onConfirm={handleCommit}
        title="Commit Import to Production Database"
        message={
          <span>
            Are you sure you want to commit <strong>{job.total_rows ?? rawRows.length} records</strong> of type <strong>{job.entity_type}</strong> into the database? This will create new records.
          </span>
        }
        confirmLabel="Execute Commit"
        variant="primary"
        isLoading={isCommitting}
      />
    </div>
  );
};

export default ImportPreviewPage;
