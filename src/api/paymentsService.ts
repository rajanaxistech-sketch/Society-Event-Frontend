import axiosClient from './axiosClient';
import { ApiResponse, PaginatedResponse, PaymentItem, QueryParams } from '../types';

export const paymentsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<PaymentItem>> => {
    const response = await axiosClient.get<PaginatedResponse<PaymentItem>>('/payments', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<PaymentItem>> => {
    const response = await axiosClient.get<ApiResponse<PaymentItem>>(`/payments/${id}`);
    return response.data;
  },

  record: async (data: {
    collection_id?: string | null;
    event_collection_id?: string | null;
    sponsor_id?: string | null;
    payment_method_id: string;
    amount?: number;
    amount_paid?: number;
    payment_date?: string;
    transaction_reference?: string | null;
    receipt_number?: string | null;
    collector_user_id?: string | null;
    cheque_number?: string | null;
    bank_name?: string | null;
    cheque_date?: string | null;
    clearing_status?: string | null;
    notes?: string | null;
  }): Promise<ApiResponse<PaymentItem>> => {
    const payload = {
      ...data,
      collection_id: data.collection_id || data.event_collection_id,
      amount: data.amount ?? data.amount_paid,
    };
    const response = await axiosClient.post<ApiResponse<PaymentItem>>('/payments', payload);
    return response.data;
  },

  create: async (data: any): Promise<ApiResponse<PaymentItem>> => {
    return paymentsService.record(data);
  },

  reverse: async (id: string, reason: string): Promise<ApiResponse<PaymentItem>> => {
    const response = await axiosClient.post<ApiResponse<PaymentItem>>(`/payments/${id}/reverse`, { reason });
    return response.data;
  },
};
