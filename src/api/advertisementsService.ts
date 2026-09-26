import axiosClient from './axiosClient';
import {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  AdvertisementItem,
  CreateAdvertisementInput,
  UpdateAdvertisementInput,
} from '../types';

export interface AdvertisementsQueryParams extends QueryParams {
  societyId?: string;
  eventId?: string;
  advertisementCategoryId?: string;
  paymentStatus?: string;
  modeOfPayment?: string;
}

export const advertisementsService = {
  getAll: async (params?: AdvertisementsQueryParams): Promise<PaginatedResponse<AdvertisementItem>> => {
    const response = await axiosClient.get<PaginatedResponse<AdvertisementItem>>('/advertisements', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<AdvertisementItem>> => {
    const response = await axiosClient.get<ApiResponse<AdvertisementItem>>(`/advertisements/${id}`);
    return response.data;
  },

  create: async (data: CreateAdvertisementInput): Promise<ApiResponse<AdvertisementItem>> => {
    const response = await axiosClient.post<ApiResponse<AdvertisementItem>>('/advertisements', data);
    return response.data;
  },

  update: async (id: string, data: UpdateAdvertisementInput): Promise<ApiResponse<AdvertisementItem>> => {
    const response = await axiosClient.patch<ApiResponse<AdvertisementItem>>(`/advertisements/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/advertisements/${id}`);
    return response.data;
  },
};
