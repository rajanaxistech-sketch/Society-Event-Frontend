import React, { useEffect, useState } from 'react';
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
  UserCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { SocietyHierarchyData } from '../../../api/societiesService';
import { personsService } from '../../../api/personsService';
import { flatsService } from '../../../api/flatsService';
import { PersonItem } from '../../../types';
import { useToast } from '../../../hooks/useToast';
import { extractErrorMessage } from '../../../utils/errorExtractor';

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

  // Add resident modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRelationship, setNewRelationship] = useState('Primary Owner');
  const [newIsPrimary, setNewIsPrimary] = useState(true);
  const [newTargetFlatId, setNewTargetFlatId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Flatten flats list for the dropdown
  const allFlatsDropdown: Array<{ label: string; value: string }> = [];
  blocks.forEach((b) => {
    (b.floorsList || []).forEach((f) => {
      (f.flatsList || []).forEach((flat) => {
        allFlatsDropdown.push({
          label: `${b.name} - Floor ${f.floor_number} - Flat ${flat.flat_number}`,
          value: flat.id,
        });
      });
    });
    (b.commercialShops || []).forEach((shop) => {
      allFlatsDropdown.push({
        label: `${b.name} - Ground Floor - Shop ${shop.flat_number}`,
        value: shop.id,
      });
    });
  });

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

  const handleAddResident = async () => {
    if (!newFullName.trim() || !newTargetFlatId) {
      toast.error('Full name and target flat are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await personsService.create({
        flat_id: newTargetFlatId,
        full_name: newFullName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        relationship_to_owner: newRelationship,
        is_primary_owner: newIsPrimary,
      });

      if (res.success) {
        toast.success(`Resident ${newFullName} added successfully.`);
        setIsAddModalOpen(false);
        setNewFullName('');
        setNewPhone('');
        setNewEmail('');
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

  // Filter residents
  const filteredResidents = allResidents.filter((r) => {
    const matchesSearch =
      !search ||
      r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.phone?.includes(search) ||
      r.email?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const columns: Column<PersonItem>[] = [
    {
      key: 'full_name',
      header: 'Resident Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
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
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{row.phone}</span>
            </div>
          )}
          {row.email && (
            <div className="flex items-center gap-1.5 text-slate-500">
              <Mail className="w-3 h-3 text-slate-400" />
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
        const flatId = row.flat_id;
        const bungalowId = row.bungalow_id;
        return (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
            <Home className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {flatId ? `Unit ID: ${flatId.substring(0, 8)}...` : bungalowId ? `Bungalow ID: ${bungalowId.substring(0, 8)}...` : 'Unassigned'}
            </span>
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
    <div className="space-y-6 animate-fadeIn">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search resident by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              if (allFlatsDropdown.length > 0) setNewTargetFlatId(allFlatsDropdown[0].value);
              setIsAddModalOpen(true);
            }}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Register Resident
          </Button>
        </div>
      </div>

      {/* Residents Table */}
      <Card>
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
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Resident"
        size="md"
      >
        <div className="space-y-4 py-2">
          <Select
            label="Assigned Property / Flat"
            value={newTargetFlatId}
            onChange={(e) => setNewTargetFlatId(e.target.value)}
            options={allFlatsDropdown}
            requiredIndicator
          />
          <Input
            label="Full Name"
            placeholder="e.g. Ramesh Chandra"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
            requiredIndicator
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              placeholder="e.g. 9876543210"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. ramesh@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
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
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
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
