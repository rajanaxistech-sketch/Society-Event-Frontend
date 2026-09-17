import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { circularsService } from '../../api/circularsService';
import { CircularItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import { getFileUrl } from '../../utils/fileHelper';
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  Download,
  Send,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Calendar,
  Hash,
} from 'lucide-react';

interface EventCircularsPageProps {
  eventId?: string;
  societyId?: string;
}

export const EventCircularsPage: React.FC<EventCircularsPageProps> = ({
  eventId: propEventId,
  societyId: propSocietyId,
}) => {
  const { id: routeEventId } = useParams<{ id: string }>();
  const eventId = decodeId(propEventId || routeEventId);
  const navigate = useNavigate();
  const toast = useToast();
  const { can, isResident } = usePermission();

  const [circulars, setCirculars] = useState<CircularItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [deleteTarget, setDeleteTarget] = useState<CircularItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ item: CircularItem; action: 'publish' | 'unpublish' } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchCirculars = async () => {
    if (!eventId) return;

    try {
      setIsLoading(true);
      const res = await circularsService.getByEventId(eventId, {
        page: meta.page,
        limit: meta.limit,
      });

      if (res.success && res.data) {
        setCirculars(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch circulars'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculars();
  }, [eventId, meta.page, meta.limit]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await circularsService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Circular "${deleteTarget.title}" deleted.`);
        setDeleteTarget(null);
        fetchCirculars();
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
    if (!statusTarget) return;
    try {
      setIsUpdatingStatus(true);
      const { item, action } = statusTarget;
      const res =
        action === 'publish'
          ? await circularsService.publish(item.id)
          : await circularsService.unpublish(item.id);

      if (res.success) {
        toast.success(
          action === 'publish'
            ? `Circular published successfully.`
            : `Circular unpublished.`
        );
        setStatusTarget(null);
        fetchCirculars();
      } else {
        toast.error(res.message || `Failed to ${action} circular`);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error updating status'));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleOpenPdf = (item: CircularItem) => {
    if (item.file_url) {
      window.open(getFileUrl(item.file_url), '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/circulars/${encodeId(item.id)}`);
    }
  };

  return (
    <div className="space-y-3">
      {/* Sleek Minimalist Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">
            Circulars ({meta.total || circulars.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={fetchCirculars}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {!isResident && (
            <PermissionGuard permission={Permissions.CIRCULAR_CREATE}>
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    `${AppRoutes.CIRCULAR_CREATE}?eventId=${encodeId(eventId)}${
                      propSocietyId ? `&societyId=${encodeId(propSocietyId)}` : ''
                    }`
                  )
                }
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="py-1 px-2.5 text-xs font-bold shadow-2xs"
              >
                Add Circular
              </Button>
            </PermissionGuard>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <Spinner size="md" label="Loading circulars..." />
        </div>
      ) : circulars.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-slate-300" />}
          title="No circulars available"
          description="Official circulars and PDF notices for this event will appear here."
          action={
            !isResident && can(Permissions.CIRCULAR_CREATE) ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  navigate(
                    `${AppRoutes.CIRCULAR_CREATE}?eventId=${encodeId(eventId)}${
                      propSocietyId ? `&societyId=${encodeId(propSocietyId)}` : ''
                    }`
                  )
                }
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Create Circular
              </Button>
            ) : undefined
          }
        />
      ) : (
        /* Minimalist Card Listing */
        <div className="space-y-2.5">
          {circulars.map((item, index) => {
            const serialNo = item.serial_number || `CIRC-${String(index + 1).padStart(2, '0')}`;
            const isPdf = item.file_type === 'pdf' || item.file_url?.toLowerCase().endsWith('.pdf');

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 hover:border-indigo-200 rounded-xl p-3.5 transition-all shadow-2xs hover:shadow-xs group"
              >
                {/* Card Top: Serial Number Badge & Status / Date */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      <Hash className="w-3 h-3 text-indigo-500" />
                      {serialNo}
                    </span>
                    <span className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.published_at || item.created_at)}
                    </span>
                  </div>

                  {!isResident && (
                    <StatusBadge status={item.status} size="sm" />
                  )}
                </div>

                {/* Card Middle: Circular Name */}
                <h3
                  onClick={() => handleOpenPdf(item)}
                  className="font-bold text-[13.5px] sm:text-sm text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer leading-snug mb-3"
                  title={item.file_url ? 'Click to open PDF' : 'Click to view'}
                >
                  {item.title}
                </h3>

                {/* Card Bottom: PDF Action & Admin Controls */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* Circular PDF Action */}
                  {item.file_url ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPdf(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                        title="Open PDF"
                      >
                        <FileText className="w-3.5 h-3.5 text-rose-500" />
                        <span>View PDF</span>
                        <ExternalLink className="w-3 h-3 text-indigo-400" />
                      </button>

                      {item.file_size && (
                        <span className="text-[10px] text-slate-400 font-medium">
                          {formatFileSize(item.file_size)}
                        </span>
                      )}

                      <a
                        href={getFileUrl(item.file_url)}
                        download={item.file_name || `Circular_${serialNo}.pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium">No PDF Attached</span>
                  )}

                  {/* Admin Action Buttons */}
                  {!isResident && (
                    <div className="flex items-center gap-1">
                      <PermissionGuard permission={Permissions.CIRCULAR_PUBLISH}>
                        {item.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() => setStatusTarget({ item, action: 'unpublish' })}
                            title="Unpublish"
                            className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setStatusTarget({ item, action: 'publish' })}
                            title="Publish"
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </PermissionGuard>

                      <PermissionGuard permission={Permissions.CIRCULAR_UPDATE}>
                        <button
                          type="button"
                          onClick={() => navigate(`/circulars/${encodeId(item.id)}/edit`)}
                          title="Edit"
                          className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </PermissionGuard>

                      <PermissionGuard permission={Permissions.CIRCULAR_DELETE}>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          title="Delete"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </PermissionGuard>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {meta.totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                meta={meta}
                onPageChange={(p) => setMeta((m) => ({ ...m, page: p }))}
              />
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Circular"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Publish Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        title={statusTarget?.action === 'publish' ? 'Publish Circular' : 'Unpublish Circular'}
        message={
          statusTarget?.action === 'publish'
            ? `Publishing "${statusTarget?.item.title}" will make it immediately visible to all eligible society residents.`
            : `Unpublishing will hide this circular from residents.`
        }
        confirmLabel={isUpdatingStatus ? 'Updating...' : 'Confirm'}
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={handleStatusToggle}
        onClose={() => setStatusTarget(null)}
      />
    </div>
  );
};

export default EventCircularsPage;

