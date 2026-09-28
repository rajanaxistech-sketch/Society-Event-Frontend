import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { circularsService } from '../../api/circularsService';
import { CircularItem } from '../../types';
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
import { encodeId, decodeId } from '../../utils/idObfuscator';
import { getFileUrl, formatFileSize, downloadFile } from '../../utils/fileHelper';
import {
  ArrowLeft,
  ScrollText,
  Building2,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  Send,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Clock,
  User,
  Sparkles,
} from 'lucide-react';

export const CircularDetailsPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();
  const { can, isResident } = usePermission();

  const [circular, setCircular] = useState<CircularItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status and Delete Modals
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchCircular = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await circularsService.getById(id);
      if (res.success && res.data) {
        setCircular(res.data);
      } else {
        setError(res.message || 'Circular not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load circular details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCircular();
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    try {
      setIsDeleting(true);
      const res = await circularsService.delete(id);
      if (res.success) {
        toast.success('Circular deleted successfully.');
        navigate(AppRoutes.CIRCULARS);
      } else {
        toast.error(res.message || 'Failed to delete circular');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to delete circular'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!circular || !id) return;
    try {
      setIsUpdatingStatus(true);
      const isPublished = circular.status === 'published';
      const res = isPublished
        ? await circularsService.unpublish(id)
        : await circularsService.publish(id);

      if (res.success && res.data) {
        toast.success(
          isPublished
            ? `Circular "${res.data.title}" unpublished.`
            : `Circular "${res.data.title}" published successfully.`
        );
        setCircular(res.data);
      } else {
        toast.error(res.message || 'Failed to update circular status');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update status'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading circular..." />
      </div>
    );
  }

  if (error || !circular) {
    return <ErrorState message={error || 'Circular not found'} onRetry={fetchCircular} />;
  }

  const isPdf = circular.file_type === 'pdf' || circular.file_url?.toLowerCase().endsWith('.pdf');
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(circular.file_type?.toLowerCase() || '') ||
    /\.(jpg|jpeg|png|webp)$/i.test(circular.file_url || '');
  const canManage = !isResident && (can(Permissions.CIRCULAR_UPDATE) || can(Permissions.CIRCULAR_PUBLISH));

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (circular?.event_id) {
      navigate(`/events/${encodeId(circular.event_id)}`);
    } else {
      navigate(AppRoutes.CIRCULARS);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-3 px-1">
      {/* Top Navigation & Action Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBack}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
            title="Go back to circulars"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Admin Action Buttons */}
          {canManage && (
            <div className="flex items-center gap-1">
              <PermissionGuard permission={Permissions.CIRCULAR_PUBLISH}>
                {circular.status === 'published' ? (
                  <button
                    type="button"
                    onClick={handleStatusToggle}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Unpublish</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStatusToggle}
                    disabled={isUpdatingStatus}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish</span>
                  </button>
                )}
              </PermissionGuard>

              <PermissionGuard permission={Permissions.CIRCULAR_UPDATE}>
                <button
                  type="button"
                  onClick={() => navigate(`/circulars/${encodeId(id)}/edit`)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
              </PermissionGuard>

              <PermissionGuard permission={Permissions.CIRCULAR_DELETE}>
                <button
                  type="button"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </PermissionGuard>
            </div>
          )}
        </div>

        {/* Title & Concise Status Subheading */}
        <div className="pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {circular.title}
            </h1>
            <StatusBadge status={circular.status} size="sm" />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <Clock className="w-3 h-3 text-slate-400" />
              {formatDate(circular.published_at || circular.created_at)}
            </span>
            {circular.society?.name && (
              <>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  {circular.society.name}
                </span>
              </>
            )}
            {circular.event && (
              <>
                <span>&bull;</span>
                <span className="flex items-center gap-1 text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                  <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                  {circular.event.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Notice & Attachment Clean Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-2xs space-y-3.5">
        {/* Notice Description */}
        {circular.description ? (
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Notice
            </span>
            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line break-words">
              {circular.description}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">No description provided for this circular.</p>
        )}

        {/* Document Attachment Strip */}
        {circular.file_url && (
          <div className="pt-3 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Attachment
            </span>
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  {isPdf ? (
                    <FileText className="w-4 h-4 text-rose-600" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-900 block truncate text-xs">
                    {circular.file_name || (isPdf ? 'Circular_Document.pdf' : 'Circular_Attachment')}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {circular.file_type?.toUpperCase()} {circular.file_size ? `• ${formatFileSize(circular.file_size)}` : ''}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={getFileUrl(circular.file_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open</span>
                </a>
              </div>
            </div>

            {/* Live Embedded Image Preview if image */}
            {isImage && (
              <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-2">
                <img
                  src={getFileUrl(circular.file_url)}
                  alt={circular.title}
                  className="max-h-[350px] w-auto max-w-full rounded object-contain"
                />
              </div>
            )}
          </div>
        )}

        {/* Minimal Footer Metadata */}
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
          <span>Created by {circular.creator?.full_name || 'Admin'}</span>
          <span>ID: #{circular.id.slice(0, 8)}</span>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Circular"
        message={`Are you sure you want to delete "${circular.title}"?`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default CircularDetailsPage;
