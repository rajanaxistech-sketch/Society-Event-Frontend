import axiosClient from './axiosClient';
import {
  ApiResponse,
  PaginatedResponse,
  QueryParams,
  ExpenseCategoryItem,
  CreateExpenseCategoryInput,
  UpdateExpenseCategoryInput,
} from '../types';

export const expenseCategoriesService = {
  getAll: async (params?: QueryParams & { societyId?: string }): Promise<PaginatedResponse<ExpenseCategoryItem>> => {
    const response = await axiosClient.get<PaginatedResponse<ExpenseCategoryItem>>('/expense-categories', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<ExpenseCategoryItem>> => {
    const response = await axiosClient.get<ApiResponse<ExpenseCategoryItem>>(`/expense-categories/${id}`);
    return response.data;
  },

  create: async (data: CreateExpenseCategoryInput): Promise<ApiResponse<ExpenseCategoryItem>> => {
    const response = await axiosClient.post<ApiResponse<ExpenseCategoryItem>>('/expense-categories', data);
    return response.data;
  },

  update: async (id: string, data: UpdateExpenseCategoryInput): Promise<ApiResponse<ExpenseCategoryItem>> => {
    const response = await axiosClient.patch<ApiResponse<ExpenseCategoryItem>>(`/expense-categories/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/expense-categories/${id}`);
    return response.data;
  },
};
