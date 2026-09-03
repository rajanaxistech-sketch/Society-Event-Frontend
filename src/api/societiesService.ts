import axiosClient from './axiosClient';
import { ApiResponse, PaginatedResponse, QueryParams, SocietyItem, SocietyStructureConfig } from '../types';

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
};
