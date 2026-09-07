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
import {
  isValidEmail,
  isValidPhone,
  isValidLatitude,
  isValidLongitude,
  isValidPostalCode,
  isValidShortCode,
} from '../../utils/validators';

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
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
  const [step3Errors, setStep3Errors] = useState<Record<string, string>>({});

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Required Fields
    if (!formData.society.name || !formData.society.name.trim()) {
      errs.name = 'Society name is required';
    } else if (formData.society.name.trim().length < 2) {
      errs.name = 'Society name must be at least 2 characters';
    }

    if (!formData.society.address_line1 || !formData.society.address_line1.trim()) {
      errs.address_line1 = 'Street address / Address line 1 is required';
    } else if (formData.society.address_line1.trim().length < 3) {
      errs.address_line1 = 'Address must be at least 3 characters';
    }

    if (!formData.society.city || !formData.society.city.trim()) {
      errs.city = 'City is required';
    }

    if (!formData.society.state || !formData.society.state.trim()) {
      errs.state = 'State is required';
    }

    // 2. Optional Fields Formats
    if (formData.society.code && !isValidShortCode(formData.society.code)) {
      errs.code = 'Short code must be 2-20 alphanumeric characters / hyphens';
    }

    if (formData.society.postal_code && !isValidPostalCode(formData.society.postal_code)) {
      errs.postal_code = 'Invalid pincode/postal code format (3-10 characters)';
    }

    if (formData.society.latitude !== undefined && formData.society.latitude !== null && formData.society.latitude !== '') {
      if (!isValidLatitude(formData.society.latitude)) {
        errs.latitude = 'Latitude must be a valid number between -90 and 90';
      }
    }

    if (formData.society.longitude !== undefined && formData.society.longitude !== null && formData.society.longitude !== '') {
      if (!isValidLongitude(formData.society.longitude)) {
        errs.longitude = 'Longitude must be a valid number between -180 and 180';
      }
    }

    if (formData.society.contact_name && formData.society.contact_name.trim().length < 2) {
      errs.contact_name = 'Contact person name must be at least 2 characters';
    }

    if (formData.society.contact_phone && !isValidPhone(formData.society.contact_phone)) {
      errs.contact_phone = 'Invalid phone number format (7 to 15 digits required)';
    }

    if (formData.society.contact_email && !isValidEmail(formData.society.contact_email)) {
      errs.contact_email = 'Invalid email address format (e.g. contact@example.com)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    const isFlats = structureType === 'flats' || structureType === 'hybrid';
    const isBungalows = structureType === 'bungalows' || structureType === 'hybrid';

    if (isFlats) {
      if (!formData.blocks || formData.blocks.length === 0) {
        errs.blocks = 'At least one apartment block or tower must be added';
      } else {
        const codesSet = new Set<string>();
        formData.blocks.forEach((block, idx) => {
          if (!block.name || !block.name.trim()) {
            errs[`block_${idx}_name`] = 'Block name cannot be empty';
          }
          if (!block.code || !block.code.trim()) {
            errs[`block_${idx}_code`] = 'Block code cannot be empty';
          } else {
            const upperCode = block.code.trim().toUpperCase();
            if (codesSet.has(upperCode)) {
              errs[`block_${idx}_code`] = 'Block code must be unique';
            }
            codesSet.add(upperCode);
          }
        });
      }
    }

    if (isBungalows) {
      if (!bungalowsConfig.prefix || !bungalowsConfig.prefix.trim()) {
        errs.bungalows_prefix = 'Villa prefix pattern is required (e.g. Villa-)';
      }
      if (!bungalowsConfig.count || bungalowsConfig.count < 1 || bungalowsConfig.count > 500) {
        errs.bungalows_count = 'Total count must be between 1 and 500';
      }
      if (bungalowsConfig.starting_number === undefined || bungalowsConfig.starting_number < 1) {
        errs.bungalows_starting_number = 'Starting index must be 1 or higher';
      }
    }

    setStep2Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    const isFlats = structureType === 'flats' || structureType === 'hybrid';

    if (isFlats && formData.blocks) {
      formData.blocks.forEach((block, idx) => {
        if (!block.floors_count || block.floors_count < 1 || block.floors_count > 100) {
          errs[`block_${idx}_floors`] = 'Floors count must be between 1 and 100';
        }
        if (block.has_commercial_shops) {
          if (!block.commercial_shops_count || block.commercial_shops_count < 1 || block.commercial_shops_count > 50) {
            errs[`block_${idx}_shops`] = 'Commercial shops count must be between 1 and 50';
          }
        }
      });
    }

    setStep3Errors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateAllSteps = (): boolean => {
    if (!validateStep1()) {
      setCurrentStep(1);
      toast.error('Please fix the validation errors in Step 1.');
      return false;
    }
    if (!validateStep2()) {
      setCurrentStep(2);
      toast.error('Please fix the validation errors in Step 2.');
      return false;
    }
    if (!validateStep3()) {
      setCurrentStep(3);
      toast.error('Please fix the validation errors in Step 3.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) {
      toast.error('Please fill in all required fields in Step 1 correctly.');
      return;
    }
    if (currentStep === 2 && !validateStep2()) {
      toast.error('Please review and fix property layout configuration.');
      return;
    }
    if (currentStep === 3 && !validateStep3()) {
      toast.error('Please review and fix floor counts.');
      return;
    }
    setCurrentStep((prev) => Math.min(STEPS.length, prev + 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!validateAllSteps()) {
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
                  if (step.id < currentStep) {
                    setCurrentStep(step.id);
                  } else if (step.id > currentStep) {
                    if (currentStep === 1 && !validateStep1()) return;
                    if (currentStep === 2 && !validateStep2()) return;
                    if (currentStep === 3 && !validateStep3()) return;
                    setCurrentStep(step.id);
                  }
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
            onChange={(fields) => {
              setFormData((prev) => ({
                ...prev,
                society: { ...prev.society, ...fields },
              }));
              // Clear inline error when field is modified
              const fieldKey = Object.keys(fields)[0];
              if (fieldKey && errors[fieldKey]) {
                setErrors((prev) => {
                  const copy = { ...prev };
                  delete copy[fieldKey];
                  return copy;
                });
              }
            }}
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
            errors={step2Errors}
            onBlocksChange={(blocks) => {
              setFormData((prev) => ({ ...prev, blocks }));
              setStep2Errors({});
            }}
            onBungalowsConfigChange={(cfg) => {
              setBungalowsConfig(cfg);
              setStep2Errors({});
            }}
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
            errors={step3Errors}
            onBlocksChange={(blocks) => {
              setFormData((prev) => ({ ...prev, blocks }));
              setStep3Errors({});
            }}
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
