import axiosClient from './axiosClient';
import { ApiResponse, EventConfigurationItem, EventItem, PaginatedResponse, QueryParams } from '../types';

export const eventsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<EventItem>> => {
    const response = await axiosClient.get<PaginatedResponse<EventItem>>('/events', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<EventItem>> => {
    const response = await axiosClient.get<ApiResponse<EventItem>>(`/events/${id}`);
    return response.data;
  },

  create: async (data: Partial<EventItem> & { configuration?: Partial<EventConfigurationItem> }): Promise<ApiResponse<EventItem>> => {
    const response = await axiosClient.post<ApiResponse<EventItem>>('/events', data);
    return response.data;
  },

  update: async (id: string, data: Partial<EventItem>): Promise<ApiResponse<EventItem>> => {
    const response = await axiosClient.patch<ApiResponse<EventItem>>(`/events/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/events/${id}`);
    return response.data;
  },

  publish: async (id: string): Promise<ApiResponse<EventItem>> => {
    const response = await axiosClient.post<ApiResponse<EventItem>>(`/events/${id}/publish`);
    return response.data;
  },

  configure: async (id: string, config: Partial<EventConfigurationItem>): Promise<ApiResponse<EventConfigurationItem>> => {
    const response = await axiosClient.post<ApiResponse<EventConfigurationItem>>(`/events/${id}/configuration`, config);
    return response.data;
  },

  getDashboard: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.get<ApiResponse<any>>(`/events/${id}/dashboard`);
    return response.data;
  },
};
