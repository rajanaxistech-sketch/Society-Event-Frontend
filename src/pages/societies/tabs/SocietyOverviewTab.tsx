import React from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import {
  Building2,
  MapPin,
  Users,
  Layers,
  Grid,
  Home,
  Store,
  Navigation,
  ExternalLink,
  Phone,
  Mail,
  UserCheck,
  Percent,
  UploadCloud,
  UserPlus,
  Compass,
} from 'lucide-react';
import { SocietyHierarchyData } from '../../../api/societiesService';
import { formatDate } from '../../../utils/formatters';

interface SocietyOverviewTabProps {
  data: SocietyHierarchyData;
  onSwitchTab: (tab: string) => void;
}

export const SocietyOverviewTab: React.FC<SocietyOverviewTabProps> = ({
  data,
  onSwitchTab,
}) => {
  const {
    society,
    blocks,
    bungalows,
    totalFloors,
    totalFlats,
    totalShops,
    totalBungalows,
    totalResidents,
    occupancyRate,
  } = data;

  const hasCoordinates = !!society.latitude && !!society.longitude;
  const mapUrl = hasCoordinates
    ? `https://maps.google.com/?q=${society.latitude},${society.longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent(
        `${society.name}, ${society.city || ''}, ${society.state || ''}`
      )}`;

  return (
    <div className="space-y-3.5 animate-fadeIn">
      {/* Top Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between gap-1 text-indigo-600 mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Blocks</span>
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 block">{blocks.length}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">{totalFloors} total floors</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between gap-1 text-blue-600 mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Flats</span>
            <Home className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 block">{totalFlats}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Residential units</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between gap-1 text-emerald-600 mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Shops</span>
            <Store className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 block">{totalShops}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Commercial ground</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between gap-1 text-amber-600 mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Villas</span>
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 block">{totalBungalows}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Independent houses</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between gap-1 text-purple-600 mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Residents</span>
            <Users className="w-3.5 h-3.5" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 block">{totalResidents}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Owners & tenants</span>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between gap-1 text-rose-600 mb-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Occupancy</span>
            <Percent className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-slate-900">{occupancyRate}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, occupancyRate))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Details Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        {/* Society Profile Details */}
        <div className="lg:col-span-2 space-y-3.5">
          <Card
            title={
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900">Society Profile & Registration Details</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Full Registered Name</span>
                <span className="font-bold text-slate-900 mt-0.5 block">{society.name}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Society Short Code</span>
                <span className="font-bold text-indigo-600 mt-0.5 block">{society.code || 'N/A'}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Registration Date</span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {formatDate(society.created_at)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold block">Status</span>
                <div className="mt-0.5">
                  <StatusBadge status={society.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Secretary / Primary Contact */}
            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Administrative Contact
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-medium block">Contact Person</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {society.contact_name || 'Not assigned'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-medium block">Phone</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {society.contact_phone || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-medium block">Email</span>
                    <span className="text-xs font-bold text-slate-800 truncate block">
                      {society.contact_email || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Hub Navigator Actions */}
          <Card
            title={
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900">Quick Navigation Hub</span>
              </div>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => onSwitchTab('structure')}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-left group shadow-2xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-1.5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Structure Explorer</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Explore unit matrix & floor layout</p>
              </button>

              <button
                type="button"
                onClick={() => onSwitchTab('import')}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-left group shadow-2xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <UploadCloud className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Owner Data Import</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Download template & upload Excel</p>
              </button>

              <button
                type="button"
                onClick={() => onSwitchTab('users')}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:border-purple-400 hover:bg-purple-50/30 transition-all text-left group shadow-2xs cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-1.5 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <UserPlus className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">User Management</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Admin quota meter & staff access</p>
              </button>
            </div>
          </Card>
        </div>

        {/* Location & GPS Map Preview Card */}
        <div className="space-y-6">
          <Card
            title={
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-900">Location & Geofencing</span>
              </div>
            }
          >
            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-semibold block">Full Address</span>
                <p className="text-xs font-medium text-slate-800 mt-1 leading-relaxed">
                  {society.address_line1 || 'No address registered'}
                  {society.address_line2 && `, ${society.address_line2}`}
                  {society.city && `, ${society.city}`}
                  {society.state && `, ${society.state}`}
                  {society.postal_code && ` - ${society.postal_code}`}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">GPS Latitude:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {society.latitude ?? 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">GPS Longitude:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {society.longitude ?? 'N/A'}
                  </span>
                </div>
              </div>

              {/* Map Preview Mock Widget */}
              <div className="h-40 rounded-xl bg-slate-100 border border-slate-200 relative overflow-hidden flex items-center justify-center group">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/80 to-indigo-100/40 opacity-70" />
                <div className="relative z-10 text-center p-3">
                  <div className="w-10 h-10 rounded-full bg-white shadow-md text-emerald-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Navigation className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {society.city || 'GPS Location'} Pin
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {hasCoordinates ? `${society.latitude}, ${society.longitude}` : 'Click to view in maps'}
                  </span>
                </div>
              </div>

              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
              >
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
