import React, { useEffect, useState } from 'react';
import { settingsService } from '../../api/settingsService';
import { SystemSettingItem } from '../../types';
import { useToast } from '../../hooks/useToast';
import { usePermission } from '../../hooks/usePermission';
import { Permissions } from '../../constants/permissions';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Switch from '../../components/ui/Switch';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import PermissionGuard from '../../components/common/PermissionGuard';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { Settings as SettingsIcon, Save, RefreshCw, Shield, Globe, Bell } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const { can } = usePermission();

  const [settings, setSettings] = useState<Record<string, any>>({
    system_name: 'Society & Community Event Management',
    default_currency: 'INR',
    currency_symbol: '₹',
    allow_online_payments: true,
    auto_generate_receipts: true,
    enable_email_notifications: true,
    enable_sms_notifications: false,
    session_timeout_minutes: 60,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await settingsService.getAll();
      if (res.success && res.data) {
        // Map settings array/object into state dictionary
        if (Array.isArray(res.data)) {
          const dict: Record<string, any> = { ...settings };
          res.data.forEach((item: SystemSettingItem) => {
            dict[item.key] = item.value;
          });
          setSettings(dict);
        } else if (typeof res.data === 'object') {
          setSettings((prev) => ({ ...prev, ...res.data }));
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load system settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await settingsService.updateBulk(settings);
      if (res.success) {
        toast.success('System settings saved successfully.');
      } else {
        toast.error(res.message || 'Failed to update settings');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to update settings'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading system settings..." />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchSettings} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Configure global defaults, payment policies, notifications, and security rules.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchSettings}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Reload
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-3.5">
        {/* General Application Settings */}
        <Card
          title={
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>General Platform Configurations</span>
            </div>
          }
        >
          <div className="space-y-3">
            <Input
              label="Application Brand Name"
              value={settings.system_name || ''}
              onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Default Currency Code"
                value={settings.default_currency || 'INR'}
                onChange={(e) => setSettings({ ...settings, default_currency: e.target.value })}
              />

              <Input
                label="Currency Symbol"
                value={settings.currency_symbol || '₹'}
                onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Payment & Receipts Policy */}
        <Card
          title={
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900">
              <SettingsIcon className="w-4 h-4 text-emerald-600" />
              <span>Payment & Receipt Automation Policies</span>
            </div>
          }
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Enable Online Payment Gateway & UPI QR
                </span>
                <span className="text-[11px] text-slate-500">
                  Allows direct online settlement from resident portals
                </span>
              </div>
              <Switch
                checked={!!settings.allow_online_payments}
                onChange={(val) => setSettings({ ...settings, allow_online_payments: val })}
              />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Automatic Receipt Numbering
                </span>
                <span className="text-[11px] text-slate-500">
                  Generate sequential alphanumeric receipt codes on transaction save
                </span>
              </div>
              <Switch
                checked={!!settings.auto_generate_receipts}
                onChange={(val) => setSettings({ ...settings, auto_generate_receipts: val })}
              />
            </div>
          </div>
        </Card>

        {/* Security & Notifications */}
        <Card
          title={
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900">
              <Bell className="w-4 h-4 text-amber-600" />
              <span>Notifications & Security Policy</span>
            </div>
          }
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-lg border border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Email Notifications for Payment Receipts
                </span>
                <span className="text-[11px] text-slate-500">
                  Email receipts to primary owner on payment recording
                </span>
              </div>
              <Switch
                checked={!!settings.enable_email_notifications}
                onChange={(val) => setSettings({ ...settings, enable_email_notifications: val })}
              />
            </div>

            <Input
              label="Session Idle Timeout (Minutes)"
              type="number"
              value={settings.session_timeout_minutes || 60}
              onChange={(e) =>
                setSettings({ ...settings, session_timeout_minutes: Number(e.target.value) })
              }
              helperText="Automatic sign-out duration for inactive user sessions"
            />
          </div>
        </Card>

        {/* Submit Actions */}
        <PermissionGuard permission={Permissions.SETTING_UPDATE}>
          <div className="flex items-center justify-end gap-2.5">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save System Settings
            </Button>
          </div>
        </PermissionGuard>
      </form>
    </div>
  );
};

export default SettingsPage;
