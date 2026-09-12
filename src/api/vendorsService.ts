import axiosClient from './axiosClient';
import { ApiResponse, PaginatedResponse, QueryParams, VendorItem, CreateVendorInput, UpdateVendorInput } from '../types';

export const vendorsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<VendorItem>> => {
    const response = await axiosClient.get<PaginatedResponse<VendorItem>>('/vendors', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<VendorItem>> => {
    const response = await axiosClient.get<ApiResponse<VendorItem>>(`/vendors/${id}`);
    return response.data;
  },

  create: async (data: CreateVendorInput): Promise<ApiResponse<VendorItem>> => {
    const response = await axiosClient.post<ApiResponse<VendorItem>>('/vendors', data);
    return response.data;
  },

  update: async (id: string, data: UpdateVendorInput): Promise<ApiResponse<VendorItem>> => {
    const response = await axiosClient.patch<ApiResponse<VendorItem>>(`/vendors/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/vendors/${id}`);
    return response.data;
  },
};
