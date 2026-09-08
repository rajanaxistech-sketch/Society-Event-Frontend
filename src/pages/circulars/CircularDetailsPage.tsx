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

  const isPdf = circular.file_type === 'pdf';
  const isImage = ['png', 'jpg', 'jpeg'].includes(circular.file_type?.toLowerCase() || '');
  const canManage = !isResident && (can(Permissions.CIRCULAR_UPDATE) || can(Permissions.CIRCULAR_PUBLISH));

  return (
    <div className="max-w-5xl mx-auto space-y-3.5">
      {/* Header & Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.CIRCULARS)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            All Circulars
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              <ScrollText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">{circular.title}</h1>
                <StatusBadge status={circular.status} size="sm" />
              </div>
              <p className="text-[11px] text-slate-500">
                {circular.society?.name} &bull; Published:{' '}
                {circular.published_at ? formatDate(circular.published_at) : 'Draft (Unpublished)'}
              </p>
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <PermissionGuard permission={Permissions.CIRCULAR_PUBLISH}>
              {circular.status === 'published' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStatusToggle}
                  isLoading={isUpdatingStatus}
                  leftIcon={<EyeOff className="w-3.5 h-3.5" />}
                  className="text-amber-600 border-amber-200 hover:bg-amber-50"
                >
                  Unpublish
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStatusToggle}
                  isLoading={isUpdatingStatus}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Publish Now
                </Button>
              )}
            </PermissionGuard>

            <PermissionGuard permission={Permissions.CIRCULAR_UPDATE}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/circulars/${encodeId(id)}/edit`)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit
              </Button>
            </PermissionGuard>

            <PermissionGuard permission={Permissions.CIRCULAR_DELETE}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                Delete
              </Button>
            </PermissionGuard>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Left 2 Cols: Description & Embedded Viewer */}
        <div className="lg:col-span-2 space-y-3.5">
          {/* Main Notice Content Card */}
          <Card title="Official Notice Content">
            <div className="prose prose-slate max-w-none text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {circular.description}
            </div>
          </Card>

          {/* Attachment Card */}
          {circular.file_url ? (
            <Card
              title="Official Document Attachment"
              headerAction={
                <div className="flex items-center gap-1.5">
                  <a
                    href={getFileUrl(circular.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open in New Tab
                  </a>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => downloadFile(circular.file_url!, circular.file_name || 'circular')}
                    leftIcon={<Download className="w-3 h-3" />}
                    className="text-xs font-bold"
                  >
                    Download
                  </Button>
                </div>
              }
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {isPdf ? (
                      <FileText className="w-5 h-5 text-rose-600" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-indigo-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 block truncate text-xs sm:text-sm">
                      {circular.file_name || (isPdf ? 'Circular_Document.pdf' : 'Circular_Attachment')}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {circular.file_type?.toUpperCase()} &bull; {formatFileSize(circular.file_size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={getFileUrl(circular.file_url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View in New Tab
                  </a>
                </div>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-4 text-center text-slate-400 text-xs">
                <ScrollText className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                This circular is a text announcement and does not contain a file attachment.
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Metadata & Context */}
        <div className="space-y-3.5">
          {/* Metadata Card */}
          <Card title="Circular Details">
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[9px] block mb-0.5">
                  Status
                </span>
                <StatusBadge status={circular.status} size="sm" />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-400 font-semibold uppercase text-[9px] block mb-0.5">
                  Target Society
                </span>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span>{circular.society?.name}</span>
                </div>
                {circular.society?.city && (
                  <span className="text-[10px] text-slate-500 block mt-0.5 ml-5">
                    {circular.society.address_line1 ? `${circular.society.address_line1}, ` : ''}
                    {circular.society.city}
                  </span>
                )}
              </div>

              {circular.event && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase text-[9px] block mb-0.5">
                    Associated Event
                  </span>
                  <div
                    onClick={() => navigate(`/events/${encodeId(circular.event?.id || '')}`)}
                    className="p-2 bg-purple-50 rounded-lg border border-purple-100 cursor-pointer hover:border-purple-300 transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="font-bold text-xs text-purple-900 group-hover:text-purple-700">
                        {circular.event.name}
                      </span>
                    </div>
                    <span className="text-[9px] text-purple-600 block mt-0.5">
                      Event Date: {formatDate(circular.event.start_date)}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[9px] block">
                    Published Date
                  </span>
                  <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5 text-xs">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {circular.published_at ? formatDate(circular.published_at) : 'Not published yet'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[9px] block">
                    Created By
                  </span>
                  <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5 text-xs">
                    <User className="w-3 h-3 text-slate-400" />
                    {circular.creator?.full_name || 'Committee Admin'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Official Circular"
        message={`Are you sure you want to permanently delete "${circular.title}"? This cannot be undone.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Circular'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
};

export default CircularDetailsPage;
