import axiosClient from './axiosClient';
import {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  SocietyItem,
  SocietyStructureConfig,
  SetupWizardPayload,
  BlockItem,
  FloorItem,
  FlatItem,
  BungalowItem,
  PersonItem,
  UserItem,
} from '../types';
import { blocksService } from './blocksService';
import { floorsService } from './floorsService';
import { flatsService } from './flatsService';
import { bungalowsService } from './bungalowsService';
import { personsService } from './personsService';
import { usersService } from './usersService';

export interface SocietyHierarchyData {
  society: SocietyItem;
  structureConfig?: SocietyStructureConfig;
  blocks: (BlockItem & {
    floorsList?: (FloorItem & {
      flatsList?: (FlatItem & {
        residents?: PersonItem[];
        primaryOwner?: PersonItem | null;
      })[];
    })[];
    commercialShops?: (FlatItem & {
      residents?: PersonItem[];
      primaryOwner?: PersonItem | null;
    })[];
  })[];
  bungalows: (BungalowItem & {
    residents?: PersonItem[];
    primaryOwner?: PersonItem | null;
  })[];
  totalFloors: number;
  totalFlats: number;
  totalShops: number;
  totalBungalows: number;
  totalResidents: number;
  occupancyRate: number;
}

export interface SocietyUserQuotaData {
  activeUsers: number;
  maxUsers: number;
  usagePercentage: number;
  users: UserItem[];
}

