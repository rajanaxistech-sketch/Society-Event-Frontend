import React from 'react';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import Switch from '../../../components/ui/Switch';
import { Layers, Plus, Trash2, Home, Sparkles, Building, Eye } from 'lucide-react';
import { SetupWizardBlockConfig, SetupWizardBungalowConfig, SocietyStructureType } from '../../../types';

interface Step2BlocksConfigProps {
  structureType: SocietyStructureType;
  blocks: SetupWizardBlockConfig[];
  bungalowsConfig: SetupWizardBungalowConfig;
  enableBungalows: boolean;
  onBlocksChange: (blocks: SetupWizardBlockConfig[]) => void;
  onBungalowsConfigChange: (cfg: SetupWizardBungalowConfig) => void;
  onBungalowsChange: (enabled: boolean, count: number) => void;
}

const BLOCK_PRESETS = [
  { label: 'Block A, B, C...', prefix: 'Block ' },
  { label: 'Tower 1, 2, 3...', prefix: 'Tower ' },
  { label: 'Wing A, B, C...', prefix: 'Wing ' },
  { label: 'Building 1, 2, 3...', prefix: 'Building ' },
  { label: 'Phase 1, 2...', prefix: 'Phase ' },
];

const BUNGALOW_PREFIX_PRESETS = ['Villa-', 'Plot-', 'B-', 'RowHouse-', 'House-', 'V-'];
const BUNGALOW_TYPES = [
  '3 BHK Duplex Villa',
  '4 BHK Luxury Villa',
  '5 BHK Grand Villa',
  '2 BHK Row House',
  '3 BHK Row House',
  'Residential Plot',
];

