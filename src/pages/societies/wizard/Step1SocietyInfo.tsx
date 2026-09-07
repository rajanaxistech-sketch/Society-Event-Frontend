import React from 'react';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Building2, MapPin, Navigation, UserCheck, Home, Layers, CheckCircle2 } from 'lucide-react';
import { SetupWizardPayload, SocietyStructureType } from '../../../types';

interface Step1SocietyInfoProps {
  formData: SetupWizardPayload['society'];
  structureType: SocietyStructureType;
  onChange: (data: Partial<SetupWizardPayload['society']>) => void;
  onStructureTypeChange: (type: SocietyStructureType) => void;
  errors: Record<string, string>;
}

const CITY_PRESETS = [
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Delhi NCR', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867 },
];

export const Step1SocietyInfo: React.FC<Step1SocietyInfoProps> = ({
  formData,
  structureType,
  onChange,
  onStructureTypeChange,
  errors,
}) => {
  const handleAutoCode = (name: string) => {
    if (!formData.code || formData.code.trim() === '') {
      const generated = name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4) + '-01';
      onChange({ code: generated });
    }
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onChange({
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
          });
        },
        (err) => {
          console.warn('Geolocation denied or unavailable:', err);
        }
      );
    }
  };

  const handleApplyPreset = (preset: typeof CITY_PRESETS[0]) => {
    onChange({
      city: preset.city,
      state: preset.state,
      latitude: preset.lat,
      longitude: preset.lng,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Structure Type Selection Radio Cards */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">1. Society Property Type / Architecture</span>
          </div>
        }
        subtitle="Select the architectural structure of this society to customize the setup workflow."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Option 1: Flats / Apartments */}
          <button
            type="button"
            onClick={() => onStructureTypeChange('flats')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
              structureType === 'flats'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50/50'
            }`}
          >
            {structureType === 'flats' && (
              <div className="absolute top-3 right-3 text-indigo-600">
                <CheckCircle2 className="w-5 h-5 fill-indigo-600 text-white" />
              </div>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mb-3 shadow-2xs">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Flats / Apartments</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Multi-story residential towers with Blocks &rarr; Floors &rarr; Flats + optional Ground Floor Shops.
              </p>
            </div>
            <span className="text-[11px] font-bold text-indigo-600 mt-3 block">
              Multi-Floor Towers &bull; 101/102 Series
            </span>
          </button>

          {/* Option 2: Bungalows / Villas */}
          <button
            type="button"
            onClick={() => onStructureTypeChange('bungalows')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
              structureType === 'bungalows'
                ? 'border-amber-600 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-slate-50/50'
            }`}
          >
            {structureType === 'bungalows' && (
              <div className="absolute top-3 right-3 text-amber-600">
                <CheckCircle2 className="w-5 h-5 fill-amber-600 text-white" />
              </div>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold mb-3 shadow-2xs">
                <Home className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Bungalows / Villas</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Independent row houses, standalone bungalows, villas, or residential plots without floors.
              </p>
            </div>
            <span className="text-[11px] font-bold text-amber-600 mt-3 block">
              Villa-1..Villa-50 &bull; Plot-101..150
            </span>
          </button>

          {/* Option 3: Hybrid Community */}
          <button
            type="button"
            onClick={() => onStructureTypeChange('hybrid')}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
              structureType === 'hybrid'
                ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-2 ring-purple-500/20'
                : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50/50'
            }`}
          >
            {structureType === 'hybrid' && (
              <div className="absolute top-3 right-3 text-purple-600">
                <CheckCircle2 className="w-5 h-5 fill-purple-600 text-white" />
              </div>
            )}
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3 shadow-2xs">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-black text-slate-900">Hybrid Community</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Large gated township containing both multi-story apartment towers and standalone villa plots.
              </p>
            </div>
            <span className="text-[11px] font-bold text-purple-600 mt-3 block">
              Combined Towers + Villa Enclave
            </span>
          </button>
        </div>
      </Card>

      {/* Society Primary Information */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">2. Society Identity & Basic Profile</span>
          </div>
        }
        subtitle="Provide the registered name and unique shortcode for this housing society."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Society Name"
            placeholder="e.g. Palm Meadows Co-op Housing Society"
            value={formData.name || ''}
            onChange={(e) => {
              onChange({ name: e.target.value });
              handleAutoCode(e.target.value);
            }}
            error={errors.name}
            requiredIndicator
          />
          <Input
            label="Society Short Code"
            placeholder="e.g. PMCHS-01"
            value={formData.code || ''}
            onChange={(e) => onChange({ code: e.target.value.toUpperCase() })}
            helperText="Unique identifier used in unit numbers & receipt prefixes"
            error={errors.code}
          />
        </div>
      </Card>

      {/* Address & GPS Geolocation */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <span className="font-bold text-slate-900">3. Physical Address & GPS Coordinates</span>
          </div>
        }
        subtitle="Used for location-based services, resident directions, and security geo-fencing."
      >
        <div className="space-y-4">
          <Input
            label="Street Address / Landmark"
            placeholder="e.g. Near Hiranandani Gardens, Main Boulevard Road"
            value={formData.address_line1 || ''}
            onChange={(e) => onChange({ address_line1: e.target.value })}
            error={errors.address_line1}
            requiredIndicator
          />

          <Input
            label="Address Line 2 (Area / Locality)"
            placeholder="e.g. Sector 4, Powai"
            value={formData.address_line2 || ''}
            onChange={(e) => onChange({ address_line2: e.target.value })}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="City"
              placeholder="e.g. Mumbai"
              value={formData.city || ''}
              onChange={(e) => onChange({ city: e.target.value })}
              error={errors.city}
              requiredIndicator
            />
            <Input
              label="State"
              placeholder="e.g. Maharashtra"
              value={formData.state || ''}
              onChange={(e) => onChange({ state: e.target.value })}
              error={errors.state}
              requiredIndicator
            />
            <Input
              label="Pincode / Postal Code"
              placeholder="e.g. 400076"
              value={formData.postal_code || ''}
              onChange={(e) => onChange({ postal_code: e.target.value })}
              error={errors.postal_code}
            />
          </div>

          {/* GPS Coordinates with Quick Presets */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Geo Coordinates (Lat / Long)
                </span>
                <span className="text-xs text-slate-400">Accurate coordinates for society mapping.</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  leftIcon={<Navigation className="w-3.5 h-3.5 text-indigo-600" />}
                >
                  Locate Me
                </Button>
              </div>
            </div>

            {/* Quick City Presets */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="text-xs text-slate-400 mr-1">Quick Pin:</span>
              {CITY_PRESETS.map((p) => (
                <button
                  key={p.city}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 text-xs rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 font-medium transition-colors border border-slate-200"
                >
                  {p.city}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Latitude"
                placeholder="e.g. 19.076090"
                type="number"
                step="any"
                value={formData.latitude ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({ latitude: val === '' ? undefined : parseFloat(val) });
                }}
                error={errors.latitude}
              />
              <Input
                label="Longitude"
                placeholder="e.g. 72.877426"
                type="number"
                step="any"
                value={formData.longitude ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  onChange({ longitude: val === '' ? undefined : parseFloat(val) });
                }}
                error={errors.longitude}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Primary Management Contact */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">4. Primary Society Contact / Secretary</span>
          </div>
        }
        subtitle="Main administrative contact for urgent communications & onboarding."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Contact Person Name"
            placeholder="e.g. Rajesh Sharma"
            value={formData.contact_name || ''}
            onChange={(e) => onChange({ contact_name: e.target.value })}
            error={errors.contact_name}
          />
          <Input
            label="Contact Phone"
            placeholder="e.g. +91 98765 43210"
            value={formData.contact_phone || ''}
            onChange={(e) => onChange({ contact_phone: e.target.value })}
            error={errors.contact_phone}
          />
          <Input
            label="Contact Email"
            type="email"
            placeholder="e.g. secretary@palmmeadows.com"
            value={formData.contact_email || ''}
            onChange={(e) => onChange({ contact_email: e.target.value })}
            error={errors.contact_email}
          />
        </div>
      </Card>
    </div>
  );
};
