import axiosClient from './axiosClient';
import { ApiResponse, SystemSettingItem } from '../types';

export const settingsService = {
  getAll: async (): Promise<ApiResponse<SystemSettingItem[]>> => {
    const response = await axiosClient.get<ApiResponse<SystemSettingItem[]>>('/settings');
    return response.data;
  },

  update: async (
    key: string,
    data: { value: any; description?: string | null }
  ): Promise<ApiResponse<SystemSettingItem>> => {
    const response = await axiosClient.patch<ApiResponse<SystemSettingItem>>(`/settings/${key}`, data);
    return response.data;
  },

  updateBulk: async (settings: Record<string, any>): Promise<ApiResponse<any>> => {
    const response = await axiosClient.post<ApiResponse<any>>('/settings/bulk', { settings });
    return response.data;
  },
};
