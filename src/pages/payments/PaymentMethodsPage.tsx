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
import { Plus, Edit2, ArrowLeft, Sliders, RefreshCw } from 'lucide-react';

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
    setRequiresVerification(m.requires_verification ?? false);
    setIsActive(m.is_active ?? true);
    setModalOpen(true);
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
        name,
        code: code.toUpperCase(),
        description: description || null,
        requires_verification: requiresVerification,
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
        <div>
          <span className="font-bold text-slate-900 block">{row.name}</span>
          <span className="text-xs text-slate-400">{row.description || '—'}</span>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code Identifier',
      render: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
          {row.code}
        </span>
      ),
    },
    {
      key: 'requires_verification',
      header: 'Verification Required',
      render: (row) => (
        <span className="text-xs text-slate-600">
          {row.requires_verification ? 'Yes (e.g. Cheque / NEFT)' : 'No (Instant)'}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      align: 'center',
      render: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} size="sm" />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <PermissionGuard permission={Permissions.PAYMENT_METHOD_MANAGE}>
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Mode"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </PermissionGuard>
      ),
    },
  ];

  return (
    <div className="space-y-3.5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.PAYMENTS)}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Payment Modes</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Configure supported payment channels (Cash, UPI / QR, Cheque, Bank Transfer).
            </p>
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
        title={editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
        description="Configure payment method attributes and clearing rules."
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
                <span className="text-[11px] text-slate-500">Enable this mode on the payment form</span>
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
