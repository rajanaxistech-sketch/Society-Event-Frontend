import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { societiesService } from '../../api/societiesService';
import {
  SetupWizardPayload,
  SocietyItem,
  SocietyStructureType,
  SetupWizardBungalowConfig,
  SetupWizardOwnerMapping,
} from '../../types';
import { useToast } from '../../hooks/useToast';
import { AppRoutes } from '../../constants/routes';
import Button from '../../components/ui/Button';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Layers,
  Grid,
  Home,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Step1SocietyInfo } from './wizard/Step1SocietyInfo';
import { Step2BlocksConfig } from './wizard/Step2BlocksConfig';
import { Step3FloorsConfig } from './wizard/Step3FloorsConfig';
import { Step4UnitSeries } from './wizard/Step4UnitSeries';
import { WizardSuccessModal } from './wizard/WizardSuccessModal';
import { extractErrorMessage } from '../../utils/errorExtractor';

const STEPS = [
  { id: 1, title: 'Society Info & Type', desc: 'Architecture, location & contact', icon: Building2 },
  { id: 2, title: 'Property Layout', desc: 'Blocks, towers & villas', icon: Layers },
  { id: 3, title: 'Floors & Shops', desc: 'Floor counts & retail stores', icon: Grid },
  { id: 4, title: 'Unit Matrix & Owners', desc: 'Live preview & bulk mapping', icon: Home },
];

