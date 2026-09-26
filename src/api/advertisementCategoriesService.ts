import axiosClient from './axiosClient';
import {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  AdvertisementCategoryItem,
  CreateAdvertisementCategoryInput,
  UpdateAdvertisementCategoryInput,
} from '../types';

export const advertisementCategoriesService = {
  getAll: async (params?: QueryParams & { societyId?: string }): Promise<PaginatedResponse<AdvertisementCategoryItem>> => {
    const response = await axiosClient.get<PaginatedResponse<AdvertisementCategoryItem>>('/advertisement-categories', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<AdvertisementCategoryItem>> => {
    const response = await axiosClient.get<ApiResponse<AdvertisementCategoryItem>>(`/advertisement-categories/${id}`);
    return response.data;
  },

  create: async (data: CreateAdvertisementCategoryInput): Promise<ApiResponse<AdvertisementCategoryItem>> => {
    const response = await axiosClient.post<ApiResponse<AdvertisementCategoryItem>>('/advertisement-categories', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAdvertisementCategoryInput): Promise<ApiResponse<AdvertisementCategoryItem>> => {
    const response = await axiosClient.patch<ApiResponse<AdvertisementCategoryItem>>(`/advertisement-categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/advertisement-categories/${id}`);
    return response.data;
  },
};
