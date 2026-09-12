import axiosClient from './axiosClient';
import {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  EventServiceGroupItem,
  CreateEventServiceGroupInput,
  UpdateEventServiceGroupInput,
} from '../types';

export const serviceGroupsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<EventServiceGroupItem>> => {
    const response = await axiosClient.get<PaginatedResponse<EventServiceGroupItem>>('/service-groups', {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<EventServiceGroupItem>> => {
    const response = await axiosClient.get<ApiResponse<EventServiceGroupItem>>(`/service-groups/${id}`);
    return response.data;
  },

  create: async (data: CreateEventServiceGroupInput): Promise<ApiResponse<EventServiceGroupItem>> => {
    const response = await axiosClient.post<ApiResponse<EventServiceGroupItem>>('/service-groups', data);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateEventServiceGroupInput
  ): Promise<ApiResponse<EventServiceGroupItem>> => {
    const response = await axiosClient.patch<ApiResponse<EventServiceGroupItem>>(`/service-groups/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      `/service-groups/${id}`
    );
    return response.data;
  },
};
