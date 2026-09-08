import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { circularsService } from '../../api/circularsService';
import { CircularItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
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
  Eye,
  Edit2,
  Trash2,
  ScrollText,
  FileText,
  Image as ImageIcon,
  Download,
  Send,
  EyeOff,
  RefreshCw,
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
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
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
      toast.error(extractErrorMessage(err, 'Failed to load event circulars'));
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

  const handleOpenCircular = (item: CircularItem) => {
    if (item.file_url) {
      window.open(getFileUrl(item.file_url), '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/circulars/${encodeId(item.id)}`);
    }
  };

  const columns: Column<CircularItem>[] = [
    {
      key: 'title',
      header: 'Title & Notice Details',
      render: (item) => (
        <div className="flex items-start gap-3 py-1">
          <div className="p-2 rounded-xl bg-purple-50 text-purple-600 shrink-0 mt-0.5 border border-purple-100">
            {item.file_type === 'pdf' ? (
              <FileText className="w-4 h-4 text-rose-500" />
            ) : item.file_url ? (
              <ImageIcon className="w-4 h-4 text-purple-600" />
            ) : (
              <ScrollText className="w-4 h-4 text-slate-500" />
            )}
          </div>
          <div>
            <span
              onClick={() => handleOpenCircular(item)}
              className="font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer text-xs line-clamp-1"
              title={item.file_url ? 'Click to open document in new tab' : 'Click to view'}
            >
              {item.title}
            </span>
            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'attachment',
      header: 'Attachment',
      render: (item) =>
        item.file_url ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <a
              href={getFileUrl(item.file_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 transition-colors"
              title="Open document in new tab"
            >
              {item.file_type || 'FILE'}
            </a>
            {item.file_size && (
              <span className="text-[10px] text-slate-400">({formatFileSize(item.file_size)})</span>
            )}
            <a
              href={getFileUrl(item.file_url)}
              download={item.file_name || 'circular'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-indigo-600 p-1"
              title="Download"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'published_at',
      header: 'Published / Date',
      render: (item) => (
        <span className="text-xs text-slate-700 font-medium">
          {item.published_at ? formatDate(item.published_at) : formatDate(item.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenCircular(item)}
            title={item.file_url ? 'Open in New Tab' : 'View Details'}
            className="p-1 text-slate-500 hover:text-indigo-600"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>

          {!isResident && (
            <>
              <PermissionGuard permission={Permissions.CIRCULAR_PUBLISH}>
                {item.status === 'published' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusTarget({ item, action: 'unpublish' })}
                    title="Unpublish"
                    className="p-1 text-amber-500 hover:text-amber-700"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatusTarget({ item, action: 'publish' })}
                    title="Publish"
                    className="p-1 text-emerald-600 hover:text-emerald-700"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                )}
              </PermissionGuard>

              <PermissionGuard permission={Permissions.CIRCULAR_UPDATE}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/circulars/${encodeId(item.id)}/edit`)}
                  title="Edit"
                  className="p-1 text-slate-500 hover:text-indigo-600"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </PermissionGuard>

              <PermissionGuard permission={Permissions.CIRCULAR_DELETE}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(item)}
                  title="Delete"
                  className="p-1 text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </PermissionGuard>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      <Card
        title="Event Circulars & Announcements"
        subtitle="Notices, schedule changes, dress code reminders, and official announcements."
        headerAction={
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCirculars}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
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
                >
                  Add Event Circular
                </Button>
              </PermissionGuard>
            )}
          </div>
        }
      >
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Spinner size="md" label="Loading event circulars..." />
          </div>
        ) : circulars.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="w-8 h-8 text-slate-300" />}
            title="No event circulars published"
            description="Official event guidelines, collection notices, and schedule announcements for this event will appear here."
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
                  Create Circular for this Event
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="overflow-hidden">
            <Table columns={columns} data={circulars} />
            {meta.totalPages > 1 && (
              <div className="pt-4 border-t border-slate-100">
                <Pagination
                  meta={meta}
                  onPageChange={(p) => setMeta((m) => ({ ...m, page: p }))}
                />
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Event Circular"
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
        title={statusTarget?.action === 'publish' ? 'Publish Event Circular' : 'Unpublish Circular'}
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
