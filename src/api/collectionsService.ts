import axiosClient from './axiosClient';
import { ApiResponse, EventCollectionItem, EventCollectionsDashboardData, PaginatedResponse, QueryParams } from '../types';

export const collectionsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<EventCollectionItem>> => {
    const response = await axiosClient.get<PaginatedResponse<EventCollectionItem>>('/collections', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<EventCollectionItem>> => {
    const response = await axiosClient.get<ApiResponse<EventCollectionItem>>(`/collections/${id}`);
    return response.data;
  },

  create: async (data: {
    event_id: string;
    flat_id?: string | null;
    bungalow_id?: string | null;
    default_amount?: number;
    custom_amount?: number | null;
    status?: string;
  }): Promise<ApiResponse<EventCollectionItem>> => {
    const response = await axiosClient.post<ApiResponse<EventCollectionItem>>('/collections', data);
    return response.data;
  },

  update: async (
    id: string,
    data: { custom_amount?: number | null; status?: string }
  ): Promise<ApiResponse<EventCollectionItem>> => {
    const response = await axiosClient.patch<ApiResponse<EventCollectionItem>>(`/collections/${id}`, data);
    return response.data;
  },

  listByEvent: async (eventId: string, params?: QueryParams): Promise<PaginatedResponse<EventCollectionItem>> => {
    const response = await axiosClient.get<PaginatedResponse<EventCollectionItem>>(`/events/${eventId}/collections`, {
      params,
    });
    return response.data;
  },

  getDashboardByEvent: async (eventId: string): Promise<ApiResponse<EventCollectionsDashboardData>> => {
    const response = await axiosClient.get<ApiResponse<EventCollectionsDashboardData>>(
      `/events/${eventId}/collections/dashboard`
    );
    return response.data;
  },
};
