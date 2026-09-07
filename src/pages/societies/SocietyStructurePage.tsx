import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { societiesService } from '../../api/societiesService';
import { SocietyItem, SocietyStructureConfig } from '../../types';
import { useToast } from '../../hooks/useToast';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Switch from '../../components/ui/Switch';
import Spinner from '../../components/ui/Spinner';
import ErrorState from '../../components/common/ErrorState';
import { ArrowLeft, Save, Sliders, Layers, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { extractErrorMessage } from '../../utils/errorExtractor';
import { encodeId, decodeId } from '../../utils/idObfuscator';

export const SocietyStructurePage: React.FC = () => {
  const { id: rawId } = useParams<{ id: string }>();
  const id = decodeId(rawId);
  const navigate = useNavigate();
  const toast = useToast();

  const [society, setSociety] = useState<SocietyItem | null>(null);
  const [flatEnabled, setFlatEnabled] = useState(true);
  const [bungalowEnabled, setBungalowEnabled] = useState(false);
  const [setupCompleted, setSetupCompleted] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        const [socRes, structRes] = await Promise.all([
          societiesService.getById(id),
          societiesService.getStructure(id).catch(() => null),
        ]);

        if (socRes.success && socRes.data) {
          setSociety(socRes.data);
        }

        if (structRes && structRes.success && structRes.data) {
          const cfg = structRes.data;
          setFlatEnabled(cfg.flat_enabled ?? true);
          setBungalowEnabled(cfg.bungalow_enabled ?? false);
          setSetupCompleted(cfg.setup_completed ?? false);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load society structure config');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfig();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;

    // Business Rule: At least one of flat or bungalow must be enabled
    if (!flatEnabled && !bungalowEnabled) {
      toast.error('At least one of Flats or Bungalows structure must be enabled.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await societiesService.updateStructure(id, {
        flat_enabled: flatEnabled,
        bungalow_enabled: bungalowEnabled,
        setup_completed: setupCompleted,
      });

      if (res.success) {
        toast.success('Society structure configuration saved successfully.');
        navigate(`/societies/${encodeId(id)}`);
      } else {
        toast.error(res.message || 'Failed to save configuration');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to save structure config'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" label="Loading structure configuration..." />
      </div>
    );
  }

  if (error || !society) {
    return <ErrorState message={error || 'Society not found'} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/societies/${encodeId(id)}`)}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Cancel
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Structure Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure unit hierarchy and architectural layout for <strong>{society.name}</strong>.
          </p>
        </div>
      </div>

      {/* Configuration Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <span>Unit Hierarchy Toggles</span>
          </div>
        }
        subtitle="Specify which types of properties exist within this community."
      >
        <div className="space-y-6">
          {/* Flat Hierarchy Option */}
          <div className="p-4 rounded-2xl border border-indigo-100 bg-[#EEF2FF]/60 flex items-start justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-[#6366F1] shrink-0 mt-0.5">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Apartments / Flats Hierarchy</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enables multi-tier apartment structure: <strong>Society &rarr; Blocks &rarr; Floors &rarr; Flats &rarr; Residents</strong>.
                </p>
              </div>
            </div>
            <Switch
              checked={flatEnabled}
              onChange={(val) => {
                if (!val && !bungalowEnabled) {
                  toast.warning('At least one structure must remain enabled.');
                  return;
                }
                setFlatEnabled(val);
              }}
            />
          </div>

          {/* Bungalow Hierarchy Option */}
          <div className="p-4 rounded-2xl border border-teal-100 bg-teal-50/50 flex items-start justify-between gap-4 shadow-2xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-[#14B8A6] shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Bungalows / Villas Hierarchy</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enables independent residential units: <strong>Society &rarr; Bungalows &rarr; Residents</strong>.
                </p>
              </div>
            </div>
            <Switch
              checked={bungalowEnabled}
              onChange={(val) => {
                if (!val && !flatEnabled) {
                  toast.warning('At least one structure must remain enabled.');
                  return;
                }
                setBungalowEnabled(val);
              }}
            />
          </div>

          {/* Setup Completion Flag */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-indigo-100/70 bg-[#F8F7FC] shadow-2xs">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">Mark Structure Setup as Completed</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Flags this society as fully initialized and ready for event obligations.
                </p>
              </div>
              <Switch checked={setupCompleted} onChange={setSetupCompleted} />
            </div>
          </div>

          {/* Visual Validation Notice */}
          {!flatEnabled && !bungalowEnabled && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>You must enable at least one structure model before saving.</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/societies/${encodeId(id)}`)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              isLoading={isSubmitting}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SocietyStructurePage;
