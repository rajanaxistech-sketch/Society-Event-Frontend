import axiosClient from './axiosClient';
import { ApiResponse, EventContractItem, VendorPaymentItem, PaginatedResponse, QueryParams } from '../types';

export const eventVendorsService = {
  listByEvent: async (
    eventId: string,
    params?: QueryParams & { contractType?: string; status?: string }
  ): Promise<PaginatedResponse<EventContractItem>> => {
    const response = await axiosClient.get<PaginatedResponse<EventContractItem>>(
      `/events/${eventId}/vendors`,
      { params }
    );
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<EventContractItem>> => {
    const response = await axiosClient.get<ApiResponse<EventContractItem>>(`/event-vendors/${id}`);
    return response.data;
  },

  create: async (payload: {
    event_id: string;
    contract_type: string;
    vendor_name: string;
    contact_person?: string | null;
    mobile_number?: string | null;
    email?: string | null;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    contract_amount: number;
    advance_payment?: number;
    notes?: string | null;
    status?: string;
  }): Promise<ApiResponse<EventContractItem>> => {
    const response = await axiosClient.post<ApiResponse<EventContractItem>>(
      `/events/${payload.event_id}/vendors`,
      payload
    );
    return response.data;
  },

  update: async (
    id: string,
    payload: Partial<{
      contract_type: string;
      vendor_name: string;
      contact_person?: string | null;
      mobile_number?: string | null;
      email?: string | null;
      description?: string | null;
      start_date?: string | null;
      end_date?: string | null;
      contract_amount: number;
      advance_payment: number;
      notes?: string | null;
      status?: string;
    }>
  ): Promise<ApiResponse<EventContractItem>> => {
    const response = await axiosClient.patch<ApiResponse<EventContractItem>>(
      `/event-vendors/${id}`,
      payload
    );
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> => {
    const response = await axiosClient.delete<ApiResponse<{ id: string; deleted: boolean }>>(
      `/event-vendors/${id}`
    );
    return response.data;
  },

  recordPayment: async (
    contractId: string,
    payload: {
      amount: number;
      payment_date?: string;
      payment_method: string;
      reference_number?: string | null;
      cheque_number?: string | null;
      bank_name?: string | null;
      cheque_date?: string | null;
      remarks?: string | null;
      attachment_url?: string | null;
    }
  ): Promise<ApiResponse<{ payment: VendorPaymentItem; contract: EventContractItem }>> => {
    const response = await axiosClient.post<
      ApiResponse<{ payment: VendorPaymentItem; contract: EventContractItem }>
    >(`/event-vendors/${contractId}/payments`, payload);
    return response.data;
  },

  getPaymentHistory: async (contractId: string): Promise<ApiResponse<VendorPaymentItem[]>> => {
    const response = await axiosClient.get<ApiResponse<VendorPaymentItem[]>>(
      `/event-vendors/${contractId}/payments`
    );
    return response.data;
  },
};
