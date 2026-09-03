import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personsService } from '../../api/personsService';
import { PersonItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import StatusBadge from '../../components/common/StatusBadge';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { encodeId, decodeId } from '../../utils/idObfuscator';
import {
  ArrowLeft,
  Users,
  Edit2,
  Crown,
  Home,
  Building2,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

export const ResidentDetailsPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [resident, setResident] = useState<PersonItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResident = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await personsService.getById(id);
      if (res.success && res.data) {
        setResident(res.data);
      } else {
        setError(res.message || 'Resident record not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load resident details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResident();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading resident profile..." />
      </div>
    );
  }

  if (error || !resident) {
    return <ErrorState message={error || 'Resident not found'} onRetry={fetchResident} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.RESIDENTS)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Residents
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {resident.full_name}
              </h1>
              {resident.is_primary_owner && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  <Crown className="w-3.5 h-3.5 text-amber-600" /> Primary Owner
                </span>
              )}
              <StatusBadge status={resident.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered on {formatDate(resident.created_at)}
            </p>
          </div>
        </div>

        <PermissionGuard permission={Permissions.PERSON_UPDATE}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/residents/${encodeId(id)}/edit`)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit Profile
          </Button>
        </PermissionGuard>
      </div>

      {/* Profile & Unit Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info Card */}
        <Card title="Personal & Contact Information">
          <div className="space-y-4 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-semibold text-slate-900">{resident.full_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Relation to Owner:</span>
              <span className="font-semibold text-slate-900">{resident.relationship_to_owner || 'Self / Owner'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Phone Number:</span>
              <span className="font-semibold text-slate-900">{resident.phone || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Email Address:</span>
              <span className="font-semibold text-slate-900">{resident.email || '—'}</span>
            </div>
          </div>
        </Card>

        {/* Property Unit Linkage Card */}
        <Card title="Residential Unit Linkage">
          {resident.flat ? (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-3">
                <Home className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Apartment Flat {resident.flat.flat_number}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Floor {resident.flat.floor?.floor_number} &bull; {resident.flat.floor?.block?.name || 'Block'} &bull; {resident.flat.floor?.block?.society?.name || 'Society'}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/flats/${encodeId(resident.flat?.id)}`)}
              >
                View Flat Details
              </Button>
            </div>
          ) : resident.bungalow ? (
            <div className="space-y-4">
              <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-100 flex items-start gap-3">
                <Building2 className="w-6 h-6 text-teal-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Bungalow / Villa {resident.bungalow.bungalow_number}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Type: {resident.bungalow.bungalow_type || 'Villa'} &bull; {resident.bungalow.society?.name || 'Society'}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => navigate(`/bungalows/${encodeId(resident.bungalow?.id)}`)}
              >
                View Bungalow Details
              </Button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No property unit linked.</p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResidentDetailsPage;
