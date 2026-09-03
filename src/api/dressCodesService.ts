import axiosClient from './axiosClient';
import { ApiResponse, DressCodeItem, PaginatedResponse, QueryParams } from '../types';

export const dressCodesService = {
  listByEvent: async (eventId: string, params?: QueryParams): Promise<PaginatedResponse<DressCodeItem>> => {
    const response = await axiosClient.get<PaginatedResponse<DressCodeItem>>(`/events/${eventId}/dress-codes`, { params });
    return response.data;
  },

  createForEvent: async (eventId: string, data: Partial<DressCodeItem>): Promise<ApiResponse<DressCodeItem>> => {
    const response = await axiosClient.post<ApiResponse<DressCodeItem>>(`/events/${eventId}/dress-codes`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<DressCodeItem>): Promise<ApiResponse<DressCodeItem>> => {
    const response = await axiosClient.patch<ApiResponse<DressCodeItem>>(`/dress-codes/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/dress-codes/${id}`);
    return response.data;
  },
};
