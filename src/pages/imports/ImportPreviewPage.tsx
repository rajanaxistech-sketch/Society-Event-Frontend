import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { importsService } from '../../api/importsService';
import { ImportErrorItem, ImportJobItem, ImportRowItem } from '../../types';
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
  AlertCircle,
} from 'lucide-react';

export const ImportPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [job, setJob] = useState<ImportJobItem | null>(null);
  const [rows, setRows] = useState<ImportRowItem[]>([]);
  const [errorsList, setErrorsList] = useState<ImportErrorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false);
  const [commitConfirmOpen, setCommitConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDetails = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);

      const [batchRes, previewRes, errorsRes] = await Promise.allSettled([
        importsService.getById(id),
        importsService.previewRows(id, { limit: 100 }),
        importsService.getErrors(id, { limit: 50 }),
      ]);

      if (batchRes.status === 'fulfilled' && batchRes.value.success && batchRes.value.data) {
        setJob(batchRes.value.data);
      } else {
        throw new Error('Failed to load batch metadata');
      }

      if (previewRes.status === 'fulfilled' && previewRes.value.success && previewRes.value.data) {
        const previewData = previewRes.value.data as any;
        setRows(Array.isArray(previewData.rows) ? previewData.rows : Array.isArray(previewData) ? previewData : []);
      }

      if (errorsRes.status === 'fulfilled' && errorsRes.value.success && errorsRes.value.data) {
        const errData = errorsRes.value.data as any;
        setErrorsList(Array.isArray(errData.items) ? errData.items : Array.isArray(errData) ? errData : []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load import job');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  const handleCommit = async () => {
    if (!id) return;
    try {
      setIsCommitting(true);
      const res = await importsService.commit(id);
      if (res.success) {
        toast.success('Import job committed successfully to database.');
        setCommitConfirmOpen(false);
        fetchJobDetails();
      } else {
        toast.error(res.message || 'Failed to commit import job');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to commit import records'));
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDownloadErrors = async () => {
    if (!id) return;
    try {
      setIsDownloadingErrors(true);
      const blob = await importsService.downloadErrorReport(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Import_Errors_${id}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Downloaded validation error report');
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to download error report'));
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading import preview & records..." />
      </div>
    );
  }

  if (error || !job) {
    return <ErrorState message={error || 'Import job not found'} onRetry={fetchJobDetails} />;
  }

  const canCommit =
    (job.status === 'previewed' || job.status === 'validated' || job.status === 'uploaded') &&
    (job.valid_rows ?? 0) > 0;

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
              <span className="text-xs uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                {job.file_type || 'spreadsheet'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Uploaded on {formatDate(job.uploaded_at || job.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(job.invalid_rows ?? 0) > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadErrors}
              isLoading={isDownloadingErrors}
              leftIcon={<Download className="w-4 h-4 text-rose-600" />}
            >
              Download Error Report
            </Button>
          )}

          {canCommit && (
            <PermissionGuard permission={Permissions.IMPORT_COMMIT}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCommitConfirmOpen(true)}
                leftIcon={<Play className="w-4 h-4" />}
              >
                Commit Valid Records ({job.valid_rows})
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Parsed Rows
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">{job.total_rows ?? rows.length}</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Valid Staged Rows
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">{job.valid_rows ?? 0}</span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Validation Errors
          </span>
          <span className={`text-2xl font-bold mt-1 block ${(job.invalid_rows ?? 0) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
            {job.invalid_rows ?? errorsList.length}
          </span>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Committed to Database
          </span>
          <span className="text-2xl font-bold text-indigo-600 mt-1 block">{job.inserted_rows ?? 0}</span>
        </div>
      </div>

      {/* Errors Box if any */}
      {errorsList.length > 0 && (
        <Card title="Validation Errors & Issues">
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-2 text-xs text-red-800 max-h-48 overflow-y-auto">
            {errorsList.map((errItem: any, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Row {errItem.row_number || idx + 1}:</strong> {errItem.field_name ? `[${errItem.field_name}] ` : ''}
                  {errItem.error_message}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Parsed Staged Records Table */}
      <Card title={`Staged Records Preview (${rows.length} rows loaded)`}>
        {rows.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">No staged rows found in this batch.</div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Row #</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Society</th>
                  <th className="px-3 py-2.5">Unit Details</th>
                  <th className="px-3 py-2.5">Resident / Owner</th>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">Primary Owner</th>
                  <th className="px-3 py-2.5">Errors / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((rowItem) => {
                  const raw = rowItem.raw_data || {};
                  const isBung =
                    (raw.unit_type || '').toLowerCase() === 'bungalow' ||
                    (raw.unit_type || '').toLowerCase() === 'villa' ||
                    Boolean(raw.bungalow_number);

                  return (
                    <tr
                      key={rowItem.id || rowItem.row_number}
                      className={`hover:bg-slate-50 transition-colors ${
                        rowItem.validation_status === 'invalid' ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-3 py-2 text-slate-400 font-mono">{rowItem.row_number}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={rowItem.validation_status} size="sm" />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {raw.society_name || '—'}
                        {raw.society_code ? ` (${raw.society_code})` : ''}
                      </td>
                      <td className="px-3 py-2">
                        {isBung ? (
                          <div>
                            <span className="font-semibold text-indigo-700">
                              {raw.bungalow_number || '—'}
                            </span>
                            {raw.bungalow_type && (
                              <span className="text-slate-500 block text-[11px]">{raw.bungalow_type}</span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-800">
                              {raw.flat_number ? `Flat ${raw.flat_number}` : '—'}
                            </span>
                            <span className="text-slate-500 block text-[11px]">
                              {raw.block_name ? `${raw.block_name}` : ''}
                              {raw.floor_number !== undefined ? ` • Floor ${raw.floor_number}` : ''}
                              {raw.flat_type ? ` • ${raw.flat_type}` : ''}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-medium text-slate-800 block">
                          {raw.resident_name || '—'}
                        </span>
                        {raw.relationship_to_owner && (
                          <span className="text-[11px] text-slate-500">
                            Rel: {raw.relationship_to_owner}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-600">
                        {raw.resident_phone && <div>{raw.resident_phone}</div>}
                        {raw.resident_email && <div>{raw.resident_email}</div>}
                        {!raw.resident_phone && !raw.resident_email && '—'}
                      </td>
                      <td className="px-3 py-2">
                        {raw.is_primary_owner ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            YES
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                            NO
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-rose-600 text-[11px]">
                        {rowItem.error_messages && rowItem.error_messages.length > 0 ? (
                          <div className="space-y-0.5">
                            {rowItem.error_messages.map((m, i) => (
                              <div key={i} className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                                <span>{m}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Commit Dialog */}
      <ConfirmDialog
        isOpen={commitConfirmOpen}
        onClose={() => setCommitConfirmOpen(false)}
        onConfirm={handleCommit}
        title="Commit Import to Production Database"
        message={
          <span>
            Are you sure you want to commit <strong>{job.valid_rows} valid records</strong> into the database? This will create or update societies, residential units (villas/flats), and resident owner records.
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

