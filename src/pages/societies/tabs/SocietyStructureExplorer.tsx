import React, { useState } from 'react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import {
  Layers,
  Grid,
  Store,
  Home,
  Plus,
  Building,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { SocietyHierarchyData } from '../../../api/societiesService';
import { blocksService } from '../../../api/blocksService';
import { floorsService } from '../../../api/floorsService';
import { flatsService } from '../../../api/flatsService';
import { bungalowsService } from '../../../api/bungalowsService';
import { useToast } from '../../../hooks/useToast';
import { UnitDetailDrawer } from './UnitDetailDrawer';
import { extractErrorMessage } from '../../../utils/errorExtractor';

interface SocietyStructureExplorerProps {
  data: SocietyHierarchyData;
  onRefresh: () => void;
}

export const SocietyStructureExplorer: React.FC<SocietyStructureExplorerProps> = ({
  data,
  onRefresh,
}) => {
  const toast = useToast();
  const { blocks, bungalows, society } = data;

  const [selectedBlockId, setSelectedBlockId] = useState<string>(
    blocks.length > 0 ? blocks[0].id : 'bungalows'
  );

  // Selected Unit for Slide-Over Drawer
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Quick Action Modals
  const [isAddFloorOpen, setIsAddFloorOpen] = useState(false);
  const [newFloorNumber, setNewFloorNumber] = useState<number>(1);
  const [isAddingFloor, setIsAddingFloor] = useState(false);

  const [isAddFlatOpen, setIsAddFlatOpen] = useState(false);
  const [newFlatNumber, setNewFlatNumber] = useState('');
  const [newFlatType, setNewFlatType] = useState('2 BHK');
  const [newFlatFloorId, setNewFlatFloorId] = useState('');
  const [isAddingFlat, setIsAddingFlat] = useState(false);

  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockCode, setNewBlockCode] = useState('');
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  const activeBlock = blocks.find((b) => b.id === selectedBlockId);
  const isBungalowView = selectedBlockId === 'bungalows';

  const handleOpenUnitDrawer = (
    unit: any,
    blockName?: string,
    floorNumber?: number,
    isShop?: boolean,
    isBungalow?: boolean
  ) => {
    setSelectedUnit({
      ...unit,
      blockName: blockName || activeBlock?.name,
      floorNumber,
      isShop,
      isBungalow,
    });
    setIsDrawerOpen(true);
  };

  const handleAddFloorSubmit = async () => {
    if (!activeBlock) return;
    try {
      setIsAddingFloor(true);
      const res = await floorsService.create({
        block_id: activeBlock.id,
        floor_number: newFloorNumber,
        name: `Floor ${newFloorNumber}`,
        status: 'active',
      });
      if (res.success) {
        toast.success(`Floor ${newFloorNumber} added to ${activeBlock.name}`);
        setIsAddFloorOpen(false);
        onRefresh();
      } else {
        toast.error(res.message || 'Failed to add floor');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to add floor'));
    } finally {
      setIsAddingFloor(false);
    }
  };

  const handleAddFlatSubmit = async () => {
    if (!newFlatFloorId || !newFlatNumber.trim()) {
      toast.error('Please enter flat number and select floor');
      return;
    }
    try {
      setIsAddingFlat(true);
      const res = await flatsService.create({
        floor_id: newFlatFloorId,
        flat_number: newFlatNumber.trim(),
        flat_type: newFlatType,
        status: 'vacant',
      });
      if (res.success) {
        toast.success(`Unit ${newFlatNumber} created successfully`);
        setIsAddFlatOpen(false);
        setNewFlatNumber('');
        onRefresh();
      } else {
        toast.error(res.message || 'Failed to create unit');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to create unit'));
    } finally {
      setIsAddingFlat(false);
    }
  };

  const handleAddBlockSubmit = async () => {
    if (!newBlockName.trim()) {
      toast.error('Block name is required');
      return;
    }
    try {
      setIsAddingBlock(true);
      const res = await blocksService.create({
        society_id: society.id,
        name: newBlockName.trim(),
        code: (newBlockCode.trim() || newBlockName.slice(0, 2)).toUpperCase(),
        status: 'active',
      });
      if (res.success && res.data) {
        toast.success(`Block "${newBlockName}" added successfully`);
        setIsAddBlockOpen(false);
        setNewBlockName('');
        setNewBlockCode('');
        setSelectedBlockId(res.data.id);
        onRefresh();
      } else {
        toast.error(res.message || 'Failed to add block');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to add block'));
    } finally {
      setIsAddingBlock(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Property Structure Explorer
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Interactive building visualizer for apartments, commercial shops, and villas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddBlockOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Block
          </Button>

          {activeBlock && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const maxFloor = activeBlock.floorsList?.reduce(
                    (max, f) => Math.max(max, f.floor_number ?? 0),
                    0
                  ) || 0;
                  setNewFloorNumber(maxFloor + 1);
                  setIsAddFloorOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Floor
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (activeBlock.floorsList && activeBlock.floorsList.length > 0) {
                    setNewFlatFloorId(activeBlock.floorsList[0].id);
                  }
                  setIsAddFlatOpen(true);
                }}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Unit
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Block Selector Tabs / Pills */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
        {blocks.map((block) => {
          const isSelected = selectedBlockId === block.id;
          const flatCount = (block.floorsList || []).reduce(
            (acc, f) => acc + (f.flatsList?.length || 0),
            0
          );
          const shopCount = block.commercialShops?.length || 0;

          return (
            <button
              key={block.id}
              type="button"
              onClick={() => setSelectedBlockId(block.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 ring-2 ring-indigo-600/30'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                }`}
              >
                {block.code || block.name.slice(0, 2)}
              </div>
              <span>{block.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {block.floorsList?.length || 0}F &bull; {flatCount} Flats
                {shopCount > 0 ? ` &bull; ${shopCount} Shops` : ''}
              </span>
            </button>
          );
        })}

        {bungalows.length > 0 && (
          <button
            type="button"
            onClick={() => setSelectedBlockId('bungalows')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all whitespace-nowrap cursor-pointer ${
              isBungalowView
                ? 'bg-amber-600 text-white shadow-md shadow-amber-200 ring-2 ring-amber-600/30'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${
                isBungalowView ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
            </div>
            <span>Bungalows Area</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                isBungalowView ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {bungalows.length} Villas
            </span>
          </button>
        )}
      </div>

      {/* Main Building Display Area */}
      {!isBungalowView && activeBlock && (
        <div className="space-y-4">
          {/* Ground Floor Commercial Shops Section */}
          {activeBlock.commercialShops && activeBlock.commercialShops.length > 0 && (
            <div className="p-4 rounded-2xl bg-emerald-50/40 border-2 border-emerald-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                      Ground Floor Commercial Shops ({activeBlock.commercialShops.length} Units)
                    </h4>
                    <span className="text-[11px] text-emerald-700">
                      Click any shop badge to inspect allottee & payment details.
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                {activeBlock.commercialShops.map((shop) => {
                  const hasResidents = (shop.residents || []).length > 0;
                  const ownerName = shop.primaryOwner?.full_name || shop.residents?.[0]?.full_name;

                  return (
                    <button
                      key={shop.id}
                      type="button"
                      onClick={() => handleOpenUnitDrawer(shop, activeBlock.name, 0, true, false)}
                      className={`p-3 rounded-xl border text-left transition-all group cursor-pointer shadow-2xs hover:scale-102 ${
                        hasResidents
                          ? 'bg-emerald-100/70 border-emerald-300 hover:border-emerald-500 text-emerald-950'
                          : 'bg-white border-dashed border-emerald-300 hover:border-emerald-400 text-slate-700'
                      }`}
                      title={ownerName ? `Allottee: ${ownerName}` : 'Vacant Commercial Unit'}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black">{shop.flat_number}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            hasResidents ? 'bg-emerald-600' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block truncate mt-1">
                        {ownerName || 'Vacant Unit'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Residential Floors Grid */}
          {activeBlock.floorsList && activeBlock.floorsList.length > 0 ? (
            <div className="space-y-3">
              {activeBlock.floorsList.map((floor) => {
                const floorFlats = floor.flatsList || [];
                const occupiedCount = floorFlats.filter(
                  (f) => (f.residents && f.residents.length > 0) || f.primaryOwner
                ).length;

                return (
                  <div
                    key={floor.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 transition-all shadow-2xs space-y-3"
                  >
                    {/* Floor Header Bar */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center">
                          F{floor.floor_number}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {floor.name || `Floor ${floor.floor_number}`}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {floorFlats.length} Flats &bull; {occupiedCount} Occupied &bull;{' '}
                            {floorFlats.length - occupiedCount} Vacant
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewFlatFloorId(floor.id);
                            setIsAddFlatOpen(true);
                          }}
                          leftIcon={<Plus className="w-3 h-3" />}
                        >
                          Add Flat
                        </Button>
                      </div>
                    </div>

                    {/* Flats Matrix */}
                    {floorFlats.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                        {floorFlats.map((flat) => {
                          const isOccupied =
                            (flat.residents && flat.residents.length > 0) || !!flat.primaryOwner;
                          const ownerName =
                            flat.primaryOwner?.full_name || flat.residents?.[0]?.full_name;

                          return (
                            <button
                              key={flat.id}
                              type="button"
                              onClick={() =>
                                handleOpenUnitDrawer(
                                  flat,
                                  activeBlock.name,
                                  floor.floor_number,
                                  false,
                                  false
                                )
                              }
                              className={`p-3 rounded-xl border text-left transition-all group cursor-pointer shadow-2xs hover:scale-102 ${
                                isOccupied
                                  ? 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-400 text-indigo-950'
                                  : 'bg-slate-50/50 border-dashed border-slate-300 hover:border-slate-400 text-slate-700'
                              }`}
                              title={ownerName ? `Resident: ${ownerName}` : 'Vacant Flat'}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-xs font-black">{flat.flat_number}</span>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isOccupied ? 'bg-indigo-600' : 'bg-slate-300'
                                  }`}
                                />
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {flat.flat_type || '2 BHK'}
                              </span>
                              <span className="text-[10px] text-slate-600 font-semibold block truncate mt-1">
                                {ownerName || 'Vacant'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-xl text-center">
                        <span className="text-xs text-slate-400 italic">
                          No flats configured on this floor yet.
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="text-center py-8 space-y-3">
                <Grid className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">No Floors Configured in this Block</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add residential floors to start building the apartment unit matrix.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddFloorOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Floor 1
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Bungalows Area View */}
      {isBungalowView && (
        <Card
          title={
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-slate-900">
                Independent Villas / Bungalows ({bungalows.length} Units)
              </span>
            </div>
          }
          subtitle="Click any villa card to view owner details and residents."
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {bungalows.map((b) => {
              const isOccupied = (b.residents && b.residents.length > 0) || !!b.primaryOwner;
              const ownerName = b.primaryOwner?.full_name || b.residents?.[0]?.full_name;

              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleOpenUnitDrawer(b, 'Bungalow Area', undefined, false, true)}
                  className={`p-4 rounded-xl border text-left transition-all group cursor-pointer shadow-2xs hover:scale-102 ${
                    isOccupied
                      ? 'bg-amber-50/60 border-amber-200 hover:border-amber-400 text-amber-950'
                      : 'bg-slate-50/50 border-dashed border-slate-300 hover:border-slate-400 text-slate-700'
                  }`}
                  title={ownerName ? `Owner: ${ownerName}` : 'Vacant Villa'}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black">{b.bungalow_number}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isOccupied ? 'bg-amber-600' : 'bg-slate-300'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {b.bungalow_type || 'Villa'}
                  </span>
                  <span className="text-[10px] text-slate-600 font-semibold block truncate mt-1.5">
                    {ownerName || 'Vacant'}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Slide-over Unit Detail Drawer */}
      <UnitDetailDrawer
        isOpen={isDrawerOpen}
        unit={selectedUnit}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Add Floor Modal */}
      <Modal
        isOpen={isAddFloorOpen}
        onClose={() => setIsAddFloorOpen(false)}
        title={`Add Floor to ${activeBlock?.name || 'Block'}`}
        size="sm"
      >
        <div className="space-y-4 py-2">
          <Input
            label="Floor Number"
            type="number"
            value={newFloorNumber}
            onChange={(e) => setNewFloorNumber(parseInt(e.target.value) || 1)}
            helperText="Enter floor number (e.g. 1, 2, 3...)"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddFloorOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddFloorSubmit}
              disabled={isAddingFloor}
            >
              {isAddingFloor ? 'Adding...' : 'Add Floor'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Flat Modal */}
      <Modal
        isOpen={isAddFlatOpen}
        onClose={() => setIsAddFlatOpen(false)}
        title={`Add Unit to ${activeBlock?.name || 'Block'}`}
        size="md"
      >
        <div className="space-y-4 py-2">
          <Select
            label="Target Floor"
            value={newFlatFloorId}
            onChange={(e) => setNewFlatFloorId(e.target.value)}
            options={(activeBlock?.floorsList || []).map((f) => ({
              label: f.name || `Floor ${f.floor_number}`,
              value: f.id,
            }))}
          />
          <Input
            label="Flat / Unit Number"
            placeholder="e.g. 301 or 302"
            value={newFlatNumber}
            onChange={(e) => setNewFlatNumber(e.target.value)}
          />
          <Select
            label="Unit Type"
            value={newFlatType}
            onChange={(e) => setNewFlatType(e.target.value)}
            options={[
              { label: '1 BHK Apartment', value: '1 BHK' },
              { label: '2 BHK Apartment', value: '2 BHK' },
              { label: '3 BHK Apartment', value: '3 BHK' },
              { label: '4 BHK Apartment', value: '4 BHK' },
              { label: 'Penthouse', value: 'Penthouse' },
              { label: 'Commercial Shop', value: 'Commercial Shop' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddFlatOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddFlatSubmit}
              disabled={isAddingFlat}
            >
              {isAddingFlat ? 'Creating...' : 'Create Unit'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Block Modal */}
      <Modal
        isOpen={isAddBlockOpen}
        onClose={() => setIsAddBlockOpen(false)}
        title="Add New Apartment Block"
        size="md"
      >
        <div className="space-y-4 py-2">
          <Input
            label="Block Name"
            placeholder="e.g. Block C or Wing 3"
            value={newBlockName}
            onChange={(e) => setNewBlockName(e.target.value)}
            requiredIndicator
          />
          <Input
            label="Block Short Code"
            placeholder="e.g. C"
            value={newBlockCode}
            onChange={(e) => setNewBlockCode(e.target.value.toUpperCase())}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddBlockOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddBlockSubmit}
              disabled={isAddingBlock}
            >
              {isAddingBlock ? 'Adding Block...' : 'Add Block'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