export const SocietySetupWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSociety, setCreatedSociety] = useState<SocietyItem | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const [structureType, setStructureType] = useState<SocietyStructureType>('flats');
  const [bungalowsConfig, setBungalowsConfig] = useState<SetupWizardBungalowConfig>({
    prefix: 'Villa-',
    count: 20,
    starting_number: 1,
    bungalow_type: '3 BHK Duplex Villa',
  });
  const [mappedOwners, setMappedOwners] = useState<SetupWizardOwnerMapping[]>([]);

  const [formData, setFormData] = useState<SetupWizardPayload>({
    structure_type: 'flats',
    society: {
      name: '',
      code: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      latitude: undefined,
      longitude: undefined,
      contact_name: '',
      contact_phone: '',
      contact_email: '',
      status: 'active',
    },
    blocks: [
      {
        name: 'Block A',
        code: 'A',
        floors_count: 5,
        has_commercial_shops: false,
        commercial_shops_count: 0,
        flats_per_floor: 4,
        series_start: 101,
        flat_type: '2 BHK',
      },
      {
        name: 'Block B',
        code: 'B',
        floors_count: 5,
        has_commercial_shops: false,
        commercial_shops_count: 0,
        flats_per_floor: 4,
        series_start: 101,
        flat_type: '2 BHK',
      },
    ],
    enable_bungalows: false,
    bungalows_count: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.society.name.trim()) errs.name = 'Society name is required';
    if (!formData.society.address_line1?.trim()) errs.address_line1 = 'Address line 1 is required';
    if (!formData.society.city?.trim()) errs.city = 'City is required';
    if (!formData.society.state?.trim()) errs.state = 'State is required';

    if (formData.society.contact_email && !/\S+@\S+\.\S+/.test(formData.society.contact_email)) {
      errs.contact_email = 'Invalid email address format';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      toast.error('Please fill in all required fields before proceeding.');
      return;
    }
    setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateStep1()) {
      setCurrentStep(1);
      toast.error('Please complete all required fields in Step 1.');
      return;
    }

    try {
      setIsSubmitting(true);
      const submissionPayload: SetupWizardPayload = {
        ...formData,
        structure_type: structureType,
        bungalows_config: bungalowsConfig,
        enable_bungalows: structureType === 'bungalows' || structureType === 'hybrid',
        bungalows_count: bungalowsConfig.count,
        mapped_owners: mappedOwners,
      };

      const res = await societiesService.setupWizard(submissionPayload);

      if (res.success && res.data) {
        setCreatedSociety(res.data);
        setIsSuccessModalOpen(true);
        toast.success(`Society "${res.data.name}" and property hierarchy onboarded successfully!`);
      } else {
        toast.error(res.message || 'Failed to complete society setup.');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to complete society setup wizard.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate summary counts for modal
  const isFlats = structureType === 'flats' || structureType === 'hybrid';
  const isBungalows = structureType === 'bungalows' || structureType === 'hybrid';

  let totalResidentialFlats = 0;
  let totalCommercialShops = 0;
  let totalFloorsCount = 0;

  if (isFlats && formData.blocks) {
    formData.blocks.forEach((b) => {
      totalFloorsCount += b.floors_count || 1;
      totalResidentialFlats += (b.floors_count || 1) * (b.flats_per_floor || 4);
      if (b.has_commercial_shops) totalCommercialShops += (b.commercial_shops_count || 0);
    });
  }

  const totalBungalowsCount = isBungalows ? bungalowsConfig.count || 20 : 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(AppRoutes.SOCIETIES)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Societies
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                Society Setup Wizard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 capitalize">
                {structureType} Architecture
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Build your housing society architecture, configure unit numbering, and map owners in 4 easy steps.
            </p>
          </div>
        </div>
      </div>

      {/* Stepper Progress Indicator */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id < currentStep) setCurrentStep(step.id);
                  else if (step.id > currentStep && validateStep1()) setCurrentStep(step.id);
                }}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                  isCurrent
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
                    : 'border-slate-200 bg-slate-50/50 opacity-60 hover:opacity-80'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Step {step.id}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 truncate">{step.title}</h4>
                  <p className="text-[11px] text-slate-500 truncate hidden sm:block">{step.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs min-h-[400px]">
        {currentStep === 1 && (
          <Step1SocietyInfo
            formData={formData.society}
            structureType={structureType}
            onChange={(fields) =>
              setFormData((prev) => ({
                ...prev,
                society: { ...prev.society, ...fields },
              }))
            }
            onStructureTypeChange={(type) => {
              setStructureType(type);
              setFormData((prev) => ({
                ...prev,
                structure_type: type,
                enable_bungalows: type === 'bungalows' || type === 'hybrid',
              }));
            }}
            errors={errors}
          />
        )}

        {currentStep === 2 && (
          <Step2BlocksConfig
            structureType={structureType}
            blocks={formData.blocks || []}
            bungalowsConfig={bungalowsConfig}
            enableBungalows={structureType === 'bungalows' || structureType === 'hybrid'}
            onBlocksChange={(blocks) => setFormData((prev) => ({ ...prev, blocks }))}
            onBungalowsConfigChange={setBungalowsConfig}
            onBungalowsChange={(enable_bungalows, bungalows_count) =>
              setFormData((prev) => ({ ...prev, enable_bungalows, bungalows_count }))
            }
          />
        )}

        {currentStep === 3 && (
          <Step3FloorsConfig
            structureType={structureType}
            blocks={formData.blocks || []}
            bungalowsConfig={bungalowsConfig}
            onBlocksChange={(blocks) => setFormData((prev) => ({ ...prev, blocks }))}
            onBungalowsConfigChange={setBungalowsConfig}
          />
        )}

        {currentStep === 4 && (
          <Step4UnitSeries
            structureType={structureType}
            societyName={formData.society.name}
            blocks={formData.blocks || []}
            bungalowsConfig={bungalowsConfig}
            enableBungalows={structureType === 'bungalows' || structureType === 'hybrid'}
            mappedOwners={mappedOwners}
            onBlocksChange={(blocks) => setFormData((prev) => ({ ...prev, blocks }))}
            onMappedOwnersChange={setMappedOwners}
          />
        )}
      </div>

      {/* Stepper Navigation Actions */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1 || isSubmitting}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Previous Step
        </Button>

        <div className="flex items-center gap-2">
          {currentStep < STEPS.length ? (
            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue to Step {currentStep + 1}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              leftIcon={
                isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )
              }
            >
              {isSubmitting ? 'Onboarding Society & Creating Hierarchy...' : 'Complete & Onboard Society'}
            </Button>
          )}
        </div>
      </div>

      {/* Celebration Modal upon Creation */}
      <WizardSuccessModal
        isOpen={isSuccessModalOpen}
        society={createdSociety}
        summaryData={{
          totalBlocks: isFlats ? (formData.blocks?.length || 0) : 0,
          totalFloors: totalFloorsCount,
          totalFlats: totalResidentialFlats,
          totalShops: totalCommercialShops,
          totalBungalows: totalBungalowsCount,
        }}
        onClose={() => setIsSuccessModalOpen(false)}
      />
    </div>
  );
};

export default SocietySetupWizardPage;
