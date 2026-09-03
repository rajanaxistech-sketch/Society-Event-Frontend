import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usersService } from '../../api/usersService';
import { UserItem, RoleItem, SocietyItem } from '../../types';
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
  User,
  Shield,
  Edit2,
  Building2,
  Mail,
  Phone,
  Clock,
  Key,
} from 'lucide-react';

export const UserDetailsPage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [user, setUser] = useState<UserItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await usersService.getById(id);
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setError(res.message || 'User account not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading user account..." />
      </div>
    );
  }

  if (error || !user) {
    return <ErrorState message={error || 'User not found'} onRetry={fetchUser} />;
  }

  const userRoles = (user.roles || user.user_roles?.map((ur) => ur.role) || []).filter(Boolean) as RoleItem[];
  const assignedSocieties = (user.user_societies?.map((us) => us.society) || []).filter(Boolean) as SocietyItem[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.USERS)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Users
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{user.full_name}</h1>
              <StatusBadge status={user.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <PermissionGuard permission={Permissions.USER_UPDATE}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/users/${encodeId(id)}/edit`)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
          >
            Edit User
          </Button>
        </PermissionGuard>
      </div>

      {/* Profile & Security Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Account Profile Details">
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-semibold text-slate-900">{user.full_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Email (Username):</span>
              <span className="font-semibold text-slate-900">{user.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Phone Number:</span>
              <span className="font-semibold text-slate-900">{user.phone || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Account Created:</span>
              <span className="font-semibold text-slate-900">{formatDate(user.created_at)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Last Login:</span>
              <span className="font-semibold text-slate-900">{formatDate(user.last_login_at)}</span>
            </div>
          </div>
        </Card>

        <Card title="Roles & Security Permissions">
          <div className="space-y-4">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block mb-2">
                Assigned System Roles
              </span>
              <div className="flex flex-wrap gap-2">
                {userRoles.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    {r.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400 font-semibold uppercase block mb-2">
                Assigned Society Scope
              </span>
              {assignedSocieties.length > 0 ? (
                <div className="space-y-1.5">
                  {assignedSocieties.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-xs text-slate-800 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Global Scope (Access to all societies across system)
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserDetailsPage;
