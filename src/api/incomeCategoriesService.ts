import axiosClient from './axiosClient';
import {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  IncomeCategoryItem,
  CreateIncomeCategoryInput,
  UpdateIncomeCategoryInput,
} from '../types';

export const incomeCategoriesService = {
  getAll: async (
    params?: QueryParams & { categoryType?: string; societyId?: string }
  ): Promise<PaginatedResponse<IncomeCategoryItem>> => {
    const response = await axiosClient.get<PaginatedResponse<IncomeCategoryItem>>('/income-categories', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<IncomeCategoryItem>> => {
    const response = await axiosClient.get<ApiResponse<IncomeCategoryItem>>(`/income-categories/${id}`);
    return response.data;
  },

  create: async (data: CreateIncomeCategoryInput): Promise<ApiResponse<IncomeCategoryItem>> => {
    const response = await axiosClient.post<ApiResponse<IncomeCategoryItem>>('/income-categories', data);
    return response.data;
  },

  update: async (id: string, data: UpdateIncomeCategoryInput): Promise<ApiResponse<IncomeCategoryItem>> => {
    const response = await axiosClient.patch<ApiResponse<IncomeCategoryItem>>(`/income-categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/income-categories/${id}`);
    return response.data;
  },
};
