import axiosClient from './axiosClient';
import { ApiResponse, BlockItem, PaginatedResponse, QueryParams } from '../types';

export const blocksService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<BlockItem>> => {
    const response = await axiosClient.get<PaginatedResponse<BlockItem>>('/blocks', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<BlockItem>> => {
    const response = await axiosClient.get<ApiResponse<BlockItem>>(`/blocks/${id}`);
    return response.data;
  },

  create: async (data: Partial<BlockItem>): Promise<ApiResponse<BlockItem>> => {
    const response = await axiosClient.post<ApiResponse<BlockItem>>('/blocks', data);
    return response.data;
  },

  update: async (id: string, data: Partial<BlockItem>): Promise<ApiResponse<BlockItem>> => {
    const response = await axiosClient.patch<ApiResponse<BlockItem>>(`/blocks/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/blocks/${id}`);
    return response.data;
  },
};
