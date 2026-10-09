import axiosClient from './axiosClient';
import {
  ApiResponse,
  PaginatedResponse,
  ExpenseItem,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpensesQueryParams,
  ExpenseSummaryMetrics,
} from '../types';

export const expensesService = {
  getAll: async (params?: ExpensesQueryParams): Promise<PaginatedResponse<ExpenseItem>> => {
    const response = await axiosClient.get<PaginatedResponse<ExpenseItem>>('/expenses', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<ExpenseItem>> => {
    const response = await axiosClient.get<ApiResponse<ExpenseItem>>(`/expenses/${id}`);
    return response.data;
  },

  getSummary: async (params?: Partial<ExpensesQueryParams>): Promise<ApiResponse<ExpenseSummaryMetrics>> => {
    const response = await axiosClient.get<ApiResponse<ExpenseSummaryMetrics>>('/expenses/summary', { params });
    return response.data;
  },

  create: async (data: CreateExpenseInput | FormData): Promise<ApiResponse<ExpenseItem>> => {
    const isFormData = data instanceof FormData;
    const response = await axiosClient.post<ApiResponse<ExpenseItem>>('/expenses', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  update: async (id: string, data: UpdateExpenseInput | FormData): Promise<ApiResponse<ExpenseItem>> => {
    const isFormData = data instanceof FormData;
    const response = await axiosClient.put<ApiResponse<ExpenseItem>>(`/expenses/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(`/expenses/${id}`);
    return response.data;
  },
};
