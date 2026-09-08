import axiosClient from './axiosClient';
import { ApiResponse, CircularItem, PaginatedResponse, QueryParams } from '../types';

export const circularsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<CircularItem>> => {
    const response = await axiosClient.get<PaginatedResponse<CircularItem>>('/circulars', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<CircularItem>> => {
    const response = await axiosClient.get<ApiResponse<CircularItem>>(`/circulars/${id}`);
    return response.data;
  },

  create: async (formData: FormData): Promise<ApiResponse<CircularItem>> => {
    const response = await axiosClient.post<ApiResponse<CircularItem>>('/circulars', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: string, formData: FormData): Promise<ApiResponse<CircularItem>> => {
    const response = await axiosClient.put<ApiResponse<CircularItem>>(`/circulars/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/circulars/${id}`);
    return response.data;
  },

  publish: async (id: string): Promise<ApiResponse<CircularItem>> => {
    const response = await axiosClient.patch<ApiResponse<CircularItem>>(`/circulars/${id}/publish`);
    return response.data;
  },

  unpublish: async (id: string): Promise<ApiResponse<CircularItem>> => {
    const response = await axiosClient.patch<ApiResponse<CircularItem>>(`/circulars/${id}/unpublish`);
    return response.data;
  },

  getByEventId: async (eventId: string, params?: QueryParams): Promise<PaginatedResponse<CircularItem>> => {
    const response = await axiosClient.get<PaginatedResponse<CircularItem>>(`/events/${eventId}/circulars`, { params });
    return response.data;
  },
};
