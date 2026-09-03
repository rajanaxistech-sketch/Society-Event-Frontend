import axiosClient from './axiosClient';
import { ApiResponse, EventCollectionItem, FlatItem, PaginatedResponse, PersonItem, QueryParams } from '../types';

export const flatsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<FlatItem>> => {
    const response = await axiosClient.get<PaginatedResponse<FlatItem>>('/flats', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<FlatItem>> => {
    const response = await axiosClient.get<ApiResponse<FlatItem>>(`/flats/${id}`);
    return response.data;
  },

  create: async (data: Partial<FlatItem>): Promise<ApiResponse<FlatItem>> => {
    const response = await axiosClient.post<ApiResponse<FlatItem>>('/flats', data);
    return response.data;
  },

  update: async (id: string, data: Partial<FlatItem>): Promise<ApiResponse<FlatItem>> => {
    const response = await axiosClient.patch<ApiResponse<FlatItem>>(`/flats/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/flats/${id}`);
    return response.data;
  },

  getResidents: async (id: string): Promise<ApiResponse<PersonItem[]>> => {
    const response = await axiosClient.get<ApiResponse<PersonItem[]>>(`/flats/${id}/residents`);
    return response.data;
  },

  getCollections: async (id: string): Promise<ApiResponse<EventCollectionItem[]>> => {
    const response = await axiosClient.get<ApiResponse<EventCollectionItem[]>>(`/flats/${id}/collections`);
    return response.data;
  },

  setPrimaryOwner: async (flatId: string, personId: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.patch<ApiResponse<any>>(`/flats/${flatId}/primary-owner/${personId}`);
    return response.data;
  },
};
