import axiosClient from './axiosClient';
import {
  ApiResponse,
  PaginatedResponse,
  SombhaWelfareItem,
  CreateSombhaWelfareInput,
  UpdateSombhaWelfareInput,
  SombhaWelfareSummary,
} from '../types';

export interface SombhaWelfareQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  societyId?: string;
  society_id?: string;
  eventId?: string;
  event_id?: string;
  modeOfPayment?: string;
  mode_of_payment?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const sombhaWelfareService = {
  getAll: async (params?: SombhaWelfareQueryParams): Promise<PaginatedResponse<SombhaWelfareItem>> => {
    const response = await axiosClient.get<PaginatedResponse<SombhaWelfareItem>>('/sombha-welfare', { params });
    return response.data;
  },

  getSummary: async (params?: Partial<SombhaWelfareQueryParams>): Promise<ApiResponse<SombhaWelfareSummary>> => {
    const response = await axiosClient.get<ApiResponse<SombhaWelfareSummary>>('/sombha-welfare/summary', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<SombhaWelfareItem>> => {
    const response = await axiosClient.get<ApiResponse<SombhaWelfareItem>>(`/sombha-welfare/${id}`);
    return response.data;
  },

  create: async (data: CreateSombhaWelfareInput): Promise<ApiResponse<SombhaWelfareItem>> => {
    const response = await axiosClient.post<ApiResponse<SombhaWelfareItem>>('/sombha-welfare', data);
    return response.data;
  },

  update: async (id: string, data: UpdateSombhaWelfareInput): Promise<ApiResponse<SombhaWelfareItem>> => {
    const response = await axiosClient.put<ApiResponse<SombhaWelfareItem>>(`/sombha-welfare/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ success: boolean; message: string }>> => {
    const response = await axiosClient.delete<ApiResponse<{ success: boolean; message: string }>>(`/sombha-welfare/${id}`);
    return response.data;
  },
};
