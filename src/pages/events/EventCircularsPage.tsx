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
  Image as ImageIcon,
  Download,
  Send,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Calendar,
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
        await fetchCirculars();
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
        await fetchCirculars();
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

  const handleOpenCircular = (item: CircularItem) => {
    if (item.file_url) {
      window.open(getFileUrl(item.file_url), '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/circulars/${encodeId(item.id)}`);
    }
  };

  const isPdfFile = (item: CircularItem) =>
    item.file_type === 'pdf' || item.file_url?.toLowerCase().endsWith('.pdf');

  return (
    <div className="space-y-3">
      {/* Sleek Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">
            Event Circulars & Notices ({meta.total || circulars.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={fetchCirculars}
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
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
          description="Official circulars, schedules, and document notices for this event will appear here."
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
        /* Clean, Minimalist, Mobile-First Admin Data Table with Darker Grid Lines (Zero Horizontal Scroll) */
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-2xs">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 text-[9.5px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider divide-x divide-slate-300">
                <th className="py-2 px-1.5 sm:px-2 w-[28%] sm:w-[32%]">Notice / Details</th>
                <th className="py-2 px-1 w-[19%] sm:w-[17%] text-center">Status</th>
                <th className="py-2 px-1 w-[18%] sm:w-[17%] text-center">Date</th>
                <th className="py-2 px-1 w-[13%] sm:w-[14%] text-center">File</th>
                <th className="py-2 px-1 w-[22%] sm:w-[20%] text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {circulars.map((item) => {
                const isPdf = isPdfFile(item);

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-indigo-50/20 transition-colors divide-x divide-slate-300 group"
                  >
                    {/* 1. Notice / Details Column */}
                    <td className="py-2 px-1.5 sm:px-2 align-middle min-w-0">
                      <div className="min-w-0">
                        <h4
                          onClick={() => handleOpenCircular(item)}
                          className="font-bold text-[10.5px] sm:text-[12px] text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer break-words leading-tight"
                          title={item.title}
                        >
                          {item.title}
                        </h4>
                        {item.description && (
                          <p className="text-[9px] sm:text-[10px] text-slate-500 line-clamp-1 mt-0.5 leading-snug break-words">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* 2. Status Column */}
                    <td className="py-2 px-1 align-middle text-center overflow-hidden">
                      {item.status === 'published' ? (
                        <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded text-[7.5px] sm:text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-tight max-w-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">Published</span>
                        </span>
                      ) : item.status === 'draft' ? (
                        <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded text-[7.5px] sm:text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-tight max-w-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="truncate">Draft</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center gap-1 px-1.5 py-0.5 rounded text-[7.5px] sm:text-[8px] font-bold bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-tight max-w-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                          <span className="truncate">{item.status || 'Draft'}</span>
                        </span>
                      )}
                    </td>

                    {/* 3. Date Column */}
                    <td className="py-2 px-1 align-middle text-center">
                      <span className="text-[9px] sm:text-[10px] text-slate-600 font-medium block leading-tight whitespace-nowrap">
                        {formatDate(item.published_at || item.created_at)}
                      </span>
                    </td>

                    {/* 4. File Column */}
                    <td className="py-2 px-1 align-middle text-center">
                      {item.file_url ? (
                        <div className="inline-flex flex-col items-center justify-center">
                          <a
                            href={getFileUrl(item.file_url)}
                            download={item.file_name || `Circular_${item.title}.${isPdf ? 'pdf' : 'png'}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1 rounded-md transition-colors inline-flex items-center justify-center cursor-pointer ${
                              isPdf
                                ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
                                : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'
                            }`}
                            title={`Download ${isPdf ? 'PDF' : 'Attachment'}${item.file_size ? ` (${formatFileSize(item.file_size)})` : ''}`}
                          >
                            {isPdf ? (
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            )}
                          </a>
                          {item.file_size && (
                            <span className="text-[7.5px] sm:text-[8px] font-semibold text-slate-400 block truncate max-w-[45px] leading-none">
                              {formatFileSize(item.file_size)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-normal">—</span>
                      )}
                    </td>

                    {/* 5. Actions Column */}
                    <td className="py-2 px-1 align-middle text-center">
                      <div className="inline-flex items-center justify-center gap-1">
                        {!isResident ? (
                          <>
                            <PermissionGuard permission={Permissions.CIRCULAR_PUBLISH}>
                              {item.status === 'published' ? (
                                <button
                                  type="button"
                                  onClick={() => setStatusTarget({ item, action: 'unpublish' })}
                                  title="Unpublish Circular"
                                  className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setStatusTarget({ item, action: 'publish' })}
                                  title="Publish Circular"
                                  className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </PermissionGuard>

                            <PermissionGuard permission={Permissions.CIRCULAR_UPDATE}>
                              <button
                                type="button"
                                onClick={() => navigate(`/circulars/${encodeId(item.id)}/edit`)}
                                title="Edit Circular"
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </PermissionGuard>

                            <PermissionGuard permission={Permissions.CIRCULAR_DELETE}>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(item)}
                                title="Delete Circular"
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </PermissionGuard>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenCircular(item)}
                            title="Open Circular"
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {meta.totalPages > 1 && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/50">
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