export const societiesService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<SocietyItem>> => {
    const response = await axiosClient.get<PaginatedResponse<SocietyItem>>('/societies', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<SocietyItem>> => {
    const response = await axiosClient.get<ApiResponse<SocietyItem>>(`/societies/${id}`);
    return response.data;
  },

  create: async (data: Partial<SocietyItem>): Promise<ApiResponse<SocietyItem>> => {
    const response = await axiosClient.post<ApiResponse<SocietyItem>>('/societies', data);
    return response.data;
  },

  update: async (id: string, data: Partial<SocietyItem>): Promise<ApiResponse<SocietyItem>> => {
    const response = await axiosClient.patch<ApiResponse<SocietyItem>>(`/societies/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/societies/${id}`);
    return response.data;
  },

  getStructure: async (id: string): Promise<ApiResponse<SocietyStructureConfig>> => {
    const response = await axiosClient.get<ApiResponse<SocietyStructureConfig>>(`/societies/${id}/structure`);
    return response.data;
  },

  updateStructure: async (
    id: string,
    data: { flat_enabled: boolean; bungalow_enabled: boolean; setup_completed?: boolean }
  ): Promise<ApiResponse<SocietyStructureConfig>> => {
    const response = await axiosClient.put<ApiResponse<SocietyStructureConfig>>(`/societies/${id}/structure`, data);
    return response.data;
  },

  // Setup Wizard Single-Call Submission with Payload Sanitization & Orchestration Fallback
  setupWizard: async (rawPayload: SetupWizardPayload): Promise<ApiResponse<SocietyItem>> => {
    // 1. Sanitize payload
    const structureType = rawPayload.structure_type || (rawPayload.blocks && rawPayload.blocks.length > 0 ? 'flats' : 'bungalows');
    const isFlats = structureType === 'flats' || structureType === 'hybrid';
    const isBungalows = structureType === 'bungalows' || structureType === 'hybrid' || !!rawPayload.enable_bungalows;

    const latNum = rawPayload.society.latitude !== undefined && rawPayload.society.latitude !== null && rawPayload.society.latitude !== ''
      ? parseFloat(String(rawPayload.society.latitude))
      : undefined;

    const lngNum = rawPayload.society.longitude !== undefined && rawPayload.society.longitude !== null && rawPayload.society.longitude !== ''
      ? parseFloat(String(rawPayload.society.longitude))
      : undefined;

    const sanitizedSociety = {
      name: rawPayload.society.name.trim(),
      code: rawPayload.society.code?.trim() || undefined,
      address_line1: rawPayload.society.address_line1?.trim() || undefined,
      address_line2: rawPayload.society.address_line2?.trim() || undefined,
      city: rawPayload.society.city?.trim() || undefined,
      state: rawPayload.society.state?.trim() || undefined,
      postal_code: rawPayload.society.postal_code?.trim() || undefined,
      latitude: isNaN(latNum as number) ? undefined : latNum,
      longitude: isNaN(lngNum as number) ? undefined : lngNum,
      contact_name: rawPayload.society.contact_name?.trim() || undefined,
      contact_phone: rawPayload.society.contact_phone?.trim() || undefined,
      contact_email: rawPayload.society.contact_email?.trim() || undefined,
      status: rawPayload.society.status || 'active',
    };

    const sanitizedPayload: SetupWizardPayload = {
      structure_type: structureType,
      society: sanitizedSociety,
      blocks: isFlats ? (rawPayload.blocks || []) : [],
      bungalows_config: isBungalows
        ? (rawPayload.bungalows_config || {
            prefix: 'Villa-',
            count: rawPayload.bungalows_count || 20,
            starting_number: 1,
            bungalow_type: '3 BHK Villa',
          })
        : undefined,
      enable_bungalows: isBungalows,
      bungalows_count: isBungalows ? (rawPayload.bungalows_config?.count || rawPayload.bungalows_count || 20) : 0,
      mapped_owners: rawPayload.mapped_owners || [],
    };

    try {
      // Attempt backend setup-wizard endpoint first
      const response = await axiosClient.post<ApiResponse<SocietyItem>>('/societies/setup-wizard', sanitizedPayload);
      if (response.data && response.data.success) {
        return response.data;
      }
    } catch (err: any) {
      console.warn('Dedicated setup-wizard endpoint error or 404, falling back to sequential orchestration:', err);
    }

    // Sequential Orchestration Fallback:
    // 1. Create Society
    const societyRes = await societiesService.create(sanitizedSociety);
    if (!societyRes.success || !societyRes.data) {
      throw new Error(societyRes.message || 'Failed to create society');
    }
    const createdSociety = societyRes.data;

    // 2. Configure Structure
    await societiesService.updateStructure(createdSociety.id, {
      flat_enabled: isFlats,
      bungalow_enabled: isBungalows,
      setup_completed: true,
    }).catch(() => null);

    const createdFlatsByNumber: Record<string, string> = {};
    const createdBungalowsByNumber: Record<string, string> = {};

    // 3. Create Blocks, Floors, and Flats if enabled
    if (isFlats && sanitizedPayload.blocks) {
      for (const blockConfig of sanitizedPayload.blocks) {
        try {
          const blockRes = await blocksService.create({
            society_id: createdSociety.id,
            name: blockConfig.name,
            code: blockConfig.code || blockConfig.name.substring(0, 4).toUpperCase(),
            status: 'active',
          });

          if (blockRes.success && blockRes.data) {
            const blockId = blockRes.data.id;
            const totalFloors = blockConfig.floors_count || 1;
            const flatsPerFloor = blockConfig.flats_per_floor || 4;
            const seriesStart = blockConfig.series_start || 101;
            const flatType = blockConfig.flat_type || '2 BHK';

            // Create Floors & Flats
            for (let f = 1; f <= totalFloors; f++) {
              const floorRes = await floorsService.create({
                block_id: blockId,
                floor_number: f,
                name: `Floor ${f}`,
                status: 'active',
              });

              if (floorRes.success && floorRes.data) {
                const floorId = floorRes.data.id;
                for (let unit = 1; unit <= flatsPerFloor; unit++) {
                  let unitNumber: string;
                  if (seriesStart >= 1000) {
                    unitNumber = `${f * 1000 + unit}`;
                  } else {
                    unitNumber = `${f * 100 + unit}`;
                  }

                  const flatRes = await flatsService.create({
                    floor_id: floorId,
                    flat_number: unitNumber,
                    flat_type: flatType,
                    status: 'vacant',
                  }).catch(() => null);

                  if (flatRes?.data?.id) {
                    createdFlatsByNumber[`${blockConfig.name}-${unitNumber}`] = flatRes.data.id;
                    createdFlatsByNumber[unitNumber] = flatRes.data.id;
                  }
                }
              }
            }

            // Commercial Shops if enabled
            if (blockConfig.has_commercial_shops && (blockConfig.commercial_shops_count || 0) > 0) {
              const gfRes = await floorsService.create({
                block_id: blockId,
                floor_number: 0,
                name: 'Ground Floor (Commercial)',
                status: 'active',
              }).catch(() => null);

              const gfId = gfRes?.data?.id;
              if (gfId) {
                for (let s = 1; s <= (blockConfig.commercial_shops_count || 0); s++) {
                  const shopNumber = `Shop-${s}`;
                  const shopRes = await flatsService.create({
                    floor_id: gfId,
                    flat_number: shopNumber,
                    flat_type: 'Commercial Shop',
                    status: 'vacant',
                  }).catch(() => null);

                  if (shopRes?.data?.id) {
                    createdFlatsByNumber[`${blockConfig.name}-${shopNumber}`] = shopRes.data.id;
                    createdFlatsByNumber[shopNumber] = shopRes.data.id;
                  }
                }
              }
            }
          }
        } catch (blockErr) {
          console.error('Error generating block hierarchy:', blockErr);
        }
      }
    }

    // 4. Create Bungalows if enabled
    if (isBungalows) {
      const bConfig = sanitizedPayload.bungalows_config || {
        prefix: 'Villa-',
        count: sanitizedPayload.bungalows_count || 20,
        starting_number: 1,
        bungalow_type: '3 BHK Villa',
      };
      const bCount = bConfig.count || 20;
      const bPrefix = bConfig.prefix || 'Villa-';
      const bStart = bConfig.starting_number || 1;
      const bType = bConfig.bungalow_type || 'Independent Villa';

      for (let b = 0; b < bCount; b++) {
        const bungalowNum = `${bPrefix}${bStart + b}`;
        const bRes = await bungalowsService.create({
          society_id: createdSociety.id,
          bungalow_number: bungalowNum,
          bungalow_type: bType,
          status: 'vacant',
        }).catch(() => null);

        if (bRes?.data?.id) {
          createdBungalowsByNumber[bungalowNum] = bRes.data.id;
        }
      }
    }

    // 5. Create and Map Owners if provided in payload
    if (sanitizedPayload.mapped_owners && sanitizedPayload.mapped_owners.length > 0) {
      for (const owner of sanitizedPayload.mapped_owners) {
        try {
          const flatId = createdFlatsByNumber[owner.unit_identifier] || createdFlatsByNumber[owner.unit_number];
          const bungalowId = createdBungalowsByNumber[owner.unit_identifier] || createdBungalowsByNumber[owner.unit_number];

          if (flatId || bungalowId) {
            await personsService.create({
              flat_id: flatId,
              bungalow_id: bungalowId,
              full_name: owner.full_name,
              phone: owner.phone || undefined,
              email: owner.email || undefined,
              relationship_to_owner: owner.relationship_to_owner || 'Primary Owner',
              is_primary_owner: owner.is_primary_owner ?? true,
            }).catch(() => null);
          }
        } catch (ownerErr) {
          console.error('Error mapping owner in setup wizard:', ownerErr);
        }
      }
    }

    return societyRes;
  },

  // Get Consolidated Hierarchy for Structure Explorer
  getHierarchy: async (societyId: string): Promise<SocietyHierarchyData> => {
    // Attempt dedicated hierarchy endpoint first
    try {
      const res = await axiosClient.get<ApiResponse<SocietyHierarchyData>>(`/societies/${societyId}/hierarchy`);
      if (res.data?.success && res.data.data) {
        return res.data.data;
      }
    } catch {
      // fallback to multi-fetch aggregation
    }

    // Multi-fetch aggregation fallback:
    const [socRes, structRes, blocksRes, floorsRes, flatsRes, bungalowsRes, personsRes] = await Promise.all([
      societiesService.getById(societyId),
      societiesService.getStructure(societyId).catch(() => null),
      blocksService.getAll({ societyId, limit: 100 }).catch(() => ({ data: [] })),
      floorsService.getAll({ societyId, limit: 200 }).catch(() => ({ data: [] })),
      flatsService.getAll({ societyId, limit: 1000 }).catch(() => ({ data: [] })),
      bungalowsService.getAll({ societyId, limit: 200 }).catch(() => ({ data: [] })),
      personsService.getAll({ societyId, limit: 1000 }).catch(() => ({ data: [] })),
    ]);

    const society = socRes.data || ({} as SocietyItem);
    const structureConfig = structRes?.data;
    const blocks = blocksRes.data || [];
    const floors = floorsRes.data || [];
    const flats = flatsRes.data || [];
    const bungalows = bungalowsRes.data || [];
    const persons = personsRes.data || [];

    // Map residents to flat_id and bungalow_id
    const personsByFlat: Record<string, PersonItem[]> = {};
    const personsByBungalow: Record<string, PersonItem[]> = {};

    persons.forEach((p) => {
      if (p.flat_id) {
        if (!personsByFlat[p.flat_id]) personsByFlat[p.flat_id] = [];
        personsByFlat[p.flat_id].push(p);
      }
      if (p.bungalow_id) {
        if (!personsByBungalow[p.bungalow_id]) personsByBungalow[p.bungalow_id] = [];
        personsByBungalow[p.bungalow_id].push(p);
      }
    });

    // Map flats to floors
    const flatsByFloor: Record<string, FlatItem[]> = {};
    flats.forEach((flat) => {
      const residents = personsByFlat[flat.id] || [];
      const primaryOwner = residents.find((r) => r.is_primary_owner) || null;
      const enhancedFlat = {
        ...flat,
        residents,
        primaryOwner,
        status: residents.length > 0 ? 'occupied' : (flat.status || 'vacant'),
      };
      if (!flatsByFloor[flat.floor_id]) flatsByFloor[flat.floor_id] = [];
      flatsByFloor[flat.floor_id].push(enhancedFlat);
    });

    // Map floors to blocks
    const floorsByBlock: Record<string, FloorItem[]> = {};
    floors.forEach((floor) => {
      const floorFlats = flatsByFloor[floor.id] || [];
      const enhancedFloor = {
        ...floor,
        flatsList: floorFlats,
      };
      if (!floorsByBlock[floor.block_id]) floorsByBlock[floor.block_id] = [];
      floorsByBlock[floor.block_id].push(enhancedFloor);
    });

    let totalShopsCount = 0;
    let totalFlatsCount = 0;

    // Assemble hierarchical blocks
    const hierarchicalBlocks = blocks.map((block) => {
      const blockFloors = floorsByBlock[block.id] || [];
      const residentialFloors = blockFloors.filter((f) => (f.floor_number ?? 1) > 0);
      const groundFloor = blockFloors.find((f) => (f.floor_number ?? 1) === 0);
      const commercialShops = (groundFloor?.flats as any) || (flatsByFloor[groundFloor?.id || ''] || []);

      totalShopsCount += commercialShops.length;
      residentialFloors.forEach((f) => {
        totalFlatsCount += (flatsByFloor[f.id] || []).length;
      });

      return {
        ...block,
        floorsList: residentialFloors.sort((a, b) => (a.floor_number ?? 0) - (b.floor_number ?? 0)),
        commercialShops: commercialShops,
      };
    });

    const hierarchicalBungalows = bungalows.map((b) => {
      const residents = personsByBungalow[b.id] || [];
      const primaryOwner = residents.find((r) => r.is_primary_owner) || null;
      return {
        ...b,
        residents,
        primaryOwner,
        status: residents.length > 0 ? 'occupied' : (b.status || 'vacant'),
      };
    });

    const totalUnits = totalFlatsCount + totalShopsCount + hierarchicalBungalows.length;
    const occupiedUnits = flats.filter((f) => (personsByFlat[f.id] || []).length > 0).length +
      hierarchicalBungalows.filter((b) => (personsByBungalow[b.id] || []).length > 0).length;

    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return {
      society,
      structureConfig,
      blocks: hierarchicalBlocks,
      bungalows: hierarchicalBungalows,
      totalFloors: floors.length,
      totalFlats: totalFlatsCount,
      totalShops: totalShopsCount,
      totalBungalows: hierarchicalBungalows.length,
      totalResidents: persons.length,
      occupancyRate,
    };
  },

  // Get User Quota Status (Active / 20)
  getUserQuota: async (societyId: string): Promise<SocietyUserQuotaData> => {
    try {
      const res = await usersService.getAll({ societyId, limit: 100 });
      const users = res.data || [];
      const activeUsers = users.filter((u) => u.status === 'active').length;
      const maxUsers = 20; // Default quota per society
      const usagePercentage = Math.min(Math.round((activeUsers / maxUsers) * 100), 100);

      return {
        activeUsers,
        maxUsers,
        usagePercentage,
        users,
      };
    } catch {
      return {
        activeUsers: 0,
        maxUsers: 20,
        usagePercentage: 0,
        users: [],
      };
    }
  },

  // Download Pre-Filled Society Template
  downloadPreFilledTemplate: async (societyId: string, societyName?: string): Promise<Blob> => {
    try {
      const response = await axiosClient.get(`/societies/${societyId}/template`, {
        responseType: 'blob',
      });
      return response.data;
    } catch {
      // Fallback sample CSV generation
      const csvContent =
        `# Pre-filled Owner Import Template for: ${societyName || 'Society'}\n` +
        `Block Name,Floor Number,Flat Number,Primary Owner Full Name,Phone Number,Email Address,Occupancy Status\n` +
        `Block A,1,101,John Doe,9876543210,john.doe@example.com,Owner\n` +
        `Block A,1,102,Jane Smith,9876543211,jane.smith@example.com,Tenant\n` +
        `Block A,2,201,Rajesh Patel,9876543212,rajesh.patel@example.com,Owner\n`;
      return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    }
  },
};

