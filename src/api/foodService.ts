import axiosClient from './axiosClient';
import { ApiResponse, FoodItemEntity, FoodDayMetaInput, PaginatedResponse, QueryParams } from '../types';

export const foodService = {
  listByEvent: async (eventId: string, params?: QueryParams): Promise<PaginatedResponse<FoodItemEntity>> => {
    const response = await axiosClient.get<PaginatedResponse<FoodItemEntity>>(`/events/${eventId}/food`, { params });
    return response.data;
  },

  createForEvent: async (eventId: string, data: Partial<FoodItemEntity>): Promise<ApiResponse<FoodItemEntity>> => {
    const response = await axiosClient.post<ApiResponse<FoodItemEntity>>(`/events/${eventId}/food`, data);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<FoodItemEntity>> => {
    const response = await axiosClient.get<ApiResponse<FoodItemEntity>>(`/food/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<FoodItemEntity>): Promise<ApiResponse<FoodItemEntity>> => {
    const response = await axiosClient.patch<ApiResponse<FoodItemEntity>>(`/food/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/food/${id}`);
    return response.data;
  },

  updateDayMeta: async (eventId: string, dayNumber: number, data: FoodDayMetaInput): Promise<ApiResponse<any>> => {
    const response = await axiosClient.patch<ApiResponse<any>>(`/events/${eventId}/food-days/${dayNumber}`, data);
    return response.data;
  },

  deleteDay: async (eventId: string, dayNumber: number): Promise<ApiResponse<{ deletedCount: number }>> => {
    const response = await axiosClient.delete<ApiResponse<{ deletedCount: number }>>(`/events/${eventId}/food-days/${dayNumber}`);
    return response.data;
  },
};

