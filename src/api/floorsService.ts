import axiosClient from './axiosClient';
import { ApiResponse, FloorItem, PaginatedResponse, QueryParams } from '../types';

export const floorsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<FloorItem>> => {
    const response = await axiosClient.get<PaginatedResponse<FloorItem>>('/floors', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<FloorItem>> => {
    const response = await axiosClient.get<ApiResponse<FloorItem>>(`/floors/${id}`);
    return response.data;
  },

  create: async (data: Partial<FloorItem>): Promise<ApiResponse<FloorItem>> => {
    const response = await axiosClient.post<ApiResponse<FloorItem>>('/floors', data);
    return response.data;
  },

  update: async (id: string, data: Partial<FloorItem>): Promise<ApiResponse<FloorItem>> => {
    const response = await axiosClient.patch<ApiResponse<FloorItem>>(`/floors/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/floors/${id}`);
    return response.data;
  },
};
