import axiosClient from './axiosClient';
import { ApiResponse, PaginatedResponse, QueryParams, UserItem } from '../types';

export const usersService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<UserItem>> => {
    const response = await axiosClient.get<PaginatedResponse<UserItem>>('/users', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<UserItem>> => {
    const response = await axiosClient.get<ApiResponse<UserItem>>(`/users/${id}`);
    return response.data;
  },

  create: async (data: {
    role_id: string;
    full_name: string;
    email: string;
    password?: string;
    phone?: string | null;
    society_ids?: string[];
    status?: string;
  }): Promise<ApiResponse<UserItem>> => {
    const response = await axiosClient.post<ApiResponse<UserItem>>('/users', data);
    return response.data;
  },

  update: async (id: string, data: Partial<UserItem> & { password?: string; society_ids?: string[] }): Promise<ApiResponse<UserItem>> => {
    const response = await axiosClient.patch<ApiResponse<UserItem>>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/users/${id}`);
    return response.data;
  },
};
