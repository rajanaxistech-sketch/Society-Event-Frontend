import React, { useEffect, useState } from 'react';
import { reportsService } from '../../api/reportsService';
import { eventsService } from '../../api/eventsService';
import { societiesService } from '../../api/societiesService';
import { EventItem, SocietyItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Table, { Column } from '../../components/ui/Table';
import CurrencyDisplay from '../../components/common/CurrencyDisplay';
import StatusBadge from '../../components/common/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate, formatCurrency } from '../../utils/formatters';
import { exportToCsv } from '../../utils/exportHelper';
import { extractErrorMessage } from '../../utils/errorExtractor';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Wallet,
  Users,
  Building2,
  Calendar,
  Filter,
} from 'lucide-react';

export const ReportsHubPage: React.FC = () => {
  const toast = useToast();
  const { can } = usePermission();

  const [activeReport, setActiveReport] = useState<
    'event-financial' | 'collection-status' | 'sponsor-summary' | 'resident-directory' | 'payment-transactions'
  >('event-financial');

  const [societies, setSocieties] = useState<SocietyItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    societiesService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) setSocieties(res.data);
    });
    eventsService.getAll({ limit: 100 }).then((res) => {
      if (res.success && res.data) {
        setEvents(res.data);
        if (res.data[0]) setSelectedEventId(res.data[0].id);
      }
    });
  }, []);

  const generateReport = async () => {
    try {
      setIsLoading(true);
      setReportData(null);

      let res;
      if (activeReport === 'event-financial') {
        if (!selectedEventId) {
          toast.warning('Please select an event for the financial report');
          setIsLoading(false);
          return;
        }
        res = await reportsService.getEventFinancialReport(selectedEventId);
      } else if (activeReport === 'collection-status') {
        res = await reportsService.getCollectionReport({
          eventId: selectedEventId || undefined,
          societyId: selectedSocietyId || undefined,
        });
      } else if (activeReport === 'sponsor-summary') {
        res = await reportsService.getSponsorshipReport({
          eventId: selectedEventId || undefined,
        });
      } else if (activeReport === 'resident-directory') {
        res = await reportsService.getResidentReport({
          societyId: selectedSocietyId || undefined,
        });
      } else if (activeReport === 'payment-transactions') {
        res = await reportsService.getPaymentReport({
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });
      }

      if (res && res.success && res.data) {
        setReportData(res.data);
      } else {
        toast.error(res?.message || 'Failed to generate report');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error generating analytical report'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEventId || activeReport === 'resident-directory' || activeReport === 'payment-transactions') {
      generateReport();
    }
  }, [activeReport, selectedEventId, selectedSocietyId]);

  const handleExportCsv = () => {
    if (!reportData) return;
    const records = Array.isArray(reportData) ? reportData : reportData.records || [reportData];
    exportToCsv(records, `${activeReport}_report_${new Date().toISOString().split('T')[0]}`);
    toast.success('CSV report downloaded successfully.');
  };

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Financial & Audit Reports Hub</h1>
          <p className="text-[11px] text-slate-500">
            Real-time accounting reconciliation, collection metrics, sponsor ledgers, and resident census.
          </p>
        </div>

        <PermissionGuard permission={Permissions.REPORT_EXPORT}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={!reportData}
            leftIcon={<Download className="w-3 h-3" />}
          >
            Export to CSV
          </Button>
        </PermissionGuard>
      </div>

      {/* Report Categories Nav */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5">
        <button
          type="button"
          onClick={() => setActiveReport('event-financial')}
          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
            activeReport === 'event-financial'
              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>Event Financial Summary</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('collection-status')}
          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
            activeReport === 'collection-status'
              ? 'border-emerald-600 bg-emerald-50/70 text-emerald-700 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-600" />
          <span>Unit Collection Status</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('sponsor-summary')}
          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
            activeReport === 'sponsor-summary'
              ? 'border-amber-600 bg-amber-50/70 text-amber-700 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-amber-600" />
          <span>Sponsors Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('payment-transactions')}
          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
            activeReport === 'payment-transactions'
              ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-blue-600" />
          <span>Payments Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('resident-directory')}
          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
            activeReport === 'resident-directory'
              ? 'border-teal-600 bg-teal-50/70 text-teal-700 shadow-2xs'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Building2 className="w-4 h-4 text-teal-600" />
          <span>Resident Census</span>
        </button>
      </div>

      {/* Filter Parameters */}
      <Card title="Report Filter Parameters">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 items-end">
          {(activeReport === 'event-financial' || activeReport === 'collection-status' || activeReport === 'sponsor-summary') && (
            <Select
              label="Select Event"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
          )}

          {(activeReport === 'collection-status' || activeReport === 'resident-directory') && (
            <Select
              label="Filter Society"
              value={selectedSocietyId}
              onChange={(e) => setSelectedSocietyId(e.target.value)}
            >
              <option value="">All Societies</option>
              {societies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}

          {activeReport === 'payment-transactions' && (
            <>
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={generateReport}
            isLoading={isLoading}
            leftIcon={<Filter className="w-3.5 h-3.5" />}
          >
            Apply Filters
          </Button>
        </div>
      </Card>

      {/* Render Report Output */}
      {isLoading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Spinner size="lg" label="Compiling report analytics..." />
        </div>
      ) : reportData ? (
        <Card title="Report Data Output">
          <div className="overflow-x-auto">
            {/* If JSON object with KPI totals */}
            {typeof reportData === 'object' && !Array.isArray(reportData) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3.5">
                {Object.entries(reportData)
                  .filter(([key, val]) => typeof val === 'number' || typeof val === 'string')
                  .slice(0, 8)
                  .map(([k, v]: any) => (
                    <div key={k} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block truncate">
                        {k.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">
                        {typeof v === 'number' && v > 100 ? formatCurrency(v) : String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            )}

            {/* If array of rows */}
            {Array.isArray(reportData) && reportData.length > 0 ? (
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold">
                  <tr>
                    {Object.keys(reportData[0] || {}).slice(0, 7).map((header) => (
                      <th key={header} className="px-2.5 py-2 capitalize font-semibold text-[11px]">
                        {header.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {Object.entries(row).slice(0, 7).map(([k, val]: any, i: number) => (
                        <td key={i} className="px-2.5 py-1.5 text-slate-800">
                          {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '—')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-8 text-slate-400 text-xs">
            No report data generated. Adjust parameters and click Apply Filters.
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportsHubPage;