export const Step2BlocksConfig: React.FC<Step2BlocksConfigProps> = ({
  structureType,
  blocks,
  bungalowsConfig,
  enableBungalows,
  onBlocksChange,
  onBungalowsConfigChange,
  onBungalowsChange,
}) => {
  const isBungalowOnly = structureType === 'bungalows';
  const isHybrid = structureType === 'hybrid';

  // Apply Block Naming Preset
  const handleApplyBlockPreset = (prefix: string) => {
    const updated = blocks.map((b, idx) => {
      let suffix: string;
      if (prefix.includes('1') || prefix.includes('Building') || prefix.includes('Tower') || prefix.includes('Phase')) {
        suffix = `${idx + 1}`;
      } else {
        suffix = String.fromCharCode(65 + idx); // A, B, C...
      }
      const name = `${prefix.trim()} ${suffix}`.trim();
      return {
        ...b,
        name,
        code: suffix.toUpperCase(),
      };
    });
    onBlocksChange(updated);
  };

  const handleAddBlock = () => {
    const nextIdx = blocks.length;
    const suffix = String.fromCharCode(65 + nextIdx);
    const newBlock: SetupWizardBlockConfig = {
      name: `Block ${suffix}`,
      code: suffix,
      floors_count: 5,
      has_commercial_shops: false,
      commercial_shops_count: 0,
      flats_per_floor: 4,
      series_start: 101,
      flat_type: '2 BHK',
    };
    onBlocksChange([...blocks, newBlock]);
  };

  const handleRemoveBlock = (index: number) => {
    if (blocks.length <= 1) return;
    const updated = blocks.filter((_, idx) => idx !== index);
    onBlocksChange(updated);
  };

  const handleUpdateBlock = (index: number, fields: Partial<SetupWizardBlockConfig>) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], ...fields };
    onBlocksChange(updated);
  };

  const handleSetBlockCount = (count: number) => {
    const validCount = Math.max(1, Math.min(20, count));
    if (validCount === blocks.length) return;

    if (validCount > blocks.length) {
      const added: SetupWizardBlockConfig[] = [];
      for (let i = blocks.length; i < validCount; i++) {
        const suffix = String.fromCharCode(65 + i);
        added.push({
          name: `Block ${suffix}`,
          code: suffix,
          floors_count: 5,
          has_commercial_shops: false,
          commercial_shops_count: 0,
          flats_per_floor: 4,
          series_start: 101,
          flat_type: '2 BHK',
        });
      }
      onBlocksChange([...blocks, ...added]);
    } else {
      onBlocksChange(blocks.slice(0, validCount));
    }
  };

  // Bungalow-Only Setup Screen
  if (isBungalowOnly) {
    const prefix = bungalowsConfig.prefix || 'Villa-';
    const count = bungalowsConfig.count || 20;
    const startNum = bungalowsConfig.starting_number || 1;
    const bType = bungalowsConfig.bungalow_type || '3 BHK Duplex Villa';

    return (
      <div className="space-y-6 animate-fadeIn">
        <Card
          title={
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-slate-900">Bungalows / Villas Community Setup</span>
            </div>
          }
          subtitle="Configure the naming conventions, count, and property types for your standalone villas."
        >
          <div className="space-y-6">
            {/* Bungalow Prefix Presets */}
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-2">
                Bungalow / Plot Prefix Format:
              </span>
              <div className="flex flex-wrap gap-2 mb-3">
                {BUNGALOW_PREFIX_PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onBungalowsConfigChange({ ...bungalowsConfig, prefix: p })}
                    className={`px-3 py-1.5 text-xs rounded-xl font-bold border transition-all ${
                      prefix === p
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-amber-50 hover:border-amber-300 border-slate-200'
                    }`}
                  >
                    {p} (e.g. {p}1)
                  </button>
                ))}
              </div>
              <div className="max-w-xs">
                <Input
                  label="Custom Prefix (Optional)"
                  placeholder="e.g. Villa- or RowHouse-"
                  value={prefix}
                  onChange={(e) => onBungalowsConfigChange({ ...bungalowsConfig, prefix: e.target.value })}
                />
              </div>
            </div>

            {/* Total Count & Starting Number */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Total Bungalows / Villas Count
                </label>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() =>
                      onBungalowsConfigChange({
                        ...bungalowsConfig,
                        count: Math.max(1, count - 5),
                      })
                    }
                    className="w-8 h-8 rounded-lg bg-white font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shadow-xs"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={count}
                    onChange={(e) =>
                      onBungalowsConfigChange({
                        ...bungalowsConfig,
                        count: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="flex-1 text-center font-bold text-slate-900 bg-transparent text-sm border-0 focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onBungalowsConfigChange({
                        ...bungalowsConfig,
                        count: Math.min(500, count + 5),
                      })
                    }
                    className="w-8 h-8 rounded-lg bg-white font-bold text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-xs shadow-xs"
                  >
                    +5
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Starting Number Index
                </label>
                <select
                  value={startNum}
                  onChange={(e) =>
                    onBungalowsConfigChange({
                      ...bungalowsConfig,
                      starting_number: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  <option value={1}>Start from 1 ({prefix}1 .. {prefix}{count})</option>
                  <option value={101}>Start from 101 ({prefix}101 .. {prefix}{100 + count})</option>
                  <option value={1001}>Start from 1001 ({prefix}1001 .. {prefix}{1000 + count})</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Default Villa Property Type
                </label>
                <select
                  value={bType}
                  onChange={(e) =>
                    onBungalowsConfigChange({
                      ...bungalowsConfig,
                      bungalow_type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl bg-white text-slate-800 focus:ring-2 focus:ring-amber-500"
                >
                  {BUNGALOW_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Visual Preview of Generated Bungalow Names */}
            <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Generated Bungalow Units Preview ({count} Villas)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                {Array.from({ length: Math.min(count, 40) }).map((_, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs"
                  >
                    {prefix}{startNum + idx}
                  </span>
                ))}
                {count > 40 && (
                  <span className="px-2.5 py-1 text-xs font-bold text-amber-700 self-center">
                    + {count - 40} more villas...
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Flats / Hybrid Setup Screen
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Quick Setup & Presets Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-900">1. Apartment Blocks / Towers Configuration</span>
          </div>
        }
        subtitle="Define the residential wings, buildings, or towers inside this society."
      >
        <div className="space-y-4">
          {/* Quick Count Stepper & Presets */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#EEF2FF]/60 rounded-2xl border border-indigo-100 shadow-2xs">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Total Apartment Blocks: <strong className="text-[#6366F1] text-sm">{blocks.length}</strong>
              </span>
              <span className="text-xs text-slate-500">Quickly adjust the number of blocks.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSetBlockCount(blocks.length - 1)}
                disabled={blocks.length <= 1}
                className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] text-slate-700 font-bold hover:bg-[#EEF2FF] hover:text-[#6366F1] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-2xs"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-slate-900">{blocks.length}</span>
              <button
                type="button"
                onClick={() => handleSetBlockCount(blocks.length + 1)}
                disabled={blocks.length >= 20}
                className="w-8 h-8 rounded-xl bg-white border border-[#E2E8F0] text-slate-700 font-bold hover:bg-[#EEF2FF] hover:text-[#6366F1] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-2xs"
              >
                +
              </button>
            </div>
          </div>

          {/* Naming Presets */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-slate-600">Quick Naming Presets:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BLOCK_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyBlockPreset(p.prefix)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white hover:bg-[#EEF2FF] hover:border-indigo-300 hover:text-[#6366F1] text-slate-700 font-medium border border-[#E2E8F0] transition-all shadow-2xs"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Block Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {blocks.map((block, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-[#E2E8F0] bg-white hover:border-indigo-300 hover:shadow-card transition-all duration-200 relative group shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <span className="text-xs font-bold text-slate-800">Block Configuration</span>
                  </div>
                  {blocks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveBlock(idx)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1 rounded-lg hover:bg-rose-50"
                      title="Remove this block"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="space-y-2.5">
                  <Input
                    label="Block Display Name"
                    placeholder="e.g. Block A / Wing B"
                    value={block.name}
                    onChange={(e) => handleUpdateBlock(idx, { name: e.target.value })}
                  />
                  <Input
                    label="Block Code / Prefix"
                    placeholder="e.g. A"
                    value={block.code || ''}
                    onChange={(e) => handleUpdateBlock(idx, { code: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddBlock}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Add Another Block
            </Button>
          </div>
        </div>
      </Card>

      {/* Bungalows Section for Hybrid / Optional */}
      {isHybrid && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-slate-900">2. Hybrid Community: Bungalows / Villas Enclave</span>
            </div>
          }
          subtitle="Configure standalone villas alongside apartment towers."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Bungalow Prefix"
              value={bungalowsConfig.prefix || 'Villa-'}
              onChange={(e) => onBungalowsConfigChange({ ...bungalowsConfig, prefix: e.target.value })}
            />
            <Input
              label="Total Villas Count"
              type="number"
              min={1}
              max={200}
              value={bungalowsConfig.count || 20}
              onChange={(e) =>
                onBungalowsConfigChange({
                  ...bungalowsConfig,
                  count: Math.max(1, parseInt(e.target.value) || 1),
                })
              }
            />
            <Input
              label="Starting Number"
              type="number"
              value={bungalowsConfig.starting_number || 1}
              onChange={(e) =>
                onBungalowsConfigChange({
                  ...bungalowsConfig,
                  starting_number: parseInt(e.target.value) || 1,
                })
              }
            />
          </div>
        </Card>
      )}
    </div>
  );
};
