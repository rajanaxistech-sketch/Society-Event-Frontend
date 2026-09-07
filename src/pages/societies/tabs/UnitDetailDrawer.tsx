import React from 'react';
import { X, Home, UserCheck, Users, Phone, Mail, Plus, Edit2, Shield, Store, Building } from 'lucide-react';
import Button from '../../../components/ui/Button';
import StatusBadge from '../../../components/common/StatusBadge';
import { FlatItem, BungalowItem, PersonItem } from '../../../types';

interface UnitDetailDrawerProps {
  isOpen: boolean;
  unit: (FlatItem | BungalowItem) & {
    residents?: PersonItem[];
    primaryOwner?: PersonItem | null;
    blockName?: string;
    floorNumber?: number;
    isShop?: boolean;
    isBungalow?: boolean;
  } | null;
  onClose: () => void;
  onAssignOwner?: (unitId: string) => void;
  onAddResident?: (unitId: string) => void;
}

export const UnitDetailDrawer: React.FC<UnitDetailDrawerProps> = ({
  isOpen,
  unit,
  onClose,
  onAssignOwner,
  onAddResident,
}) => {
  if (!isOpen || !unit) return null;

  const unitNumber = (unit as any).flat_number || (unit as any).bungalow_number || 'N/A';
  const unitType = (unit as any).flat_type || (unit as any).bungalow_type || 'Residential Unit';
  const isShop = unit.isShop || unitType.toLowerCase().includes('shop') || unitType.toLowerCase().includes('commercial');
  const isBungalow = unit.isBungalow || !!(unit as any).bungalow_number;

  const residents = unit.residents || [];
  const primaryOwner = unit.primaryOwner || residents.find((r) => r.is_primary_owner) || null;
  const coResidents = residents.filter((r) => !r.is_primary_owner);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                  isShop
                    ? 'bg-emerald-100 text-emerald-700'
                    : isBungalow
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {isShop ? <Store className="w-5 h-5" /> : isBungalow ? <Building className="w-5 h-5" /> : <Home className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {unitNumber}
                  </h3>
                  <StatusBadge status={unit.status || (residents.length > 0 ? 'occupied' : 'vacant')} />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {unit.blockName ? `${unit.blockName} • ` : ''}
                  {unit.floorNumber !== undefined ? (unit.floorNumber === 0 ? 'Ground Floor (Commercial)' : `Floor ${unit.floorNumber}`) : ''}
                  {unit.isBungalow ? 'Standalone Villa Area' : ''}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Unit Meta Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Property Category:</span>
                <span className="font-bold text-slate-800">{unitType}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Occupancy Status:</span>
                <span className="font-bold text-slate-800 capitalize">
                  {residents.length > 0 ? 'Occupied' : 'Vacant'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Total Registered Members:</span>
                <span className="font-bold text-indigo-600">{residents.length} Persons</span>
              </div>
            </div>

            {/* Primary Owner Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                  Primary Owner / Allottee
                </h4>
                {primaryOwner && onAssignOwner && (
                  <button
                    type="button"
                    onClick={() => onAssignOwner(unit.id)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    Change Owner
                  </button>
                )}
              </div>

              {primaryOwner ? (
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {primaryOwner.full_name?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-sm font-bold text-slate-900 truncate">
                        {primaryOwner.full_name}
                      </h5>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-full mt-0.5">
                        <Shield className="w-3 h-3" />
                        Primary Registered Owner
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-indigo-100/80 space-y-1.5 text-xs text-slate-700">
                    {primaryOwner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{primaryOwner.phone}</span>
                      </div>
                    )}
                    {primaryOwner.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{primaryOwner.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
                  <p className="text-xs text-slate-500 font-medium">
                    No primary owner assigned yet to this unit.
                  </p>
                  {onAssignOwner && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onAssignOwner(unit.id)}
                      leftIcon={<UserCheck className="w-3.5 h-3.5 text-indigo-600" />}
                    >
                      Assign Primary Owner
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Co-Residents Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-600" />
                  Co-Residents & Family Members ({coResidents.length})
                </h4>
                {onAddResident && (
                  <button
                    type="button"
                    onClick={() => onAddResident(unit.id)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Member
                  </button>
                )}
              </div>

              {coResidents.length > 0 ? (
                <div className="space-y-2">
                  {coResidents.map((res, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                          {res.full_name?.charAt(0) || 'R'}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate">
                            {res.full_name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {res.relationship_to_owner || 'Family Member'} {res.phone ? `• ${res.phone}` : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No additional co-residents listed.</p>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
