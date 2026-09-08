import axiosClient from './axiosClient';
import {
  ApiResponse,
  EventCollectionItem,
  EventCollectionsDashboardData,
  PaginatedResponse,
  PaymentItem,
  QueryParams,
} from '../types';

export const collectionsService = {
  getAll: async (params?: QueryParams): Promise<PaginatedResponse<EventCollectionItem>> => {
    const response = await axiosClient.get<PaginatedResponse<EventCollectionItem>>('/collections', {
      params,
    });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<EventCollectionItem>> => {
    const response = await axiosClient.get<ApiResponse<EventCollectionItem>>(`/collections/${id}`);
    return response.data;
  },

  create: async (data: {
    event_id: string;
    flat_id?: string | null;
    bungalow_id?: string | null;
    default_amount?: number;
    custom_amount?: number | null;
    status?: string;
  }): Promise<ApiResponse<EventCollectionItem>> => {
    const response = await axiosClient.post<ApiResponse<EventCollectionItem>>('/collections', data);
    return response.data;
  },

  update: async (
    id: string,
    data: { custom_amount?: number | null; status?: string }
  ): Promise<ApiResponse<EventCollectionItem>> => {
    const response = await axiosClient.patch<ApiResponse<EventCollectionItem>>(`/collections/${id}`, data);
    return response.data;
  },

  listByEvent: async (
    eventId: string,
    params?: QueryParams
  ): Promise<PaginatedResponse<EventCollectionItem>> => {
    const response = await axiosClient.get<PaginatedResponse<EventCollectionItem>>(
      `/events/${eventId}/collections`,
      {
        params,
      }
    );
    return response.data;
  },

  recordPayment: async (
    collectionId: string,
    payload: {
      amount: number;
      payment_method: string;
      payment_date?: string;
      cheque_number?: string | null;
      bank_name?: string | null;
      cheque_date?: string | null;
      transaction_reference?: string | null;
      notes?: string | null;
    }
  ): Promise<ApiResponse<{ payment: PaymentItem; collection: EventCollectionItem }>> => {
    const response = await axiosClient.post<
      ApiResponse<{ payment: PaymentItem; collection: EventCollectionItem }>
    >(`/collections/${collectionId}/payments`, payload);
    return response.data;
  },

  getPaymentHistory: async (collectionId: string): Promise<ApiResponse<PaymentItem[]>> => {
    const response = await axiosClient.get<ApiResponse<PaymentItem[]>>(
      `/collections/${collectionId}/payments`
    );
    return response.data;
  },

  generate: async (
    eventId: string
  ): Promise<
    ApiResponse<{
      eventId: string;
      societyId: string;
      totalFlats: number;
      totalBungalows: number;
      newlyGenerated: number;
    }>
  > => {
    const response = await axiosClient.post<
      ApiResponse<{
        eventId: string;
        societyId: string;
        totalFlats: number;
        totalBungalows: number;
        newlyGenerated: number;
      }>
    >(`/events/${eventId}/collections/generate`);
    return response.data;
  },

  bulkMarkPaid: async (payload: {
    collection_ids: string[];
    payment_method: string;
    payment_date?: string;
    notes?: string | null;
  }): Promise<ApiResponse<{ totalSelected: number; processed: number }>> => {
    const response = await axiosClient.post<ApiResponse<{ totalSelected: number; processed: number }>>(
      '/collections/bulk-pay',
      payload
    );
    return response.data;
  },

  bulkUpdateAmount: async (payload: {
    collection_ids: string[];
    amount: number;
  }): Promise<ApiResponse<{ totalSelected: number; updated: number }>> => {
    const response = await axiosClient.post<ApiResponse<{ totalSelected: number; updated: number }>>(
      '/collections/bulk-update-amount',
      payload
    );
    return response.data;
  },

  exportCsv: async (eventId: string): Promise<Blob> => {
    const response = await axiosClient.get(`/events/${eventId}/collections/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  getDashboardByEvent: async (eventId: string): Promise<ApiResponse<EventCollectionsDashboardData>> => {
    const response = await axiosClient.get<ApiResponse<EventCollectionsDashboardData>>(
      `/events/${eventId}/collections/dashboard`
    );
    return response.data;
  },
};
