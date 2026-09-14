import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { eventsService } from '../../api/eventsService';
import { societiesService } from '../../api/societiesService';
import { EventItem, PaginationMeta, SocietyItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import { usePermission } from '../../hooks/usePermission';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import { getEventTheme } from '../../utils/eventTheme';
import {
  Wallet,
  Calendar,
  Building2,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const FlatCollectionsEventListPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { selectedSocietyId } = useAuth();
  const { isSuperAdmin } = usePermission();

  const urlParams = new URLSearchParams(location.search);
  const initialSocietyId = decodeId(urlParams.get('societyId') || '') || selectedSocietyId || '';

  const [events, setEvents] = useState<EventItem[]>([]);
  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 12, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [societyFilter, setSocietyFilter] = useState(initialSocietyId);
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('start_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sync society context selector if user changes it in header
  useEffect(() => {
    if (selectedSocietyId && !isSuperAdmin) {
      setSocietyFilter(selectedSocietyId);
    }
  }, [selectedSocietyId, isSuperAdmin]);

  // Load societies for the filter dropdown
  useEffect(() => {
    societiesService
      .getAll({ limit: 100 })
      .then((res) => {
        if (res.success && res.data) setSocieties(res.data);
      })
      .catch(() => {});
  }, []);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      setError(null);
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
      } else {
        setError(res.message || 'Failed to load events');
      }
    } catch (err: any) {
      const msg = extractErrorMessage(err, 'Failed to fetch events for collection');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [meta.page, meta.limit, societyFilter, statusFilter, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleOpenCollections = (event: EventItem) => {
    navigate(`/flat-collections/${encodeId(event.id)}`);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalEvents = meta.total || events.length;
    const ongoingCount = events.filter((e) => e.status === 'ongoing' || e.status === 'published').length;
    const withCollections = events.filter(
      (e) => (e._count?.event_collections || 0) > 0 || e.event_configuration?.collection_enabled || e.is_navratri
    ).length;
    return { totalEvents, ongoingCount, withCollections };
  }, [events, meta.total]);

  const columns: Column<EventItem>[] = [
    {
      key: 'name',
      header: 'Event Name & Society',
      sortable: true,
      render: (row) => {
        const theme = getEventTheme(row.name, row.description);
        const societyName = row.society?.name || 'All Societies';
        return (
          <div
            className="flex items-center gap-3 py-1 cursor-pointer group"
            onClick={() => handleOpenCollections(row)}
          >
            <div
              className={`w-9 h-9 rounded-xl ${theme.iconBgClass} flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}
            >
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-xs sm:text-sm">
                  {row.name}
                </span>
                {row.event_year && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded border border-indigo-200/60">
                    {row.event_year}
                  </span>
                )}
                {row.is_navratri && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded border border-amber-200/60 flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> Navratri
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5 font-medium">
                <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{societyName}</span>
                {row.society?.code && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">
                    {row.society.code}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'start_date',
      header: 'Event Date & Venue',
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatDate(row.start_date)}</span>
            {row.end_date && <span> - {formatDate(row.end_date)}</span>}
          </div>
          {row.venue && <div className="text-[11px] text-slate-500 mt-0.5 truncate">{row.venue}</div>}
        </div>
      ),
    },
    {
      key: 'collections_count',
      header: 'Collection Status',
      align: 'center',
      render: (row) => {
        const count = row._count?.event_collections || 0;
        const isEnabled = row.event_configuration?.collection_enabled || row.is_navratri;
        return (
          <div className="flex flex-col items-center">
            {count > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Wallet className="w-3 h-3" />
                {count} Flat Record{count !== 1 ? 's' : ''}
              </span>
            ) : isEnabled ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3" /> Enabled
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Not initialized</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (row) => (
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleOpenCollections(row)}
          rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          className="text-xs font-semibold h-7.5 px-2.5"
        >
          View Collections
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold shadow-soft shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Flat Collections
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select an event to view contribution obligations, record flat payments, and manage collection ledgers.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Events
            </span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5 block">
              {stats.totalEvents}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Active / Published
            </span>
            <span className="text-xl font-extrabold text-emerald-600 mt-0.5 block">
              {stats.ongoingCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Events With Collections
            </span>
            <span className="text-xl font-extrabold text-indigo-600 mt-0.5 block">
              {stats.withCollections}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Listing Card */}
      <Card
        title="Events by Society"
        subtitle="Choose an event below to open its flat collection ledger."
      >
        <div className="mb-4">
          <FilterBar
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              if (!val) {
                setMeta((prev) => ({ ...prev, page: 1 }));
              }
            }}
            searchPlaceholder="Search event name, description, venue..."
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
                  <option value="published">Published</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            }
          />
        </div>

        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Spinner size="lg" label="Loading society events..." />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchEvents} />
        ) : events.length === 0 ? (
          <EmptyState
            title="No events available for flat collection."
            description={
              search || societyFilter || statusFilter
                ? 'No events match your current filter criteria. Try resetting filters.'
                : 'No events have been created for societies yet. Create an event in Event Management to start flat collections.'
            }
            icon={<Wallet className="w-6 h-6 text-indigo-500" />}
            action={
              (search || societyFilter || statusFilter) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setSocietyFilter('');
                    setStatusFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table
                columns={columns}
                data={events}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={handleSort}
                onRowClick={(row) => handleOpenCollections(row)}
              />
            </div>

            {/* Mobile / Tablet Card View */}
            <div className="md:hidden space-y-2.5">
              {events.map((event) => {
                const theme = getEventTheme(event.name, event.description);
                const societyName = event.society?.name || 'All Societies';
                const count = event._count?.event_collections || 0;
                return (
                  <div
                    key={event.id}
                    onClick={() => handleOpenCollections(event)}
                    className="p-3.5 bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-indigo-300 transition-all cursor-pointer active:scale-[0.99] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg ${theme.iconBgClass} flex items-center justify-center font-bold text-xs shrink-0`}
                        >
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-xs truncate">{event.name}</h4>
                          <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium truncate mt-0.5">
                            <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="truncate">{societyName}</span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={event.status} size="sm" />
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(event.start_date)}</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-indigo-600">
                        <Wallet className="w-3 h-3" />
                        <span>{count > 0 ? `${count} Flats` : 'Open'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <Pagination
                  meta={meta}
                  onPageChange={(p) => setMeta((prev) => ({ ...prev, page: p }))}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default FlatCollectionsEventListPage;
