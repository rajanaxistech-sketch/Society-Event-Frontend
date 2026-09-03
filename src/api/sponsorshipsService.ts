import axiosClient from './axiosClient';
import { ApiResponse, PaginatedResponse, QueryParams, SponsorItem, SponsorshipPaymentItem } from '../types';

export const sponsorshipsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<SponsorItem>> => {
    const response = await axiosClient.get<PaginatedResponse<SponsorItem>>('/sponsors', { params });
    return response.data;
  },

  listByEvent: async (eventId: string, params?: QueryParams): Promise<PaginatedResponse<SponsorItem>> => {
    const response = await axiosClient.get<PaginatedResponse<SponsorItem>>(`/events/${eventId}/sponsors`, { params });
    return response.data;
  },

  createForEvent: async (eventId: string, data: Partial<SponsorItem>): Promise<ApiResponse<SponsorItem>> => {
    const response = await axiosClient.post<ApiResponse<SponsorItem>>(`/events/${eventId}/sponsors`, data);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<SponsorItem>> => {
    const response = await axiosClient.get<ApiResponse<SponsorItem>>(`/sponsors/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<SponsorItem>): Promise<ApiResponse<SponsorItem>> => {
    const response = await axiosClient.patch<ApiResponse<SponsorItem>>(`/sponsors/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await axiosClient.delete<ApiResponse<null>>(`/sponsors/${id}`);
    return response.data;
  },

  recordPayment: async (
    sponsorId: string,
    data: {
      amount: number;
      payment_method_id?: string;
      payment_date?: string;
      transaction_reference?: string | null;
      notes?: string | null;
    }
  ): Promise<ApiResponse<SponsorshipPaymentItem>> => {
    const response = await axiosClient.post<ApiResponse<SponsorshipPaymentItem>>(`/sponsors/${sponsorId}/payments`, data);
    return response.data;
  },

  getPayments: async (sponsorId: string): Promise<ApiResponse<SponsorshipPaymentItem[]>> => {
    const response = await axiosClient.get<ApiResponse<SponsorshipPaymentItem[]>>(`/sponsors/${sponsorId}/payments`);
    return response.data;
  },
};
