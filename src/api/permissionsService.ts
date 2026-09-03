import axiosClient from './axiosClient';
import { ApiResponse, PermissionItem } from '../types';

export const permissionsService = {
  getAll: async (): Promise<ApiResponse<PermissionItem[]>> => {
    const response = await axiosClient.get<ApiResponse<PermissionItem[]>>('/permissions');
    return response.data;
  },
};
