import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Switch from '../../../components/ui/Switch';
import { Grid, Store, Copy, Sparkles, Home, CheckCircle2 } from 'lucide-react';
import { SetupWizardBlockConfig, SetupWizardBungalowConfig, SocietyStructureType } from '../../../types';

interface Step3FloorsConfigProps {
  structureType: SocietyStructureType;
  blocks: SetupWizardBlockConfig[];
  bungalowsConfig: SetupWizardBungalowConfig;
  errors?: Record<string, string>;
  onBlocksChange: (blocks: SetupWizardBlockConfig[]) => void;
  onBungalowsConfigChange: (cfg: SetupWizardBungalowConfig) => void;
}

export const Step3FloorsConfig: React.FC<Step3FloorsConfigProps> = ({
  structureType,
  blocks,
  bungalowsConfig,
  errors = {},
  onBlocksChange,
  onBungalowsConfigChange,
}) => {
  const [globalFloorCount, setGlobalFloorCount] = useState(5);
  const isBungalowOnly = structureType === 'bungalows';

  const handleUpdateBlock = (index: number, fields: Partial<SetupWizardBlockConfig>) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], ...fields };
    onBlocksChange(updated);
  };

  const handleApplyFloorCountToAll = () => {
    const safeCount = Math.max(1, Math.min(100, globalFloorCount));
    const updated = blocks.map((b) => ({
      ...b,
      floors_count: safeCount,
    }));
    onBlocksChange(updated);
  };

  if (isBungalowOnly) {
    const prefix = bungalowsConfig.prefix || 'Villa-';
    const count = bungalowsConfig.count || 20;
    const startNum = bungalowsConfig.starting_number || 1;
    const bType = bungalowsConfig.bungalow_type || '3 BHK Villa';

    return (
      <div className="space-y-3.5 animate-fadeIn">
        <Card
          title={
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900">
              <Home className="w-4 h-4 text-amber-600" />
              <span>Bungalows & Villa Enclave Review</span>
            </div>
          }
          subtitle="Review and confirm the villa property allocations before setting up the unit matrix."
        >
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                <span className="text-[11px] text-amber-800 font-semibold block">Total Standalone Units</span>
                <span className="text-xl font-black text-amber-950 mt-0.5 block">{count} Villas</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                <span className="text-[11px] text-amber-800 font-semibold block">Naming Range</span>
                <span className="text-base font-bold text-amber-950 mt-0.5 block">
                  {prefix}{startNum} &rarr; {prefix}{startNum + count - 1}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-amber-100">
                <span className="text-[11px] text-amber-800 font-semibold block">Property Specification</span>
                <span className="text-xs font-bold text-amber-950 mt-0.5 block truncate">{bType}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-[11px] text-slate-600">
                Since this society consists exclusively of standalone bungalows, multi-floor specifications are bypassed. You can proceed directly to the Unit Matrix and Owner Mapping.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 animate-fadeIn">
      {/* Global Quick Actions */}
      <div className="p-3 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 border border-indigo-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Bulk Floor Setup</h4>
            <p className="text-[11px] text-slate-600">Quickly apply standard floor heights across all blocks.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Floors:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={globalFloorCount}
              onChange={(e) => setGlobalFloorCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-14 px-2 py-1 text-xs text-center font-bold border border-slate-300 rounded-md bg-white"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyFloorCountToAll}
            leftIcon={<Copy className="w-3.5 h-3.5" />}
          >
            Apply to All
          </Button>
        </div>
      </div>

      {/* General Step 3 Errors */}
      {errors.floors && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
          {errors.floors}
        </div>
      )}

      {/* Per Block Configuration Cards */}
      <Card
        title={
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-900">
            <Grid className="w-4 h-4 text-indigo-600" />
            <span>Floors & Commercial Shops Configuration</span>
          </div>
        }
        subtitle="Configure the number of residential floors and ground floor retail/commercial spaces for each block."
      >
        <div className="space-y-3">
          {blocks.map((block, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-lg border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {block.code || block.name.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{block.name}</h4>
                    <span className="text-[11px] text-slate-400">
                      Code: {block.code || 'N/A'} &bull; {block.floors_count} Residential Floors
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">
                      Total Floors: <span className="text-rose-500">*</span>
                    </span>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md border border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(idx, { floors_count: Math.max(1, block.floors_count - 1) })}
                        className="w-6 h-6 bg-white rounded text-slate-700 font-bold hover:bg-slate-50 flex items-center justify-center text-xs shadow-xs"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={block.floors_count}
                        onChange={(e) =>
                          handleUpdateBlock(idx, {
                            floors_count: Math.max(1, Math.min(100, parseInt(e.target.value) || 1)),
                          })
                        }
                        className="w-10 text-center text-xs font-bold text-slate-900 bg-transparent border-0 focus:ring-0 p-0"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateBlock(idx, { floors_count: Math.min(100, block.floors_count + 1) })}
                        className="w-6 h-6 bg-white rounded text-slate-700 font-bold hover:bg-slate-50 flex items-center justify-center text-xs shadow-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  {errors[`block_${idx}_floors`] && (
                    <p className="text-[11px] text-rose-600">{errors[`block_${idx}_floors`]}</p>
                  )}
                </div>
              </div>

              {/* Commercial Shops Section for this Block */}
              <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Ground Floor Commercial Shops
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Has retail shops/commercial units on ground floor?
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-0.5">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={block.has_commercial_shops || false}
                      onChange={(val) =>
                        handleUpdateBlock(idx, {
                          has_commercial_shops: val,
                          commercial_shops_count: val ? (block.commercial_shops_count || 4) : 0,
                        })
                      }
                      aria-label={`Toggle Commercial Shops for ${block.name}`}
                    />

                    {block.has_commercial_shops && (
                      <div className="flex items-center gap-1.5 animate-fadeIn">
                        <span className="text-xs text-slate-500">
                          Shops: <span className="text-rose-500">*</span>
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={block.commercial_shops_count || 4}
                          onChange={(e) =>
                            handleUpdateBlock(idx, {
                              commercial_shops_count: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)),
                            })
                          }
                          className="w-14 px-2 py-1 text-xs text-center font-bold border border-slate-300 rounded-md bg-white"
                        />
                      </div>
                    )}
                  </div>
                  {errors[`block_${idx}_shops`] && (
                    <p className="text-[11px] text-rose-600">{errors[`block_${idx}_shops`]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
