import axiosClient from './axiosClient';
import { ApiResponse, PaginatedResponse, PersonItem, QueryParams } from '../types';

export const personsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<PersonItem>> => {
    const response = await axiosClient.get<PaginatedResponse<PersonItem>>('/persons', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<PersonItem>> => {
    const response = await axiosClient.get<ApiResponse<PersonItem>>(`/persons/${id}`);
    return response.data;
  },

  create: async (data: {
    flat_id?: string | null;
    bungalow_id?: string | null;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    relationship_to_owner?: string | null;
    is_primary_owner?: boolean;
    status?: string;
  }): Promise<ApiResponse<PersonItem>> => {
    const response = await axiosClient.post<ApiResponse<PersonItem>>('/persons', data);
    return response.data;
  },

  update: async (id: string, data: Partial<PersonItem>): Promise<ApiResponse<PersonItem>> => {
    const response = await axiosClient.patch<ApiResponse<PersonItem>>(`/persons/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/persons/${id}`);
    return response.data;
  },
};
