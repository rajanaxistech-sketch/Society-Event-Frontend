import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentMethodsService } from '../../api/paymentMethodsService';
import { PaymentMethodItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import { AppRoutes } from '../../constants/routes';
import Card from '../../components/ui/Card';
import Table, { Column } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Switch from '../../components/ui/Switch';
import StatusBadge from '../../components/common/StatusBadge';
import PermissionGuard from '../../components/common/PermissionGuard';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { Plus, Edit2, ArrowLeft, RefreshCw, CreditCard } from 'lucide-react';

export const PaymentMethodsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = usePermission();

  const [methods, setMethods] = useState<PaymentMethodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodItem | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchMethods = async () => {
    try {
      setIsLoading(true);
      const res = await paymentMethodsService.getAll();
      if (res.success && res.data) {
        setMethods(res.data);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to load payment methods'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleOpenCreate = () => {
    setEditingMethod(null);
    setName('');
    setCode('');
    setDescription('');
    setRequiresVerification(false);
    setIsActive(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (m: PaymentMethodItem) => {
    setEditingMethod(m);
    setName(m.name);
    setCode(m.code);
    setDescription(m.description || '');
    setRequiresVerification(m.requires_verification ?? m.requires_reference ?? false);
    const active = m.status === 'active' || m.is_active === true;
    setIsActive(active);
    setModalOpen(true);
  };

  const handleToggleStatus = async (m: PaymentMethodItem) => {
    const currentlyActive = m.status === 'active' || m.is_active === true;
    const nextStatus = currentlyActive ? 'inactive' : 'active';

    try {
      setTogglingId(m.id);
      // Optimistic update
      setMethods((prev) =>
        prev.map((item) =>
          item.id === m.id
            ? { ...item, status: nextStatus, is_active: nextStatus === 'active' }
            : item
        )
      );

      const res = await paymentMethodsService.update(m.id, {
        status: nextStatus,
        is_active: nextStatus === 'active',
      });

      if (res.success) {
        toast.success(`Payment mode "${m.name}" set to ${nextStatus.toUpperCase()}`);
      } else {
        toast.error(res.message || 'Failed to update payment mode status');
        fetchMethods();
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error updating payment method'));
      fetchMethods();
    } finally {
      setTogglingId(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.warning('Please specify both name and short code');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        requires_verification: requiresVerification,
        requires_reference: requiresVerification,
        status: isActive ? 'active' : 'inactive',
        is_active: isActive,
      };

      let res;
      if (editingMethod) {
        res = await paymentMethodsService.update(editingMethod.id, payload);
      } else {
        res = await paymentMethodsService.create(payload);
      }

      if (res.success) {
        toast.success(editingMethod ? 'Payment method updated.' : 'Payment method registered.');
        setModalOpen(false);
        fetchMethods();
      } else {
        toast.error(res.message || 'Failed to save payment method');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save payment method'));
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<PaymentMethodItem>[] = [
    {
      key: 'name',
      header: 'Method Name',
      render: (row) => (
        <div className="py-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 text-xs sm:text-[13px]">{row.name}</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">{row.description || '—'}</span>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code Identifier',
      render: (row) => (
        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
          {row.code}
        </span>
      ),
    },
    {
      key: 'requires_verification',
      header: 'Verification Required',
      render: (row) => {
        const req = row.requires_verification ?? row.requires_reference;
        return (
          <span className="text-xs font-medium text-slate-600">
            {req ? 'Yes (Cheque / NEFT)' : 'No (Instant Cash/QR)'}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status & Toggle',
      align: 'center',
      render: (row) => {
        const rowActive = row.status === 'active' || row.is_active === true;
        return (
          <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
            <StatusBadge status={rowActive ? 'active' : 'inactive'} size="sm" />
            <PermissionGuard permission={Permissions.PAYMENT_METHOD_MANAGE}>
              <Switch
                checked={rowActive}
                onChange={() => handleToggleStatus(row)}
                disabled={togglingId === row.id}
              />
            </PermissionGuard>
          </div>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <PermissionGuard permission={Permissions.PAYMENT_METHOD_MANAGE}>
            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit Payment Mode"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </PermissionGuard>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.EVENTS)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Payment Modes</h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Configure supported payment channels (Cash, UPI / QR, Cheque, Bank Transfer) and toggle active modes for collection.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMethods}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
          <PermissionGuard permission={Permissions.PAYMENT_METHOD_MANAGE}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Mode
            </Button>
          </PermissionGuard>
        </div>
      </div>

      <Card>
        <Table
          columns={columns}
          data={methods}
          isLoading={isLoading}
          emptyText="No payment methods configured."
        />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMethod ? 'Edit Payment Mode' : 'Add Payment Mode'}
        description="Configure payment method attributes and clearing rules."
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Method Name"
              placeholder="e.g. UPI / QR Code, Cheque"
              value={name}
              onChange={(e) => setName(e.target.value)}
              requiredIndicator
            />
            <Input
              label="Short Code"
              placeholder="e.g. UPI, CHEQUE, CASH"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              requiredIndicator
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Instructions for accounts or payers..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-xs text-slate-900 block">Requires Verification</span>
                <span className="text-[11px] text-slate-500">Requires manual clearing before confirming receipt</span>
              </div>
              <Switch checked={requiresVerification} onChange={setRequiresVerification} />
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="font-semibold text-xs text-slate-900 block">Active Status</span>
                <span className="text-[11px] text-slate-500">Enable this mode for event flat collection and vendor payments</span>
              </div>
              <Switch checked={isActive} onChange={setIsActive} />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {editingMethod ? 'Save Changes' : 'Create Mode'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PaymentMethodsPage;
