import axiosClient from './axiosClient';
import { ApiResponse, EventActivityItem, PaginatedResponse, QueryParams } from '../types';

export const activitiesService = {
  listByEvent: async (eventId: string, params?: QueryParams): Promise<PaginatedResponse<EventActivityItem>> => {
    const response = await axiosClient.get<PaginatedResponse<EventActivityItem>>(`/events/${eventId}/activities`, {
      params,
    });
    return response.data;
  },

  createForEvent: async (eventId: string, data: Partial<EventActivityItem>): Promise<ApiResponse<EventActivityItem>> => {
    const response = await axiosClient.post<ApiResponse<EventActivityItem>>(`/events/${eventId}/activities`, data);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<EventActivityItem>> => {
    const response = await axiosClient.get<ApiResponse<EventActivityItem>>(`/activities/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<EventActivityItem>): Promise<ApiResponse<EventActivityItem>> => {
    const response = await axiosClient.patch<ApiResponse<EventActivityItem>>(`/activities/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/activities/${id}`);
    return response.data;
  },
};
