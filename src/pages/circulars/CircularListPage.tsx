import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { circularsService } from '../../api/circularsService';
import { societiesService } from '../../api/societiesService';
import { eventsService } from '../../api/eventsService';
import { CircularItem, PaginationMeta, SocietyItem, EventItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { useAuth } from '../../hooks/useAuth';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Select from '../../components/ui/Select';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
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
  FileText,
  Image as ImageIcon,
  Download,
  Send,
  EyeOff,
  ScrollText,
  Calendar,
  Building2,
  Sparkles,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

export const CircularListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { can, isSuperAdmin, isResident } = usePermission();
  const { selectedSocietyId } = useAuth();

  const urlParams = new URLSearchParams(location.search);
  const initialSocietyId = decodeId(urlParams.get('societyId') || '') || selectedSocietyId || '';
  const initialEventId = decodeId(urlParams.get('eventId') || '');

  const [circulars, setCirculars] = useState<CircularItem[]>([]);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [societyFilter, setSocietyFilter] = useState(initialSocietyId);
  const [eventFilter, setEventFilter] = useState(initialEventId);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState(isResident ? 'published_at' : 'created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Action States
  const [deleteTarget, setDeleteTarget] = useState<CircularItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<{ item: CircularItem; action: 'publish' | 'unpublish' } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Sync society context selector if user changes it in header
  useEffect(() => {
    if (selectedSocietyId && !isSuperAdmin) {
      setSocietyFilter(selectedSocietyId);
    }
  }, [selectedSocietyId, isSuperAdmin]);

  // Load societies & events for filters
  useEffect(() => {
    societiesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setSocieties(res.data);
    });
    eventsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setEvents(res.data);
    });
  }, []);

  const fetchCirculars = async () => {
    try {
      setIsLoading(true);
      const res = await circularsService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        societyId: societyFilter || undefined,
        eventId: eventFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
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
  }, [meta.page, meta.limit, societyFilter, eventFilter, statusFilter, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await circularsService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Circular "${deleteTarget.title}" deleted successfully.`);
        setDeleteTarget(null);
        fetchCirculars();
      } else {
        toast.error(res.message || 'Failed to delete circular');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error deleting circular'));
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
            ? `Circular "${item.title}" published successfully.`
            : `Circular "${item.title}" unpublished.`
        );
        setStatusTarget(null);
        fetchCirculars();
      } else {
        toast.error(res.message || `Failed to ${action} circular`);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, `Error updating circular status`));
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const isRecent = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const diff = Date.now() - new Date(dateStr).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000; // within 7 days
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const canManage = can(Permissions.CIRCULAR_CREATE) || can(Permissions.CIRCULAR_UPDATE);

  const handleOpenCircular = (item: CircularItem) => {
    if (item.file_url) {
      window.open(getFileUrl(item.file_url), '_blank', 'noopener,noreferrer');
    } else {
      navigate(`/circulars/${encodeId(item.id)}`);
    }
  };

  const adminColumns: Column<CircularItem>[] = [
    {
      key: 'title',
      header: 'Title & Summary',
      render: (item) => (
        <div className="flex items-center gap-2.5 py-0.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 flex items-center justify-center border border-indigo-100/80">
            {item.file_type === 'pdf' ? (
              <FileText className="w-3.5 h-3.5 text-rose-500" />
            ) : item.file_url ? (
              <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
            ) : (
              <ScrollText className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                onClick={() => handleOpenCircular(item)}
                className="font-bold text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer text-xs sm:text-[13px] truncate"
                title={item.file_url ? 'Click to open document in new tab' : 'Click to view'}
              >
                {item.title}
              </span>
              {isRecent(item.published_at) && (
                <span className="px-1 py-0.2 text-[8px] font-extrabold uppercase bg-emerald-100 text-emerald-700 rounded">
                  New
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-[11px] text-slate-400 truncate max-w-md">{item.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'event',
      header: 'Event / Category',
      render: (item) =>
        item.event ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Calendar className="w-2.5 h-2.5 text-purple-500" />
            {item.event.name}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
            General Notice
          </span>
        ),
    },
    {
      key: 'society',
      header: 'Society',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 truncate max-w-[200px]">
          <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{item.society?.name || '—'}</span>
        </div>
      ),
    },
    {
      key: 'attachment',
      header: 'Attachment',
      render: (item) =>
        item.file_url ? (
          <a
            href={getFileUrl(item.file_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-indigo-600 transition-colors group"
            title="Open attachment in new tab"
          >
            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 text-slate-700 border border-slate-200 group-hover:border-indigo-200 transition-colors">
              {item.file_type || 'FILE'}
            </span>
            {item.file_size && (
              <span className="text-[10px] text-slate-400">{formatFileSize(item.file_size)}</span>
            )}
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </a>
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
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
        <div className="text-[11px] text-slate-600 leading-tight">
          <span className="font-semibold block text-slate-800">
            {item.published_at ? formatDate(item.published_at) : formatDate(item.created_at)}
          </span>
          <span className="text-[9px] text-slate-400">
            by {item.creator?.full_name || 'Admin'}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex items-center justify-end gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenCircular(item)}
            title={item.file_url ? 'Open Document in New Tab' : 'View Circular'}
            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>

          <PermissionGuard permission={Permissions.CIRCULAR_PUBLISH}>
            {item.status === 'published' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusTarget({ item, action: 'unpublish' })}
                title="Unpublish Circular"
                className="p-1 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStatusTarget({ item, action: 'publish' })}
                title="Publish Circular"
                className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
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
              title="Edit Circular"
              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>

          <PermissionGuard permission={Permissions.CIRCULAR_DELETE}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteTarget(item)}
              title="Delete Circular"
              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-soft shrink-0">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">
              {isResident ? 'Society Circulars & Notices' : 'Circulars Management'}
            </h1>
            <p className="text-[11px] text-slate-500">
              {isResident
                ? 'Official notices, collection instructions, and event announcements for your society'
                : 'Publish, distribute, and manage official society circulars and event communications'}
            </p>
          </div>
        </div>

        {canManage && (
          <PermissionGuard permission={Permissions.CIRCULAR_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.CIRCULAR_CREATE)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Circular
            </Button>
          </PermissionGuard>
        )}
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setMeta((m) => ({ ...m, page: 1 }));
        }}
        searchPlaceholder="Search circulars by title or description..."
        filters={
          <div className="flex flex-wrap items-center gap-2">
            {isSuperAdmin && (
              <div className="w-48">
                <Select
                  value={societyFilter}
                  onChange={(e) => {
                    setSocietyFilter(e.target.value);
                    setMeta((m) => ({ ...m, page: 1 }));
                  }}
                  options={[
                    { label: 'All Societies', value: '' },
                    ...societies.map((s) => ({ label: s.name, value: s.id })),
                  ]}
                />
              </div>
            )}
            <div className="w-48">
              <Select
                value={eventFilter}
                onChange={(e) => {
                  setEventFilter(e.target.value);
                  setMeta((m) => ({ ...m, page: 1 }));
                }}
                options={[
                  { label: 'All Events & General', value: '' },
                  ...events.map((e) => ({ label: e.name, value: e.id })),
                ]}
              />
            </div>
            {!isResident && (
              <div className="w-36">
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setMeta((m) => ({ ...m, page: 1 }));
                  }}
                  options={[
                    { label: 'All Statuses', value: '' },
                    { label: 'Published', value: 'published' },
                    { label: 'Draft', value: 'draft' },
                    { label: 'Unpublished', value: 'unpublished' },
                  ]}
                />
              </div>
            )}
          </div>
        }
        actions={
          (search || (isSuperAdmin && societyFilter) || eventFilter || statusFilter) ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSocietyFilter(initialSocietyId);
                setEventFilter('');
                setStatusFilter('');
                setMeta((m) => ({ ...m, page: 1 }));
              }}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
          ) : undefined
        }
      />

      {/* Main Content: Admin Table vs Resident Cards */}
      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Spinner size="lg" label="Loading circulars..." />
        </div>
      ) : circulars.length === 0 ? (
        <EmptyState
          icon={<ScrollText className="w-10 h-10 text-slate-300" />}
          title={isResident ? 'No circulars available' : 'No circulars found'}
          description={
            isResident
              ? 'New society announcements and official circulars will appear here as soon as they are published by your committee.'
              : 'Create your first official circular to communicate important information, collections, and instructions to society residents.'
          }
          action={
            canManage ? (
              <PermissionGuard permission={Permissions.CIRCULAR_CREATE}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(AppRoutes.CIRCULAR_CREATE)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create First Circular
                </Button>
              </PermissionGuard>
            ) : undefined
          }
        />
      ) : !canManage || isResident ? (
        /* ================= RESIDENT CARDS GRID ================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
          {circulars.map((item) => {
            const hasNewTag = isRecent(item.published_at);
            const isPdf = item.file_type === 'pdf';

            return (
              <Card
                key={item.id}
                className="flex flex-col justify-between hover:shadow-card-hover transition-all duration-200 border border-slate-200/80 rounded-xl group"
              >
                <div>
                  {/* Top Bar with Event Tag & New indicator */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {item.event ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                        {item.event.name}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600">
                        General Notice
                      </span>
                    )}

                    {hasNewTag && (
                      <span className="px-1.5 py-0.2 text-[8px] font-extrabold uppercase bg-emerald-50 text-emerald-700 rounded border border-emerald-200 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        New
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => handleOpenCircular(item)}
                    className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-2 leading-snug"
                    title={item.file_url ? 'Click to open document in new tab' : 'Click to view'}
                  >
                    {item.title}
                  </h3>

                  {/* Date & Author */}
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span>Published: {formatDate(item.published_at || item.created_at)}</span>
                    <span>&bull;</span>
                    <span className="truncate">{item.society?.name}</span>
                  </p>

                  {/* Description Snippet */}
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Attachment & Action Footer */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  {item.file_url ? (
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                      {isPdf ? (
                        <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : (
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      )}
                      <span className="truncate max-w-[100px] text-[10px]">
                        {item.file_name || 'Attachment'}
                      </span>
                      {item.file_size && (
                        <span className="text-[9px] text-slate-400">
                          ({formatFileSize(item.file_size)})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">Text Notice</span>
                  )}

                  <div className="flex items-center gap-1">
                    {item.file_url && (
                      <a
                        href={getFileUrl(item.file_url)}
                        download={item.file_name || 'circular'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Download Attachment"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenCircular(item)}
                      rightIcon={<ExternalLink className="w-2.5 h-2.5" />}
                      className="text-[11px] font-bold py-0.5 px-2"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ================= ADMIN DATA TABLE ================= */
        <div className="border border-slate-200/80 rounded-xl bg-white overflow-hidden shadow-card">
          <Table columns={adminColumns} data={circulars} />
          {meta.totalPages > 1 && (
            <div className="px-3 py-2 border-t border-slate-100 bg-[#F8F7FC]/50">
              <Pagination meta={meta} onPageChange={(p) => setMeta((m) => ({ ...m, page: p }))} />
            </div>
          )}
        </div>
      )}

      {/* Resident Pagination */}
      {(!canManage || isResident) && meta.totalPages > 1 && (
        <div className="pt-1">
          <Pagination meta={meta} onPageChange={(p) => setMeta((m) => ({ ...m, page: p }))} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Official Circular"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone and will permanently remove this document for all residents.`}
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete Circular'}
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Publish/Unpublish Confirmation Modal */}
      <ConfirmDialog
        isOpen={Boolean(statusTarget)}
        title={statusTarget?.action === 'publish' ? 'Publish Official Circular' : 'Unpublish Circular'}
        message={
          statusTarget?.action === 'publish'
            ? `Publishing "${statusTarget?.item.title}" will make it immediately visible to all residents belonging to ${statusTarget?.item.society?.name || 'this society'}.`
            : `Unpublishing "${statusTarget?.item.title}" will immediately hide it from all residents.`
        }
        confirmLabel={
          isUpdatingStatus
            ? 'Updating...'
            : statusTarget?.action === 'publish'
            ? 'Publish Now'
            : 'Unpublish'
        }
        cancelLabel="Cancel"
        variant="primary"
        onConfirm={handleStatusToggle}
        onClose={() => setStatusTarget(null)}
      />
    </div>
  );
};

export default CircularListPage;
