import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { importsService } from '../../api/importsService';
import { ImportJobItem, PaginationMeta } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Pagination from '../../components/ui/Pagination';
import Button from '../../components/ui/Button';
import StatusBadge from '../../components/common/StatusBadge';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { Upload, Eye, RefreshCw, FileSpreadsheet } from 'lucide-react';

export const ImportListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [jobs, setJobs] = useState<ImportJobItem[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const res = await importsService.getAll({
        page: meta.page,
        limit: meta.limit,
      });

      if (res.success && res.data) {
        setJobs(res.data);
        if (res.meta) setMeta(res.meta);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch import job history'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [meta.page, meta.limit]);

  const columns: Column<ImportJobItem>[] = [
    {
      key: 'file_name',
      header: 'Source File',
      render: (row) => (
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold text-slate-900 block truncate max-w-xs">{row.file_name}</span>
        </div>
      ),
    },
    {
      key: 'entity_type',
      header: 'Entity Type',
      render: (row) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 uppercase">
          {row.entity_type}
        </span>
      ),
    },
    {
      key: 'metrics',
      header: 'Processed Records',
      render: (row) => (
        <div className="text-xs space-x-2">
          <span className="text-slate-600 font-medium">Total: {row.total_rows ?? 0}</span>
          <span className="text-emerald-600 font-medium">Success: {row.success_rows ?? 0}</span>
          {(row.failed_rows ?? 0) > 0 && (
            <span className="text-rose-600 font-bold">Failed: {row.failed_rows}</span>
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
      key: 'created_at',
      header: 'Uploaded On',
      render: (row) => <span className="text-xs text-slate-500">{formatDate(row.created_at)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`/imports/${row.id}`)}
          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          title="View Import Summary"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Data Import</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Import residential structures, flats, and residents en masse via Excel / CSV.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchJobs}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.IMPORT_UPLOAD}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(AppRoutes.IMPORT_UPLOAD)}
              leftIcon={<Upload className="w-4 h-4" />}
            >
              Upload New File
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={jobs}
          isLoading={isLoading}
          emptyText="No previous import jobs recorded. Click 'Upload New File' to import batch data."
          onRowClick={(row) => navigate(`/imports/${row.id}`)}
        />

        <Pagination
          meta={meta}
          onPageChange={(page) => setMeta((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setMeta((prev) => ({ ...prev, limit, page: 1 }))}
        />
      </Card>
    </div>
  );
};

export default ImportListPage;
