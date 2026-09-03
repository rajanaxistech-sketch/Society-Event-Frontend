import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rolesService } from '../../api/rolesService';
import { RoleItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import PermissionGuard from '../../components/common/PermissionGuard';
import { formatDate } from '../../utils/formatters';
import { ArrowLeft, Shield, CheckCircle2, Lock, Calendar } from 'lucide-react';

export const RoleDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [role, setRole] = useState<RoleItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      const res = await rolesService.getById(id);
      if (res.success && res.data) {
        setRole(res.data);
      } else {
        setError(res.message || 'Role record not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load security role');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading security role..." />
      </div>
    );
  }

  if (error || !role) {
    return <ErrorState message={error || 'Role not found'} onRetry={fetchRole} />;
  }

  const rolePerms =
    role.permissions ||
    role.role_permissions?.map((rp: any) => rp.permission).filter(Boolean) ||
    [];

  // Group permissions
  const groupedPerms: Record<string, any[]> = {};
  rolePerms.forEach((p: any) => {
    const mod = p.module || p.code?.split('.')[0] || 'General';
    if (!groupedPerms[mod]) groupedPerms[mod] = [];
    groupedPerms[mod].push(p);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.ROLES)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Roles
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{role.name}</h1>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  role.is_system ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {role.is_system ? 'System Default' : 'Custom Defined'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created on {formatDate(role.created_at)} &bull; {rolePerms.length} permissions granted
            </p>
          </div>
        </div>
      </div>

      {/* Role Summary */}
      <Card title="Role Overview">
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Role Name:</span>
            <span className="font-semibold text-slate-900">{role.name}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Description:</span>
            <span className="font-semibold text-slate-900">{role.description || '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-slate-100">
            <span className="text-slate-500">Total Granted Capabilities:</span>
            <span className="font-bold text-indigo-600">{rolePerms.length} RBAC Permissions</span>
          </div>
        </div>
      </Card>

      {/* Permissions Matrix */}
      <Card
        title="Granted Capabilities & Authorization Matrix"
        subtitle="List of functional permissions authorized for users holding this role."
      >
        <div className="space-y-6">
          {Object.entries(groupedPerms).length > 0 ? (
            Object.entries(groupedPerms).map(([modName, perms]) => (
              <div key={modName} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  {modName} Module ({perms.length})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {perms.map((p: any) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs flex items-start gap-2 shadow-2xs"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-900 block">{p.name || p.code}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{p.code}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No specific permissions attached to this role.</p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default RoleDetailsPage;
