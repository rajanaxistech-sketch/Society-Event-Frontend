import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { eventsService } from '../../api/eventsService';
import { societiesService } from '../../api/societiesService';
import { EventItem, PaginationMeta, SocietyItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import { getEventTheme } from '../../utils/eventTheme';
import { Plus, Eye, Edit2, Trash2, Sliders, RefreshCw, LayoutDashboard, Calendar } from 'lucide-react';

export const EventListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { can } = usePermission();

  // Seed society filter from URL query param (e.g. ?societyId=xxx when coming from Society Details)
  const initialSocietyId = decodeId(new URLSearchParams(location.search).get('societyId') || '');

  const [events, setEvents] = useState<EventItem[]>([]);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [societyFilter, setSocietyFilter] = useState(initialSocietyId);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const urlSocietyId = decodeId(new URLSearchParams(location.search).get('societyId') || '');
    if (urlSocietyId !== societyFilter) {
      setSocietyFilter(urlSocietyId);
    }
  }, [location.search]);

  // Load societies for the filter dropdown
  useEffect(() => {
    societiesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setSocieties(res.data);
    });
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const res = await eventsService.getAll({
        page: meta.page,
        limit: meta.limit,
        search: search || undefined,
        societyId: societyFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });

      if (res.success && res.data) {
        setEvents(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch events'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [meta.page, meta.limit, societyFilter, statusFilter, sortBy, sortOrder]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await eventsService.delete(deleteTarget.id);
      if (res.success) {
        toast.success(`Event "${deleteTarget.name}" deleted successfully.`);
        setDeleteTarget(null);
        fetchEvents();
      } else {
        toast.error(res.message || 'Failed to delete event');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error deleting event'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<EventItem>[] = [
    {
      key: 'name',
      header: 'Event Name',
      sortable: true,
      render: (row) => {
        const theme = getEventTheme(row.name, row.description);
        return (
  const columns: Column<EventItem>[] = [
    {
      key: 'name',
      header: 'Event Name',
      sortable: true,
      render: (row) => {
        const theme = getEventTheme(row.name, row.description);
        return (
          <div className="flex items-center gap-2.5 py-0.5">
            <div className={`w-7 h-7 rounded-lg ${theme.iconBgClass} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs`}>
              <Calendar className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 block hover:text-indigo-600 transition-colors text-xs sm:text-[13px]">
                  {row.name}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${theme.badgeClass}`}>
                  {theme.label}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 truncate max-w-xs block mt-0.5">{row.venue || 'Clubhouse Lawn'}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'society',
      header: 'Society',
      render: (row) => (
        <span className="text-slate-700 text-xs font-medium truncate block max-w-[180px]">{row.society?.name || '—'}</span>
      ),
    },
    {
      key: 'dates',
      header: 'Event Date(s)',
      sortable: true,
      render: (row) => (
        <div className="text-[11px]">
          <span className="font-bold text-slate-800 block">{formatDate(row.start_date)}</span>
          {row.end_date && row.end_date !== row.start_date && (
            <span className="text-slate-400">to {formatDate(row.end_date)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => navigate(`/events/${encodeId(row.id)}/dashboard`)}
            className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
            title="Event Dashboard"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/events/${encodeId(row.id)}`)}
            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <PermissionGuard permission={Permissions.EVENT_CONFIG}>
            <button
              type="button"
              onClick={() => navigate(`/events/${encodeId(row.id)}/configuration`)}
              className="p-1 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
              title="Configure Event Modules"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.EVENT_UPDATE}>
            <button
              type="button"
              onClick={() => navigate(`/events/${encodeId(row.id)}/edit`)}
              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Edit Event"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
          <PermissionGuard permission={Permissions.EVENT_DELETE}>
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              className="p-1 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              title="Delete Event"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">Events Management</h1>
          <p className="text-[11px] text-slate-500">
            Plan, configure, publish, and oversee society cultural and festival events.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.EVENT_CREATE}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.EVENT_CREATE)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create Event
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          if (!val) {
            setMeta((prev) => ({ ...prev, page: 1 }));
            setTimeout(fetchEvents, 50);
          }
        }}
        searchPlaceholder="Search event name, venue, or society..."
        filters={
          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={societyFilter}
              onChange={(e) => {
                setSocietyFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-xs h-8 sm:h-9 text-slate-800 font-medium"
            >
              <option value="">All Societies</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setMeta((prev) => ({ ...prev, page: 1 }));
              }}
              className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 h-8 sm:h-9 text-slate-800 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        }
      />

      {/* Table */}
      <Table
        columns={columns}
        data={events}
        isLoading={isLoading}
        emptyText="No events found. Click 'Create Event' to organize a new community festival."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(field) => {
          if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(field);
            setSortOrder('asc');
          }
        }}
        onRowClick={(row) => navigate(`/events/${encodeId(row.id)}`)}
      />

      {/* Pagination */}
      <Pagination
        meta={meta}
        onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Event"
        message={
          <span>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? All associated collections, sponsorships, and catering items will be removed.
          </span>
        }
        confirmLabel="Delete Event"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default EventListPage;
