import axiosClient from './axiosClient';
import { ApiResponse, BungalowItem, EventCollectionItem, PaginatedResponse, PersonItem, QueryParams } from '../types';

export const bungalowsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<BungalowItem>> => {
    const response = await axiosClient.get<PaginatedResponse<BungalowItem>>('/bungalows', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<BungalowItem>> => {
    const response = await axiosClient.get<ApiResponse<BungalowItem>>(`/bungalows/${id}`);
    return response.data;
  },

  create: async (data: Partial<BungalowItem>): Promise<ApiResponse<BungalowItem>> => {
    const response = await axiosClient.post<ApiResponse<BungalowItem>>('/bungalows', data);
    return response.data;
  },

  update: async (id: string, data: Partial<BungalowItem>): Promise<ApiResponse<BungalowItem>> => {
    const response = await axiosClient.patch<ApiResponse<BungalowItem>>(`/bungalows/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/bungalows/${id}`);
    return response.data;
  },

  getResidents: async (id: string): Promise<ApiResponse<PersonItem[]>> => {
    const response = await axiosClient.get<ApiResponse<PersonItem[]>>(`/bungalows/${id}/residents`);
    return response.data;
  },

  getCollections: async (id: string): Promise<ApiResponse<EventCollectionItem[]>> => {
    const response = await axiosClient.get<ApiResponse<EventCollectionItem[]>>(`/bungalows/${id}/collections`);
    return response.data;
  },

  setPrimaryOwner: async (bungalowId: string, personId: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.patch<ApiResponse<any>>(`/bungalows/${bungalowId}/primary-owner/${personId}`);
    return response.data;
  },
};
