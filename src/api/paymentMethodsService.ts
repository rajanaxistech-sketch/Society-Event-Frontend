import axiosClient from './axiosClient';
import { ApiResponse, PaymentMethodItem } from '../types';

export const paymentMethodsService = {
  getAll: async (): Promise<ApiResponse<PaymentMethodItem[]>> => {
    const response = await axiosClient.get<ApiResponse<PaymentMethodItem[]>>('/payment-methods');
    return response.data;
  },

  create: async (data: Partial<PaymentMethodItem> & {
    code: string;
    name: string;
  }): Promise<ApiResponse<PaymentMethodItem>> => {
    const response = await axiosClient.post<ApiResponse<PaymentMethodItem>>('/payment-methods', data);
    return response.data;
  },

  update: async (
    id: string,
    data: Partial<PaymentMethodItem>
  ): Promise<ApiResponse<PaymentMethodItem>> => {
    const response = await axiosClient.patch<ApiResponse<PaymentMethodItem>>(`/payment-methods/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/payment-methods/${id}`);
    return response.data;
  },
};
