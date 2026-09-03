import axiosClient from './axiosClient';
import { ApiResponse, PaginatedResponse, QueryParams, RoleItem } from '../types';

export const rolesService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<RoleItem>> => {
    const response = await axiosClient.get<PaginatedResponse<RoleItem>>('/roles', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<RoleItem>> => {
    const response = await axiosClient.get<ApiResponse<RoleItem>>(`/roles/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string | null;
    permission_ids?: string[];
  }): Promise<ApiResponse<RoleItem>> => {
    const response = await axiosClient.post<ApiResponse<RoleItem>>('/roles', data);
    return response.data;
  },

  update: async (
    id: string,
    data: {
      name?: string;
      description?: string | null;
      permission_ids?: string[];
      status?: string;
    }
  ): Promise<ApiResponse<RoleItem>> => {
    const response = await axiosClient.patch<ApiResponse<RoleItem>>(`/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/roles/${id}`);
    return response.data;
  },
};
