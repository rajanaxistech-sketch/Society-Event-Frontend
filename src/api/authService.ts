import axiosClient from './axiosClient';
import { ApiResponse, AuthUser, LoginResponseData } from '../types';

export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<ApiResponse<LoginResponseData>> => {
    const response = await axiosClient.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
    return response.data;
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<any>> => {
    const response = await axiosClient.post<ApiResponse<any>>('/auth/refresh', { refreshToken });
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await axiosClient.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<AuthUser>> => {
    const response = await axiosClient.get<ApiResponse<AuthUser>>('/auth/me');
    return response.data;
  },
};
