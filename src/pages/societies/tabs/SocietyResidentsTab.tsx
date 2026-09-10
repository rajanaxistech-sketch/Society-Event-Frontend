import React, { useEffect, useState, useMemo } from 'react';
import Card from '../../../components/ui/Card';
import Table, { Column } from '../../../components/ui/Table';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import {
  Users,
  Search,
  Plus,
  Shield,
  Phone,
  Mail,
  Home,
  Store,
  Building,
  RefreshCw,
} from 'lucide-react';
import { SocietyHierarchyData } from '../../../api/societiesService';
import { personsService } from '../../../api/personsService';
import { flatsService } from '../../../api/flatsService';
import { PersonItem } from '../../../types';
import { useToast } from '../../../hooks/useToast';
import { extractErrorMessage } from '../../../utils/errorExtractor';
import { isValidEmail, isValidPhone } from '../../../utils/validators';

interface SocietyResidentsTabProps {
  data: SocietyHierarchyData;
  onRefresh: () => void;
}

export const SocietyResidentsTab: React.FC<SocietyResidentsTabProps> = ({
  data,
  onRefresh,
}) => {
  const toast = useToast();
  const { society, blocks, bungalows } = data;

  const [search, setSearch] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');
  const [allResidents, setAllResidents] = useState<PersonItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add resident modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalPropertyType, setModalPropertyType] = useState<'flat' | 'bungalow'>('flat');
  const [selectedModalBlockId, setSelectedModalBlockId] = useState<string>('');
  const [selectedModalFloorId, setSelectedModalFloorId] = useState<string>('');
  const [selectedModalFlatId, setSelectedModalFlatId] = useState<string>('');
  const [selectedModalBungalowId, setSelectedModalBungalowId] = useState<string>('');

  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRelationship, setNewRelationship] = useState('Primary Owner');
  const [newIsPrimary, setNewIsPrimary] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fast lookups from hierarchy data
  const flatLookupMap = useMemo(() => {
    const map: Record<
      string,
      {
        blockName: string;
        blockId: string;
        floorNumber: number;
        floorName?: string;
        flatNumber: string;
        flatType?: string;
        isShop: boolean;
      }
    > = {};

    blocks.forEach((b) => {
      (b.floorsList || []).forEach((f) => {
        (f.flatsList || []).forEach((flat) => {
          map[flat.id] = {
            blockName: b.name,
            blockId: b.id,
            floorNumber: f.floor_number,
            floorName: f.name || `Floor ${f.floor_number}`,
            flatNumber: flat.flat_number,
            flatType: flat.flat_type || undefined,
            isShop: false,
          };
        });
      });
      (b.commercialShops || []).forEach((shop) => {
        map[shop.id] = {
          blockName: b.name,
          blockId: b.id,
          floorNumber: 0,
          floorName: 'Ground Floor',
          flatNumber: shop.flat_number,
          flatType: shop.flat_type || 'Commercial Shop',
          isShop: true,
        };
      });
    });

    return map;
  }, [blocks]);

  const bungalowLookupMap = useMemo(() => {
    const map: Record<string, { bungalowNumber: string; bungalowType?: string }> = {};
    bungalows.forEach((b) => {
      map[b.id] = {
        bungalowNumber: b.bungalow_number,
        bungalowType: b.bungalow_type || undefined,
      };
    });
    return map;
  }, [bungalows]);

  // Modal 3-step dropdown options (Block -> Floor -> Flat)
  const blockOptions = useMemo(() => {
    return blocks.map((b) => ({
      label: b.name,
      value: b.id,
    }));
  }, [blocks]);

  const selectedBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedModalBlockId);
  }, [blocks, selectedModalBlockId]);

  const floorOptions = useMemo(() => {
    if (!selectedBlock) return [];
    const opts: Array<{ label: string; value: string }> = [];

    (selectedBlock.floorsList || []).forEach((f) => {
      opts.push({
        label: f.name || `Floor ${f.floor_number}`,
        value: f.id,
      });
    });

    if (selectedBlock.commercialShops && selectedBlock.commercialShops.length > 0) {
      opts.push({
        label: 'Ground Floor (Commercial Shops)',
        value: `commercial_${selectedBlock.id}`,
      });
    }

    return opts;
  }, [selectedBlock]);

  const flatOptions = useMemo(() => {
    if (!selectedBlock || !selectedModalFloorId) return [];

    if (selectedModalFloorId === `commercial_${selectedBlock.id}`) {
      return (selectedBlock.commercialShops || []).map((shop) => ({
        label: `Shop ${shop.flat_number}${shop.flat_type ? ` (${shop.flat_type})` : ''}`,
        value: shop.id,
      }));
    }

    const floor = (selectedBlock.floorsList || []).find((f) => f.id === selectedModalFloorId);
    if (!floor) return [];

    return (floor.flatsList || []).map((flat) => ({
      label: `Flat ${flat.flat_number}${flat.flat_type ? ` (${flat.flat_type})` : ''}`,
      value: flat.id,
    }));
  }, [selectedBlock, selectedModalFloorId]);

  const bungalowOptions = useMemo(() => {
    return bungalows.map((b) => ({
      label: `Bungalow ${b.bungalow_number}${b.bungalow_type ? ` (${b.bungalow_type})` : ''}`,
      value: b.id,
    }));
  }, [bungalows]);

  // Helper to resolve property details for any resident
  const getPropertyInfo = (row: PersonItem) => {
    // 1. Check direct populated flat relation
    if (row.flat) {
      const blockName = row.flat.floor?.block?.name || '';
      const blockId = row.flat.floor?.block?.id || '';
      const floorNum = row.flat.floor?.floor_number;
      const flatNum = row.flat.flat_number;
      const flatType = row.flat.flat_type || '';
      const isShop =
        flatType.toLowerCase().includes('shop') ||
        flatType.toLowerCase().includes('commercial') ||
        floorNum === 0 ||
        flatNum.toLowerCase().startsWith('shop');

      return {
        type: (isShop ? 'shop' : 'flat') as 'shop' | 'flat' | 'bungalow',
        blockName: blockName || 'Block',
        blockId,
        floorNumber: floorNum,
        floorLabel: floorNum !== undefined ? (floorNum === 0 ? 'Ground Floor' : `Floor ${floorNum}`) : 'N/A',
        flatNumber: flatNum,
        flatType,
      };
    }

    // 2. Lookup via flatLookupMap
    if (row.flat_id && flatLookupMap[row.flat_id]) {
      const m = flatLookupMap[row.flat_id];
      return {
        type: (m.isShop ? 'shop' : 'flat') as 'shop' | 'flat' | 'bungalow',
        blockName: m.blockName,
        blockId: m.blockId,
        floorNumber: m.floorNumber,
        floorLabel: m.floorNumber === 0 ? 'Ground Floor' : `Floor ${m.floorNumber}`,
        flatNumber: m.flatNumber,
        flatType: m.flatType,
      };
    }

    // 3. Check direct populated bungalow relation
    if (row.bungalow) {
      return {
        type: 'bungalow' as const,
        bungalowNumber: row.bungalow.bungalow_number,
        bungalowType: row.bungalow.bungalow_type || 'Bungalow / Villa',
      };
    }

    // 4. Lookup via bungalowLookupMap
    if (row.bungalow_id && bungalowLookupMap[row.bungalow_id]) {
      const b = bungalowLookupMap[row.bungalow_id];
      return {
        type: 'bungalow' as const,
        bungalowNumber: b.bungalowNumber,
        bungalowType: b.bungalowType || 'Bungalow / Villa',
      };
    }

    return null;
  };

  const fetchResidents = async () => {
    try {
      setIsLoading(true);
      const res = await personsService.getAll({ societyId: society.id, limit: 1000 });
      if (res.success && res.data) {
        setAllResidents(res.data);
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to fetch residents'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResidents();
  }, [society.id]);

  const handleSetPrimaryOwner = async (flatId: string, personId: string, personName: string) => {
    try {
      const res = await flatsService.setPrimaryOwner(flatId, personId);
      if (res.success) {
        toast.success(`Set ${personName} as primary owner.`);
        fetchResidents();
        onRefresh();
      } else {
        toast.error(res.message || 'Failed to update primary owner');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Error updating primary owner'));
    }
  };

  const resetModalForm = () => {
    setSelectedModalBlockId('');
    setSelectedModalFloorId('');
    setSelectedModalFlatId('');
    setSelectedModalBungalowId('');
    setModalPropertyType('flat');
    setNewFullName('');
    setNewPhone('');
    setNewEmail('');
    setNewRelationship('Primary Owner');
    setNewIsPrimary(true);
    setErrors({});
  };

  const validateResidentForm = (): boolean => {
    const errs: Record<string, string> = {};

    // 1. Cascading Property Selection
    if (modalPropertyType === 'flat') {
      if (!selectedModalBlockId) {
        errs.blockId = 'Please select a block';
      }
      if (!selectedModalFloorId) {
        errs.floorId = 'Please select a floor';
      }
      if (!selectedModalFlatId) {
        errs.flatId = 'Please select a flat';
      }
    } else {
      if (!selectedModalBungalowId) {
        errs.bungalowId = 'Please select a bungalow';
      }
    }

    // 2. Full Name (Required)
    if (!newFullName.trim()) {
      errs.fullName = 'Full name is required';
    } else if (newFullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters';
    }

    // 3. Phone Number (Optional)
    if (newPhone.trim() && !isValidPhone(newPhone)) {
      errs.phone = 'Invalid phone number (7 to 15 digits required)';
    }

    // 4. Email Address (Optional)
    if (newEmail.trim() && !isValidEmail(newEmail)) {
      errs.email = 'Invalid email address format (e.g. resident@example.com)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddResident = async () => {
    if (!validateResidentForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const isBungalow = modalPropertyType === 'bungalow';

      const res = await personsService.create({
        flat_id: isBungalow ? undefined : selectedModalFlatId,
        bungalow_id: isBungalow ? selectedModalBungalowId : undefined,
        full_name: newFullName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        relationship_to_owner: newRelationship,
        is_primary_owner: newIsPrimary,
      });

      if (res.success) {
        toast.success(`Resident ${newFullName} added successfully.`);
        setIsAddModalOpen(false);
        resetModalForm();
        fetchResidents();
        onRefresh();
      } else {
        toast.error(res.message || 'Failed to add resident');
      }
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Failed to add resident'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter residents by search query and selected block
  const filteredResidents = allResidents.filter((r) => {
    const prop = getPropertyInfo(r);

    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.full_name?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      (prop?.blockName && prop.blockName.toLowerCase().includes(q)) ||
      (prop?.flatNumber && prop.flatNumber.toLowerCase().includes(q)) ||
      (prop?.floorLabel && prop.floorLabel.toLowerCase().includes(q)) ||
      (prop?.bungalowNumber && prop.bungalowNumber.toLowerCase().includes(q));

    const matchesBlock =
      selectedBlockId === 'all' ||
      (selectedBlockId === 'bungalows' && (r.bungalow_id || r.bungalow || prop?.type === 'bungalow')) ||
      (prop?.blockId === selectedBlockId);

    return matchesSearch && matchesBlock;
  });

  const columns: Column<PersonItem>[] = [
    {
      key: 'full_name',
      header: 'Resident Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 border border-indigo-100">
            {row.full_name?.charAt(0) || 'R'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{row.full_name}</span>
            <span className="text-[11px] text-slate-400 block">
              {row.relationship_to_owner || 'Resident'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'is_primary_owner',
      header: 'Role / Ownership',
      render: (row) =>
        row.is_primary_owner ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Shield className="w-3 h-3" />
            Primary Owner
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-slate-600 bg-slate-100">
            Co-Resident
          </span>
        ),
    },
    {
      key: 'phone',
      header: 'Contact Info',
      render: (row) => (
        <div className="text-xs space-y-0.5">
          {row.phone && (
            <div className="flex items-center gap-1.5 text-slate-700">
              <Phone className="w-3 h-3 text-slate-400 shrink-0" />
              <span>{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate max-w-[160px]">{row.email}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'flat_id',
      header: 'Assigned Property',
      render: (row) => {
        const prop = getPropertyInfo(row);

        if (!prop) {
          return <span className="text-slate-400 text-xs italic">Unassigned</span>;
        }

        if (prop.type === 'bungalow') {
          return (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 border border-teal-200/80 shadow-2xs">
                <Building className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 text-xs">
                    Bungalow {prop.bungalowNumber}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-teal-100/70 text-teal-800 border border-teal-200">
                    Villa
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {prop.bungalowType || 'Independent Villa'}
                </span>
              </div>
            </div>
          );
        }

        if (prop.type === 'shop') {
          return (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200/80 shadow-2xs">
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 text-xs">
                    Shop {prop.flatNumber}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200">
                    {prop.blockName}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  {prop.floorLabel} &bull; Commercial Shop
                </span>
              </div>
            </div>
          );
        }

        // Standard Apartment Flat
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 border border-indigo-100/80 shadow-2xs">
              <Home className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900 text-xs">
                  Flat {prop.flatNumber}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-100/70 text-indigo-800 border border-indigo-200">
                  {prop.blockName}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                {prop.floorLabel} {prop.flatType ? `• ${prop.flatType}` : ''}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'id',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {!row.is_primary_owner && row.flat_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetPrimaryOwner(row.flat_id!, row.id, row.full_name)}
            >
              Make Primary Owner
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3.5 animate-fadeIn">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resident, flat, floor or block..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 sm:h-9 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white text-slate-800"
            />
          </div>

          {blocks.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedBlockId}
                onChange={(e) => setSelectedBlockId(e.target.value)}
                className="h-8 sm:h-9 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-700 cursor-pointer"
              >
                <option value="all">All Blocks / Units</option>
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
                {bungalows.length > 0 && <option value="bungalows">All Bungalows / Villas</option>}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchResidents}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetModalForm();
              setIsAddModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Resident
          </Button>
        </div>
      </div>

      {/* Resident Directory Card */}
      <Card
        title={
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-900">
              Resident Directory ({filteredResidents.length} Residents)
            </span>
          </div>
        }
      >
        <Table
          columns={columns}
          data={filteredResidents}
          isLoading={isLoading}
          emptyText="No residents registered in this society yet."
        />
      </Card>

      {/* Register Resident Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetModalForm();
        }}
        title="Register New Resident"
        size="lg"
      >
        <div className="space-y-4 py-2">
          {/* Unit Type Selection if Society has Bungalows */}
          {bungalows.length > 0 && (
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => {
                  setModalPropertyType('flat');
                  setErrors({});
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  modalPropertyType === 'flat'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Apartment Flat / Tower
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalPropertyType('bungalow');
                  setErrors({});
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  modalPropertyType === 'bungalow'
                    ? 'bg-white text-teal-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bungalow / Villa
              </button>
            </div>
          )}

          {/* 3-Step Cascading Dropdowns: Block -> Floor -> Flat */}
          {modalPropertyType === 'flat' ? (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Assigned Unit Location
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Block Dropdown */}
                <Select
                  label="1. Block"
                  placeholder="-- Select Block --"
                  value={selectedModalBlockId}
                  onChange={(e) => {
                    setSelectedModalBlockId(e.target.value);
                    setSelectedModalFloorId('');
                    setSelectedModalFlatId('');
                    if (errors.blockId) setErrors((prev) => ({ ...prev, blockId: '' }));
                    if (errors.floorId) setErrors((prev) => ({ ...prev, floorId: '' }));
                    if (errors.flatId) setErrors((prev) => ({ ...prev, flatId: '' }));
                  }}
                  options={blockOptions}
                  error={errors.blockId}
                  requiredIndicator
                />

                {/* 2. Floor Dropdown (Dynamic based on selected block) */}
                <Select
                  label="2. Floor"
                  placeholder={selectedModalBlockId ? '-- Select Floor --' : '-- Choose Block First --'}
                  value={selectedModalFloorId}
                  disabled={!selectedModalBlockId || floorOptions.length === 0}
                  onChange={(e) => {
                    setSelectedModalFloorId(e.target.value);
                    setSelectedModalFlatId('');
                    if (errors.floorId) setErrors((prev) => ({ ...prev, floorId: '' }));
                    if (errors.flatId) setErrors((prev) => ({ ...prev, flatId: '' }));
                  }}
                  options={floorOptions}
                  error={errors.floorId}
                  requiredIndicator
                />

                {/* 3. Flat Dropdown (Dynamic based on selected floor) */}
                <Select
                  label="3. Flat Number"
                  placeholder={selectedModalFloorId ? '-- Select Flat --' : '-- Choose Floor First --'}
                  value={selectedModalFlatId}
                  disabled={!selectedModalFloorId || flatOptions.length === 0}
                  onChange={(e) => {
                    setSelectedModalFlatId(e.target.value);
                    if (errors.flatId) setErrors((prev) => ({ ...prev, flatId: '' }));
                  }}
                  options={flatOptions}
                  error={errors.flatId}
                  requiredIndicator
                />
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Assigned Bungalow Location
              </div>
              <Select
                label="Select Bungalow / Villa"
                placeholder="-- Select Bungalow --"
                value={selectedModalBungalowId}
                onChange={(e) => {
                  setSelectedModalBungalowId(e.target.value);
                  if (errors.bungalowId) setErrors((prev) => ({ ...prev, bungalowId: '' }));
                }}
                options={bungalowOptions}
                error={errors.bungalowId}
                requiredIndicator
              />
            </div>
          )}

          {/* Resident Details */}
          <Input
            label="Full Name"
            placeholder="e.g. Ramesh Chandra"
            value={newFullName}
            onChange={(e) => {
              setNewFullName(e.target.value);
              if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
            }}
            error={errors.fullName}
            requiredIndicator
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              maxLength={15}
              value={newPhone}
              onChange={(e) => {
                const numericVal = e.target.value.replace(/\D/g, '');
                setNewPhone(numericVal);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              onKeyDown={(e) => {
                if (
                  [
                    'Backspace',
                    'Delete',
                    'Tab',
                    'Escape',
                    'Enter',
                    'ArrowLeft',
                    'ArrowRight',
                    'Home',
                    'End',
                  ].includes(e.key) ||
                  (e.ctrlKey || e.metaKey)
                ) {
                  return;
                }
                if (!/^[0-9]$/.test(e.key)) {
                  e.preventDefault();
                }
              }}
              error={errors.phone}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. ramesh@example.com"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
              }}
              error={errors.email}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Relationship"
              value={newRelationship}
              onChange={(e) => setNewRelationship(e.target.value)}
              options={[
                { label: 'Primary Owner', value: 'Primary Owner' },
                { label: 'Co-Owner', value: 'Co-Owner' },
                { label: 'Spouse', value: 'Spouse' },
                { label: 'Son / Daughter', value: 'Child' },
                { label: 'Tenant', value: 'Tenant' },
              ]}
            />
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsPrimary}
                  onChange={(e) => setNewIsPrimary(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-bold text-slate-700">Set as Primary Owner</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddModalOpen(false);
                resetModalForm();
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddResident}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registering...' : 'Register Resident'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
