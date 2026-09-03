import axiosClient from './axiosClient';
import { ApiResponse, SystemDashboardData } from '../types';

export const dashboardService = {
  getSystemDashboard: async (): Promise<ApiResponse<SystemDashboardData>> => {
    const response = await axiosClient.get<ApiResponse<SystemDashboardData>>('/dashboard');
    return response.data;
  },

  getSocietyDashboard: async (societyId: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.get<ApiResponse<any>>(`/dashboard/societies/${societyId}`);
    return response.data;
  },

  getSocietyDashboardAlt: async (societyId: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.get<ApiResponse<any>>(`/societies/${societyId}/dashboard`);
    return response.data;
  },

  getEventDashboard: async (eventId: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.get<ApiResponse<any>>(`/dashboard/events/${eventId}`);
    return response.data;
  },
};
