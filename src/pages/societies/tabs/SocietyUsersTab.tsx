import React, { useEffect, useState } from 'react';
import Card from '../../../components/ui/Card';
import Table, { Column } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/common/StatusBadge';
import {
  Users,
  UserPlus,
  Shield,
  Gauge,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Mail,
  Phone,
  Lock,
} from 'lucide-react';
import { SocietyHierarchyData, societiesService, SocietyUserQuotaData } from '../../../api/societiesService';
import { usersService } from '../../../api/usersService';
import { rolesService } from '../../../api/rolesService';
import { UserItem, RoleItem } from '../../../types';
import { useToast } from '../../../hooks/useToast';
import { extractErrorMessage } from '../../../utils/errorExtractor';
import { formatDate } from '../../../utils/formatters';
import { isValidEmail, isValidPhone } from '../../../utils/validators';

interface SocietyUsersTabProps {
  data: SocietyHierarchyData;
}

export const SocietyUsersTab: React.FC<SocietyUsersTabProps> = ({ data }) => {
  const toast = useToast();
  const { society } = data;

  const [quotaData, setQuotaData] = useState<SocietyUserQuotaData>({
    activeUsers: 0,
    maxUsers: 20,
    usagePercentage: 0,
    users: [],
  });
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add User Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchQuotaAndUsers = async () => {
    try {
      setIsLoading(true);
      const [quotaRes, rolesRes] = await Promise.all([
        societiesService.getUserQuota(society.id),
        rolesService.getAll({ limit: 50 }).catch(() => ({ data: [] })),
      ]);
      setQuotaData(quotaRes);
      if (rolesRes.data) setRoles(rolesRes.data);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch society users & quota'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotaAndUsers();
  }, [society.id]);

  const validateUserForm = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Full Name (Required)
    if (!fullName.trim()) {
      errs.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters';
    }

    // 2. Email Address (Required)
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!isValidEmail(email)) {
      errs.email = 'Invalid email address format (e.g. name@domain.com)';
    }

    // 3. Phone Number (Optional)
    if (phone.trim() && !isValidPhone(phone)) {
      errs.phone = 'Invalid phone number (7 to 15 digits required)';
    }

    // 4. Role Assignment (Required)
    if (!roleId) {
      errs.roleId = 'Please select a role for this user';
    }

    // 5. Password (Optional)
    if (password.trim() && password.trim().length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddUserSubmit = async () => {
    if (!validateUserForm()) {
      return;
    }

    if (quotaData.activeUsers >= quotaData.maxUsers) {
      toast.error(`User quota limit reached (${quotaData.maxUsers} users maximum).`);
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await usersService.create({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password: password.trim() || undefined,
        role_id: roleId,
        society_ids: [society.id],
        status: 'active',
      });

      if (res.success) {
        toast.success(`User ${fullName} created and assigned to ${society.name}`);
        setIsAddModalOpen(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setErrors({});
        fetchQuotaAndUsers();
      } else {
        toast.error(res.message || 'Failed to create user');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create user'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getQuotaColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-rose-500';
    if (percentage >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const columns: Column<UserItem>[] = [
    {
      key: 'full_name',
      header: 'User Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
            {row.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{row.full_name}</span>
            <span className="text-[11px] text-slate-400 block">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'role_id',
      header: 'Assigned Role',
      render: (row) => {
        const roleName = row.role?.name || row.roles?.[0]?.name || 'Society Admin';
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3" />
            {roleName}
          </span>
        );
      },
    },
    {
      key: 'phone',
      header: 'Phone Number',
      render: (row) => (
        <span className="text-xs text-slate-600">{row.phone || 'N/A'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'created_at',
      header: 'Created On',
      render: (row) => (
        <span className="text-xs text-slate-500">{formatDate(row.created_at)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-3.5 animate-fadeIn">
      {/* User Quota Meter Visual Card */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl shadow-xs border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs text-indigo-300">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  Society User Quota Meter
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {quotaData.activeUsers} / {quotaData.maxUsers} Users
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Maximum 20 administrative and staff accounts can be allocated per housing society.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchQuotaAndUsers}
              className="bg-white/15 text-white hover:bg-white/25 hover:text-white border border-white/30 backdrop-blur-xs font-semibold shadow-xs"
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-white" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (roles.length > 0) setRoleId(roles[0].id);
                setIsAddModalOpen(true);
              }}
              disabled={quotaData.activeUsers >= quotaData.maxUsers}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Add User
            </Button>
          </div>
        </div>

        {/* Visual Meter Bar */}
        <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
          <div className="flex justify-between text-[11px] text-slate-300">
            <span>Quota Utilization</span>
            <span className="font-bold text-white">
              {quotaData.usagePercentage}% Used ({quotaData.maxUsers - quotaData.activeUsers} Available)
            </span>
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${getQuotaColor(quotaData.usagePercentage)}`}
              style={{ width: `${Math.min(100, Math.max(5, quotaData.usagePercentage))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">
              Assigned Administrators & Society Users ({quotaData.users.length})
            </span>
          </div>
        }
      >
        <Table
          columns={columns}
          data={quotaData.users}
          isLoading={isLoading}
          emptyText="No administrators or sub-users assigned to this society yet."
        />
      </Card>

      {/* Add Society User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setErrors({});
        }}
        title="Add Society User / Admin"
        size="md"
      >
        <div className="space-y-4 py-2">
          <Input
            label="Full Name"
            placeholder="e.g. Anand Verma"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
            }}
            error={errors.fullName}
            requiredIndicator
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. anand@palmmeadows.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              error={errors.email}
              requiredIndicator
            />
            <Input
              label="Phone Number"
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              error={errors.phone}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Role Assignment"
              value={roleId}
              onChange={(e) => {
                setRoleId(e.target.value);
                if (errors.roleId) setErrors((prev) => ({ ...prev, roleId: '' }));
              }}
              options={roles.map((r) => ({ label: r.name, value: r.id }))}
              error={errors.roleId}
              requiredIndicator
            />
            <Input
              label="Initial Password (Optional)"
              type="password"
              placeholder="Default: Welcome@123"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
              }}
              error={errors.password}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddUserSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating User...' : 'Create Society User'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
