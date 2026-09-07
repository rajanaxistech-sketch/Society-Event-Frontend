import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import {
  Home,
  Eye,
  Store,
  Sparkles,
  Building,
  Layers,
  CheckCircle2,
  Download,
  UploadCloud,
  UserPlus,
  Users,
  CheckSquare,
  Square,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  SetupWizardBlockConfig,
  SetupWizardBungalowConfig,
  SetupWizardOwnerMapping,
  SocietyStructureType,
} from '../../../types';
import { useToast } from '../../../hooks/useToast';
import { isValidEmail, isValidPhone } from '../../../utils/validators';

interface Step4UnitSeriesProps {
  structureType: SocietyStructureType;
  societyName: string;
  blocks: SetupWizardBlockConfig[];
  bungalowsConfig: SetupWizardBungalowConfig;
  enableBungalows: boolean;
  mappedOwners: SetupWizardOwnerMapping[];
  onBlocksChange: (blocks: SetupWizardBlockConfig[]) => void;
  onMappedOwnersChange: (owners: SetupWizardOwnerMapping[]) => void;
}

const FLAT_TYPES = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Studio', 'Penthouse'];

export const Step4UnitSeries: React.FC<Step4UnitSeriesProps> = ({
  structureType,
  societyName,
  blocks,
  bungalowsConfig,
  enableBungalows,
  mappedOwners,
  onBlocksChange,
  onMappedOwnersChange,
}) => {
  const toast = useToast();
  const isBungalowOnly = structureType === 'bungalows';
  const isHybrid = structureType === 'hybrid';
  const hasFlats = structureType === 'flats' || structureType === 'hybrid';

  const [selectedBlockIdx, setSelectedBlockIdx] = useState(0);
  const activeBlock = hasFlats ? blocks[selectedBlockIdx] || blocks[0] : null;

  // Selected Unit Identifiers for Bulk Actions (Set of string IDs)
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);

  // Bulk Assign Owner Modal
  const [isBulkOwnerModalOpen, setIsBulkOwnerModalOpen] = useState(false);
  const [bulkOwnerName, setBulkOwnerName] = useState('');
  const [bulkOwnerPhone, setBulkOwnerPhone] = useState('');
  const [bulkOwnerEmail, setBulkOwnerEmail] = useState('');
  const [bulkRelationship, setBulkRelationship] = useState('Primary Owner');
  const [modalErrors, setModalErrors] = useState<Record<string, string>>({});

  const handleUpdateBlock = (index: number, fields: Partial<SetupWizardBlockConfig>) => {
    const updated = [...blocks];
    updated[index] = { ...updated[index], ...fields };
    onBlocksChange(updated);
  };

  const handleApplySeriesToAll = (seriesStart: number, flatsPerFloor: number, flatType: string) => {
    const updated = blocks.map((b) => ({
      ...b,
      series_start: seriesStart,
      flats_per_floor: flatsPerFloor,
      flat_type: flatType,
    }));
    onBlocksChange(updated);
  };

  // Generate All Units List for CSV & Matrix Mapping
  interface GeneratedUnit {
    id: string; // identifier, e.g. "Block A-101" or "Villa-1"
    unitNumber: string;
    blockName?: string;
    floorNumber?: number;
    unitType: string;
    isShop?: boolean;
    isBungalow?: boolean;
  }

  const allGeneratedUnits: GeneratedUnit[] = [];

  if (hasFlats) {
    blocks.forEach((block) => {
      const is4Digit = (block.series_start || 101) >= 1000;
      const totalFloors = block.floors_count || 1;
      const flatsPerFloor = block.flats_per_floor || 4;

      // Commercial Shops
      if (block.has_commercial_shops && (block.commercial_shops_count || 0) > 0) {
        for (let s = 1; s <= (block.commercial_shops_count || 0); s++) {
          const shopNo = `Shop-${s}`;
          allGeneratedUnits.push({
            id: `${block.name}-${shopNo}`,
            unitNumber: shopNo,
            blockName: block.name,
            floorNumber: 0,
            unitType: 'Commercial Shop',
            isShop: true,
          });
        }
      }

      // Residential Flats
      for (let f = 1; f <= totalFloors; f++) {
        for (let u = 1; u <= flatsPerFloor; u++) {
          const flatNo = is4Digit ? `${f * 1000 + u}` : `${f * 100 + u}`;
          allGeneratedUnits.push({
            id: `${block.name}-${flatNo}`,
            unitNumber: flatNo,
            blockName: block.name,
            floorNumber: f,
            unitType: block.flat_type || '2 BHK',
          });
        }
      }
    });
  }

  if (isBungalowOnly || isHybrid || enableBungalows) {
    const bCount = bungalowsConfig.count || 20;
    const bPrefix = bungalowsConfig.prefix || 'Villa-';
    const bStart = bungalowsConfig.starting_number || 1;
    const bType = bungalowsConfig.bungalow_type || 'Independent Villa';

    for (let b = 0; b < bCount; b++) {
      const villaNo = `${bPrefix}${bStart + b}`;
      allGeneratedUnits.push({
        id: villaNo,
        unitNumber: villaNo,
        blockName: 'Bungalow Area',
        unitType: bType,
        isBungalow: true,
      });
    }
  }

  // Quick lookup map of mapped owners
  const ownersByIdentifier: Record<string, SetupWizardOwnerMapping> = {};
  mappedOwners.forEach((o) => {
    ownersByIdentifier[o.unit_identifier] = o;
    ownersByIdentifier[o.unit_number] = o;
  });

  // Toggle unit selection
  const handleToggleSelectUnit = (unitId: string) => {
    if (selectedUnitIds.includes(unitId)) {
      setSelectedUnitIds(selectedUnitIds.filter((id) => id !== unitId));
    } else {
      setSelectedUnitIds([...selectedUnitIds, unitId]);
    }
  };

  const handleSelectAll = () => {
    setSelectedUnitIds(allGeneratedUnits.map((u) => u.id));
  };

  const handleDeselectAll = () => {
    setSelectedUnitIds([]);
  };

  const handleSelectCurrentBlock = () => {
    if (!activeBlock) return;
    const currentBlockUnitIds = allGeneratedUnits
      .filter((u) => u.blockName === activeBlock.name)
      .map((u) => u.id);
    setSelectedUnitIds(Array.from(new Set([...selectedUnitIds, ...currentBlockUnitIds])));
  };

  // Bulk Assign Owner Execution with full field validation
  const handleExecuteBulkAssign = () => {
    const errs: Record<string, string> = {};

    if (!bulkOwnerName.trim()) {
      errs.name = 'Owner Full Name is required';
    } else if (bulkOwnerName.trim().length < 2) {
      errs.name = 'Owner name must be at least 2 characters';
    }

    if (bulkOwnerPhone.trim() && !isValidPhone(bulkOwnerPhone)) {
      errs.phone = 'Invalid phone number (7 to 15 digits required)';
    }

    if (bulkOwnerEmail.trim() && !isValidEmail(bulkOwnerEmail)) {
      errs.email = 'Invalid email address format (e.g. name@domain.com)';
    }

    if (Object.keys(errs).length > 0) {
      setModalErrors(errs);
      return;
    }

    setModalErrors({});
    const updated = [...mappedOwners];
    selectedUnitIds.forEach((uId) => {
      const unitObj = allGeneratedUnits.find((u) => u.id === uId);
      const existingIdx = updated.findIndex((o) => o.unit_identifier === uId);
      const newMapping: SetupWizardOwnerMapping = {
        unit_identifier: uId,
        unit_number: unitObj?.unitNumber || uId,
        block_name: unitObj?.blockName,
        unit_type: unitObj?.unitType,
        full_name: bulkOwnerName.trim(),
        phone: bulkOwnerPhone.trim() || undefined,
        email: bulkOwnerEmail.trim() || undefined,
        relationship_to_owner: bulkRelationship,
        is_primary_owner: true,
      };

      if (existingIdx >= 0) {
        updated[existingIdx] = newMapping;
      } else {
        updated.push(newMapping);
      }
    });

    onMappedOwnersChange(updated);
    toast.success(`Owner "${bulkOwnerName}" assigned to ${selectedUnitIds.length} units.`);
    setIsBulkOwnerModalOpen(false);
    setBulkOwnerName('');
    setBulkOwnerPhone('');
    setBulkOwnerEmail('');
    setModalErrors({});
    setSelectedUnitIds([]);
  };

  // Download Sample CSV Pre-Filled with All Generated Units
  const handleDownloadSampleCSV = () => {
    let csv = `Unit Identifier,Block / Area,Unit Number,Unit Type,Owner Full Name,Phone,Email,Relationship,Is Primary Owner\n`;
    allGeneratedUnits.forEach((u) => {
      const owner = ownersByIdentifier[u.id] || ownersByIdentifier[u.unitNumber];
      csv += `"${u.id}","${u.blockName || ''}","${u.unitNumber}","${u.unitType}","${
        owner?.full_name || ''
      }","${owner?.phone || ''}","${owner?.email || ''}","${
        owner?.relationship_to_owner || 'Primary Owner'
      }","TRUE"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(societyName || 'Society').replace(/\s+/g, '_')}_Units_Sample_Template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Pre-filled sample CSV downloaded with all generated units.');
  };

  // Direct CSV Upload & Parser
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length <= 1) {
        toast.error('Uploaded CSV contains no records.');
        return;
      }

      const newMappedOwners: SetupWizardOwnerMapping[] = [];
      let formatWarningsCount = 0;

      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 5) {
          const [uIdentifier, blockName, uNumber, uType, ownerName, phone, email, relationship] = parts;
          if (ownerName && ownerName.length > 0) {
            const validPh = phone && isValidPhone(phone) ? phone : undefined;
            const validEm = email && isValidEmail(email) ? email : undefined;
            if ((phone && !validPh) || (email && !validEm)) {
              formatWarningsCount++;
            }

            newMappedOwners.push({
              unit_identifier: uIdentifier || `${blockName || ''}-${uNumber || ''}`.replace(/^-/, ''),
              unit_number: uNumber || uIdentifier,
              block_name: blockName || undefined,
              unit_type: uType || undefined,
              full_name: ownerName,
              phone: validPh,
              email: validEm,
              relationship_to_owner: relationship || 'Primary Owner',
              is_primary_owner: true,
            });
          }
        }
      }

      if (newMappedOwners.length > 0) {
        onMappedOwnersChange([...mappedOwners, ...newMappedOwners]);
        if (formatWarningsCount > 0) {
          toast.warning(
            `Mapped ${newMappedOwners.length} owners (${formatWarningsCount} records had invalid email/phone formatted and were omitted for safety).`
          );
        } else {
          toast.success(`Successfully mapped ${newMappedOwners.length} owners from CSV!`);
        }
      } else {
        toast.error('No valid owner names found in CSV.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };


  // Calculations
  const residentialUnitsCount = allGeneratedUnits.filter((u) => !u.isShop && !u.isBungalow).length;
  const shopsCount = allGeneratedUnits.filter((u) => u.isShop).length;
  const bungalowsCount = allGeneratedUnits.filter((u) => u.isBungalow).length;
  const mappedCount = Object.keys(ownersByIdentifier).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
          <span className="text-xs text-indigo-600 font-semibold block">Total Units</span>
          <span className="text-xl font-black text-indigo-950 mt-0.5 block">{allGeneratedUnits.length}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
          <span className="text-xs text-emerald-600 font-semibold block">Owners Mapped</span>
          <span className="text-xl font-black text-emerald-950 mt-0.5 block">
            {mappedCount} / {allGeneratedUnits.length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100">
          <span className="text-xs text-blue-600 font-semibold block">Flats & Shops</span>
          <span className="text-xl font-bold text-blue-950 mt-0.5 block">{residentialUnitsCount + shopsCount}</span>
        </div>
        <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100">
          <span className="text-xs text-amber-600 font-semibold block">Villas / Plots</span>
          <span className="text-xl font-bold text-amber-950 mt-0.5 block">{bungalowsCount}</span>
        </div>
      </div>

      {/* CSV Import & Sample Download Action Bar */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 rounded-2xl border border-emerald-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Direct CSV / Excel Owner Mapping</h4>
            <p className="text-[11px] text-slate-500">
              Download pre-filled CSV with unit numbers, fill resident names, and upload to auto-map.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadSampleCSV}
            leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Download Pre-Filled Sample CSV
          </Button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer transition-colors">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Completed CSV</span>
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Unit Numbering Presets (if Flats present) */}
      {hasFlats && activeBlock && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-indigo-600" />
              <span className="font-bold text-slate-900">Unit Numbering Pattern & Series</span>
            </div>
          }
          subtitle="Configure the flat numbering convention and units-per-floor for each block."
        >
          <div className="space-y-4">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-bold text-slate-700">Quick Uniform Presets:</span>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplySeriesToAll(101, 4, '2 BHK')}
                >
                  101-104 Series (4/Floor, 2BHK)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplySeriesToAll(1001, 4, '3 BHK')}
                >
                  1001-1004 Series (4/Floor, 3BHK)
                </Button>
              </div>
            </div>

            {/* Block Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
              {blocks.map((b, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedBlockIdx(idx)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedBlockIdx === idx
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Live Property Matrix & Multi-Select Header */}
      <Card
        title={
          <div className="flex items-center justify-between gap-3 flex-wrap w-full">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-slate-900">
                Interactive Unit Matrix & Owner Selection
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleSelectAll}>
                Select All ({allGeneratedUnits.length})
              </Button>
              {hasFlats && (
                <Button type="button" variant="outline" size="sm" onClick={handleSelectCurrentBlock}>
                  Select Current Block
                </Button>
              )}
              {selectedUnitIds.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={handleDeselectAll}>
                  Deselect All
                </Button>
              )}
            </div>
          </div>
        }
        subtitle="Click checkboxes on units to assign owners in bulk, or use the pre-filled CSV import above."
      >
        <div className="space-y-4">
          {/* Ground Floor Commercial Shops if enabled */}
          {activeBlock?.has_commercial_shops && (activeBlock.commercial_shops_count || 0) > 0 && (
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Store className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900">
                  Ground Floor Commercial Shops ({activeBlock.commercial_shops_count} Units)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {Array.from({ length: activeBlock.commercial_shops_count || 0 }).map((_, sIdx) => {
                  const unitId = `${activeBlock.name}-Shop-${sIdx + 1}`;
                  const isSelected = selectedUnitIds.includes(unitId);
                  const owner = ownersByIdentifier[unitId] || ownersByIdentifier[`Shop-${sIdx + 1}`];

                  return (
                    <div
                      key={sIdx}
                      onClick={() => handleToggleSelectUnit(unitId)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-100 border-emerald-600 ring-2 ring-emerald-500/30 font-bold'
                          : owner
                          ? 'bg-emerald-50/80 border-emerald-300 font-medium'
                          : 'bg-white border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-emerald-950">Shop-{sIdx + 1}</span>
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-600 block truncate mt-1">
                        {owner ? `👤 ${owner.full_name}` : 'Vacant Shop'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Residential Floors Grid */}
          {hasFlats && activeBlock && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {Array.from({ length: activeBlock?.floors_count || 5 }).map((_, fIdx) => {
                const floorNum = fIdx + 1;
                const flatsCount = activeBlock?.flats_per_floor || 4;
                const is4Digit = (activeBlock?.series_start || 101) >= 1000;

                return (
                  <div
                    key={fIdx}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-indigo-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-[90px]">
                      <div className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-600 font-bold text-xs flex items-center justify-center">
                        F{floorNum}
                      </div>
                      <span className="text-xs font-bold text-slate-700">Floor {floorNum}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 flex-1">
                      {Array.from({ length: flatsCount }).map((_, uIdx) => {
                        const unitNumber = is4Digit
                          ? `${floorNum * 1000 + uIdx + 1}`
                          : `${floorNum * 100 + uIdx + 1}`;
                        const unitId = `${activeBlock.name}-${unitNumber}`;
                        const isSelected = selectedUnitIds.includes(unitId);
                        const owner = ownersByIdentifier[unitId] || ownersByIdentifier[unitNumber];

                        return (
                          <div
                            key={uIdx}
                            onClick={() => handleToggleSelectUnit(unitId)}
                            className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-100 border-indigo-600 ring-2 ring-indigo-500/30'
                                : owner
                                ? 'bg-indigo-50/60 border-indigo-300'
                                : 'bg-slate-50 border-slate-200 hover:bg-indigo-50/30'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-xs text-slate-900">{unitNumber}</span>
                              {isSelected ? (
                                <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                              ) : (
                                <Square className="w-3.5 h-3.5 text-slate-300" />
                              )}
                            </div>
                            <span className="text-[10px] text-slate-600 block truncate mt-0.5">
                              {owner ? `👤 ${owner.full_name}` : `(${activeBlock.flat_type || '2 BHK'})`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bungalows / Villas Grid */}
          {(isBungalowOnly || isHybrid || enableBungalows) && (
            <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Building className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-900">
                  Bungalows Area ({bungalowsCount} Standalone Villas)
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 max-h-60 overflow-y-auto pr-1">
                {Array.from({ length: bungalowsCount }).map((_, bIdx) => {
                  const prefix = bungalowsConfig.prefix || 'Villa-';
                  const startNum = bungalowsConfig.starting_number || 1;
                  const villaNo = `${prefix}${startNum + bIdx}`;
                  const isSelected = selectedUnitIds.includes(villaNo);
                  const owner = ownersByIdentifier[villaNo];

                  return (
                    <div
                      key={bIdx}
                      onClick={() => handleToggleSelectUnit(villaNo)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-100 border-amber-600 ring-2 ring-amber-500/30 font-bold'
                          : owner
                          ? 'bg-amber-50/80 border-amber-300 font-medium'
                          : 'bg-white border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-amber-950">{villaNo}</span>
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-amber-700" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-300" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-600 block truncate mt-1">
                        {owner ? `👤 ${owner.full_name}` : 'Vacant Villa'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Floating Bulk Action Bar */}
      {selectedUnitIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white text-slate-800 px-5 py-3 rounded-2xl shadow-card flex items-center gap-4 animate-slideUp border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
              {selectedUnitIds.length}
            </span>
            <span className="text-xs font-bold text-slate-800">Units Selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsBulkOwnerModalOpen(true)}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Assign Owner in Bulk
            </Button>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Bulk Assign Owner Modal */}
      <Modal
        isOpen={isBulkOwnerModalOpen}
        onClose={() => setIsBulkOwnerModalOpen(false)}
        title={`Assign Owner to ${selectedUnitIds.length} Selected Units`}
        size="md"
      >
        <div className="space-y-4 py-2">
          <Input
            label="Owner / Resident Full Name"
            placeholder="e.g. Sunil Gavaskar"
            value={bulkOwnerName}
            onChange={(e) => {
              setBulkOwnerName(e.target.value);
              if (modalErrors.name) setModalErrors((prev) => ({ ...prev, name: '' }));
            }}
            error={modalErrors.name}
            requiredIndicator
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number (Optional)"
              placeholder="e.g. 9876543210"
              value={bulkOwnerPhone}
              onChange={(e) => {
                setBulkOwnerPhone(e.target.value);
                if (modalErrors.phone) setModalErrors((prev) => ({ ...prev, phone: '' }));
              }}
              error={modalErrors.phone}
            />
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="e.g. owner@example.com"
              value={bulkOwnerEmail}
              onChange={(e) => {
                setBulkOwnerEmail(e.target.value);
                if (modalErrors.email) setModalErrors((prev) => ({ ...prev, email: '' }));
              }}
              error={modalErrors.email}
            />
          </div>
          <Select
            label="Occupancy / Relationship Role"
            value={bulkRelationship}
            onChange={(e) => setBulkRelationship(e.target.value)}
            options={[
              { label: 'Primary Owner', value: 'Primary Owner' },
              { label: 'Co-Owner', value: 'Co-Owner' },
              { label: 'Tenant', value: 'Tenant' },
            ]}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsBulkOwnerModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleExecuteBulkAssign}>
              Apply to {selectedUnitIds.length} Units
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
